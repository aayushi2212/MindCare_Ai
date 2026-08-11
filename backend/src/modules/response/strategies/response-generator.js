/**
 * PURPOSE
 * -------
 * Generates the final response text given a resolved strategy and
 * the normalised input (user message, emotion, context).
 *
 * This is the Version 1 implementation — deterministic, template-based.
 * It is isolated behind a clear interface so a future LLM-based generator
 * can replace it without changing anything above this layer.
 *
 * INTERFACE
 * ---------
 * generateResponse(input, strategy) → { message, strategy, metadata }
 *
 * RESPONSIBILITIES
 * ----------------
 * - Select contextually appropriate templates for the given strategy
 * - Incorporate conversation context to personalise the response
 * - Append journaling suggestion when appropriate for the strategy
 * - Append breathing suggestion when appropriate for the strategy
 * - Return a structured result object
 *
 * NEVER
 * -----
 * - Detect emotions or recalculate confidence
 * - Query the database
 * - Make HTTP requests
 * - Contain strategy-selection logic
 * - Import from other feature modules
 * - Make medical claims or present breathing as treatment
 *
 * EXPORTS
 * -------
 * generateResponse
 *
 * DEPENDS ON
 * ----------
 * response.constants, response.errors
 */

import RESPONSE from '../constants/response.constants.js';
import {
  ResponseGenerationError,
  InvalidGeneratedResponseError,
} from '../errors/response.errors.js';

// ── Template bank ─────────────────────────────────────────────────

const TEMPLATES = Object.freeze({

  [RESPONSE.STRATEGY.EMPATHETIC_SUPPORT]: Object.freeze({
    openers: [
      "I'm really sorry to hear that.",
      "That sounds incredibly difficult.",
      "I can hear how much pain you're in right now.",
      "That must be really hard to go through.",
    ],
    bridges: [
      "It's completely understandable to feel this way.",
      "Your feelings are valid.",
      "It makes sense that this is weighing on you.",
    ],
    followUps: [
      "Would you like to talk about what happened?",
      "Is there anything specific on your mind that you'd like to share?",
      "What has this experience been like for you?",
      "How long have you been feeling this way?",
    ],
  }),

  [RESPONSE.STRATEGY.CALMING_SUPPORT]: Object.freeze({
    openers: [
      "It sounds like you're feeling quite overwhelmed right now.",
      "I can sense a lot of tension in what you're sharing.",
      "Feeling this way can be really unsettling.",
      "It sounds like things feel very uncertain for you right now.",
    ],
    bridges: [
      "You're not alone in this — many people experience moments like these.",
      "It's okay to pause and give yourself some space.",
      "Taking things one step at a time can help when everything feels like too much.",
    ],
    followUps: [
      "What feels most pressing to you right now?",
      "Is there one thing that's causing you the most worry?",
      "Would it help to talk through what's on your mind?",
      "What would feel like a manageable first step for you?",
    ],
  }),

  [RESPONSE.STRATEGY.DE_ESCALATION]: Object.freeze({
    openers: [
      "It sounds like you're feeling really frustrated.",
      "I can hear that you're upset, and that's completely understandable.",
      "Strong feelings like this often signal that something important is happening.",
      "It sounds like something has really gotten under your skin.",
    ],
    bridges: [
      "Your feelings make sense given what you've described.",
      "It's okay to feel this way — these are real and valid emotions.",
      "Sometimes naming what we're feeling can help us understand it better.",
    ],
    followUps: [
      "What do you think is at the root of how you're feeling?",
      "Would you like to walk me through what happened?",
      "What would feel like a good outcome from this situation for you?",
      "Is there anything that has helped you in moments like this before?",
    ],
  }),

  [RESPONSE.STRATEGY.POSITIVE_ENGAGEMENT]: Object.freeze({
    openers: [
      "It's wonderful to hear you're feeling positive!",
      "That sounds really uplifting.",
      "I'm glad things are going well for you.",
      "It sounds like you're in a really good place right now.",
    ],
    bridges: [
      "It's great that you're experiencing these positive feelings.",
      "Moments like these are worth appreciating.",
      "It's meaningful to recognise when things are going well.",
    ],
    followUps: [
      "What do you think has contributed to how you're feeling?",
      "Is there anything you'd like to build on from here?",
      "What has this positive experience meant for you?",
      "How can you carry this feeling forward?",
    ],
  }),

  [RESPONSE.STRATEGY.CURIOUS_ENGAGEMENT]: Object.freeze({
    openers: [
      "That sounds unexpected!",
      "It seems like something has caught you off guard.",
      "Surprises can bring up all sorts of feelings.",
      "That sounds like it came out of nowhere.",
    ],
    bridges: [
      "It's natural to need a moment to process something surprising.",
      "Taking time to reflect on unexpected events can be really valuable.",
    ],
    followUps: [
      "How are you feeling about it now that you've had a moment to take it in?",
      "What was your first reaction when it happened?",
      "Would you like to talk through what this means for you?",
    ],
  }),

  [RESPONSE.STRATEGY.NEUTRAL_SUPPORT]: Object.freeze({
    openers: [
      "Thank you for sharing that with me.",
      "I appreciate you opening up.",
      "I'm here and I'm listening.",
      "It's good that you're talking about this.",
    ],
    bridges: [
      "I want to make sure I understand what you're going through.",
      "Every experience is worth exploring.",
    ],
    followUps: [
      "How are you feeling overall?",
      "Is there something specific you'd like to focus on today?",
      "What's been on your mind lately?",
      "How can I best support you right now?",
    ],
  }),
});

// ── Supplementary suggestion templates ────────────────────────────

const JOURNALING_SUGGESTIONS = Object.freeze([
  "If you'd like, writing down what happened and how it made you feel could help you process it.",
  "Sometimes putting your thoughts on paper can make them easier to work through — it might be worth trying.",
  "Keeping a brief journal about these moments can be a gentle way to understand your feelings over time.",
]);

const BREATHING_SUGGESTIONS = Object.freeze([
  "If it feels helpful, try taking a few slow, steady breaths before deciding what to do next.",
  "Pausing for a couple of deep, calm breaths can sometimes help when things feel intense.",
  "When you're ready, a few slow breaths can give you a moment of space to collect yourself.",
]);

// ── Context extraction helpers ─────────────────────────────────────

function findRelevantContext(recentMessages, currentMessage) {
  if (!recentMessages || recentMessages.length === 0) return null;
  const priorUserMessages = recentMessages.filter((m) => m.role === 'user');
  return priorUserMessages.length > 0
    ? priorUserMessages[priorUserMessages.length - 1].content
    : null;
}

function buildContextPrefix(priorMessage) {
  if (!priorMessage) return '';
  const trimmed = priorMessage.length > 80
    ? priorMessage.slice(0, 77) + '...'
    : priorMessage;
  return `I remember you mentioned "${trimmed}". `;
}

// ── Deterministic selection (round-robin by hash) ─────────────────

function pick(arr, seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return arr[hash % arr.length];
}

// ── Suggestion helpers ────────────────────────────────────────────

/**
 * Return a journaling suggestion string if the strategy supports it,
 * otherwise return an empty string.
 *
 * @param {string} strategy
 * @param {string} seed
 * @returns {string}
 */
function buildJournalingSuggestion(strategy, seed) {
  if (!RESPONSE.JOURNALING_STRATEGIES.includes(strategy)) return '';
  return ' ' + pick(JOURNALING_SUGGESTIONS, seed + 'j');
}

/**
 * Return a breathing suggestion string if the strategy supports it,
 * otherwise return an empty string.
 *
 * @param {string} strategy
 * @param {string} seed
 * @returns {string}
 */
function buildBreathingSuggestion(strategy, seed) {
  if (!RESPONSE.BREATHING_STRATEGIES.includes(strategy)) return '';
  return ' ' + pick(BREATHING_SUGGESTIONS, seed + 'br');
}

// ── Public interface ───────────────────────────────────────────────

/**
 * Generate a supportive response for the given strategy and input.
 *
 * @param {Object} input
 * @param {string}  input.userMessage
 * @param {Object}  input.emotion         — { label, confidence, secondaryEmotion }
 * @param {Object}  input.context         — { recentMessages, messageCount, lastInteraction }
 * @param {Object}  input.safety          — { status }
 *
 * @param {string} strategy — one of RESPONSE.STRATEGY values
 *
 * @returns {{ message: string, strategy: string, metadata: Object }}
 *
 * @throws {ResponseGenerationError}      — if templates are missing
 * @throws {InvalidGeneratedResponseError} — if produced message is invalid
 */
export function generateResponse(input, strategy) {
  const templates = TEMPLATES[strategy];

  if (!templates) {
    throw new ResponseGenerationError(
      `No templates found for strategy: ${strategy}`
    );
  }

  const { userMessage, emotion, context } = input;
  const recentMessages = context?.recentMessages ?? [];

  // Seed for deterministic selection
  const seed = `${userMessage}${emotion.label}`;

  const opener   = pick(templates.openers,   seed);
  const bridge   = pick(templates.bridges,   seed + 'b');
  const followUp = pick(templates.followUps, seed + 'f');

  // Context awareness — prefix with prior message if relevant
  const priorMessage  = findRelevantContext(recentMessages, userMessage);
  const contextPrefix = buildContextPrefix(priorMessage);

  // Strategy-dependent supplementary suggestions
  const journalingSuggestion = buildJournalingSuggestion(strategy, seed);
  const breathingSuggestion  = buildBreathingSuggestion(strategy, seed);

  const message = `${contextPrefix}${opener} ${bridge} ${followUp}${journalingSuggestion}${breathingSuggestion}`.trim();

  // Validate produced message
  if (!message || message.length < RESPONSE.MIN_RESPONSE_LENGTH) {
    throw new InvalidGeneratedResponseError(
      'Generated response is too short to be useful'
    );
  }

  if (message.length > RESPONSE.MAX_RESPONSE_LENGTH) {
    throw new InvalidGeneratedResponseError(
      'Generated response exceeds maximum allowed length'
    );
  }

  return {
    message,
    strategy,
    metadata: {
      emotion:              emotion.label,
      confidence:           emotion.confidence,
      contextualised:       !!priorMessage,
      journalingSuggested:  journalingSuggestion.length > 0,
      breathingSuggested:   breathingSuggestion.length > 0,
    },
  };
}
