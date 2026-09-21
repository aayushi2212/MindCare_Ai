/**
 * PURPOSE
 * -------
 * Central source of truth for all safety module constants.
 * Crisis patterns, response text, resources, and status values all
 * live here so they are never scattered across controllers or services.
 *
 * NEVER
 * -----
 * - Import from external services
 * - Contain business logic
 * - Expose detection internals to API responses
 *
 * EXPORTS
 * -------
 * SAFETY_STATUS, RISK_LEVEL, SAFETY_CATEGORY, SAFETY_ACTION,
 * CRISIS_PATTERNS, CRISIS_RESPONSE_TEXT, SAFETY_RESOURCES
 */

// ── Status codes ────────────────────────────────────────────────────
export const SAFETY_STATUS = Object.freeze({
  SAFE:      'safe',
  HIGH_RISK: 'high_risk',
});

// ── Risk level ──────────────────────────────────────────────────────
export const RISK_LEVEL = Object.freeze({
  NONE:   'NONE',
  HIGH:   'HIGH',
});

// ── Detection category ──────────────────────────────────────────────
export const SAFETY_CATEGORY = Object.freeze({
  CRISIS:            'CRISIS',
  SELF_HARM:         'SELF_HARM',
  SUICIDAL_IDEATION: 'SUICIDAL_IDEATION',
});

// ── Pipeline action ─────────────────────────────────────────────────
export const SAFETY_ACTION = Object.freeze({
  CONTINUE:        'CONTINUE',
  CRISIS_RESPONSE: 'CRISIS_RESPONSE',
});

// ── Crisis phrase patterns ──────────────────────────────────────────
// Organised by category for maintainability.
// DO NOT expose these patterns in any API response.
//
// Design intent: patterns must be precise enough to avoid false
// positives on contextual or educational statements while still
// catching clear first-person self-harm or suicidal ideation.
//
// FALSE-POSITIVE GUARD RULES
// --------------------------
// • A sensitive word alone (suicide, overdose, death) does NOT trigger.
// • Triggering requires either:
//     – first-person phrasing  ("I want to…", "I feel…", "I am…"), OR
//     – the term used as a self-referential adjective ("suicidal"), OR
//     – a direct self-harm action verb ("cut myself", "hurt myself").
// • Educational / third-party statements ("suicide prevention",
//   "someone overdosed at a party") are intentionally excluded.

export const CRISIS_PATTERNS = Object.freeze({
  // ── Suicidal ideation ─────────────────────────────────────────
  // Catches first-person intent and the adjective "suicidal" (which
  // is almost always self-referential in conversational use).
  // Excludes noun phrases like "suicide prevention", "suicide awareness",
  // "suicide statistics" by avoiding bare /\bsuicid/i.
  SUICIDAL_IDEATION: [
    // First-person intent to commit suicide
    /\b(i('?m)?|i\s+feel|i\s+am|i\s+want\s+to|i'?m\s+thinking\s+(about|of)|thinking\s+(about|of)|considering|going\s+to|will)\s+(commit\s+)?suicid/i,
    // "suicidal" as adjective (self-referential) — excludes trailing
    // educational qualifiers like "prevention", "awareness", "statistics"
    /\bsuicidal\b(?!\s*(prevention|awareness|statistics|research|study|hotline|helpline))/i,
    // Direct "commit suicide" phrasing
    /\bcommit\s+suicide\b/i,
    // First-person suicide attempt reference
    /\b(my|an?)\s+suicide\s+attempt\b/i,
    // Classic self-harm intent phrases
    /\bkill\s*(my)?self/i,                // kill myself / kill self
    /\bend\s+my\s+life/i,                 // end my life
    /\btake\s+my\s+(own\s+)?life/i,       // take my life / take my own life
    /\bwant\s+to\s+die\b/i,               // want to die
    /\bno\s+reason\s+to\s+(keep\s+)?live/i, // no reason to live / keep living
    /\bwish\s+I\s+(was|were|had)\s+(never\s+been\s+)?dead\b/i, // wish I was dead
    /\bready\s+to\s+die\b/i,
    /\bgoing\s+to\s+(end\s+it|end\s+my\s+life|die)\b/i,
    // First-person "don't want to live anymore/be alive" — requires "I" subject
    // and a terminating qualifier so we don't flag "I don't want to live far
    // from home" or similar housing/location contexts.
    /\bI\s+(don'?t|do\s+not|no\s+longer)\s+want\s+to\s+live\s+(anymore|any\s+more)\b/i,
    /\bI\s+(don'?t|do\s+not)\s+want\s+to\s+be\s+alive\b/i,
    // "I don't want to exist" / "I don't want to be here anymore"
    /\bI\s+(don'?t|do\s+not)\s+want\s+to\s+(exist|be\s+here\s+anymore)\b/i,
  ],

  // ── Self-harm behaviour ───────────────────────────────────────
  // "overdose" requires first-person context to avoid flagging
  // "overdose prevention" or "someone overdosed".
  SELF_HARM: [
    /\bself[.\s-]?harm/i,                 // self-harm / self harm / selfharm
    /\bcut\s+(my)?self\b/i,               // cut myself / cutself
    /\bhurt\s+(my)?self\b/i,              // hurt myself / hurtself
    /\bburn\s+(my)?self\b/i,              // burn myself
    // Overdose: require first-person action or explicit self-intent
    /\b(i('?m)?|i\s+want\s+to|going\s+to|will|took|taking|take|had|have)\s+(an?\s+)?overdose\b/i,
    /\boverdos(e|ing)\s+(on|myself)\b/i,
    /\bthinking\s+(of|about)\s+(an?\s+)?overdose\b/i,
  ],

  // ── Severe crisis statements ──────────────────────────────────
  SEVERE_CRISIS: [
    /\bcan'?t\s+go\s+on\b/i,             // can't go on
    /\bgive\s+up\s+on\s+(my\s+)?life\b/i, // give up on life
    /\bno\s+point\s+in\s+(living|being\s+alive)\b/i, // no point in living
    /\blife\s+is\s*(n'?t|not)\s+worth\s+(living|it)\b/i, // life isn't worth living
  ],
});

// ── Predefined crisis response ──────────────────────────────────────
// Calm, supportive, non-judgmental.
// NEVER generated by an AI model — always this exact constant.
// Does NOT make a generic "24/7" claim because not all listed resources
// operate 24 hours — each resource's own description states its hours.
export const CRISIS_RESPONSE_TEXT =
  "I'm really glad you reached out, and I want you to know you're not alone. " +
  "What you're feeling matters deeply. Please consider connecting with a crisis " +
  "helpline — trained counsellors are ready to listen and support you. " +
  "If you are in immediate danger, please call emergency services (112). " +
  "You deserve care and support, and help is available.";

// ── Emergency and professional resources ────────────────────────────
// Single source of truth — never hard-coded elsewhere.
// Appropriate for the application's intended deployment context (India + global).
// Hours are as verified — do not claim 24/7 for services that are not 24/7.
export const SAFETY_RESOURCES = Object.freeze({
  immediate: [
    {
      name:        'Emergency Services',
      number:      '112',
      description: 'India national emergency number (police, fire, ambulance)',
      region:      'India',
    },
    {
      name:        'iCall',
      number:      '9152987821',
      description: 'Psychological support helpline — Mon–Sat, 8 am–9 pm IST (TISS)',
      region:      'India',
    },
  ],

  professional: [
    {
      name:        'Vandrevala Foundation',
      number:      '+91 9999 666 555',
      description: '24/7 free mental health helpline — India (call or WhatsApp)',
      region:      'India',
    },
    {
      name:        'Snehi',
      number:      '044-24640050',
      description: 'Emotional support helpline — India (check website for hours)',
      region:      'India',
    },
  ],

  international: [
    {
      name:        'Find A Helpline',
      url:         'https://findahelpline.com',
      description: 'Locate verified crisis support in your country',
    },
  ],

  trusted_person: (
    'Consider reaching out to a trusted friend, family member, or ' +
    'someone you feel safe with right now. You do not have to face this alone.'
  ),
});
