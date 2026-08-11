/**
 * PURPOSE
 * -------
 * Maps normalised V1 blueprint emotion labels to display metadata
 * (colour, icon). Pure utility — no side effects.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Accept a normalised V1 emotion label string
 * - Return the corresponding display metadata object
 * - Fall back gracefully to neutral metadata for unknown labels
 *
 * NEVER
 * -----
 * - Make network calls
 * - Access the database
 * - Validate whether an emotion is supported (service layer does that)
 *
 * EXPORTS
 * -------
 * mapEmotion(label) → { colour, icon }
 *
 * DEPENDS ON
 * ----------
 * emotion.constants
 */

import EMOTION from '../constants/emotion.constants.js';

/**
 * Returns display metadata for a given emotion label.
 * Falls back to neutral if the label has no registered metadata.
 *
 * @param   {string} label — normalised V1 emotion label
 * @returns {{ colour: string, icon: string }}
 */
export const mapEmotion = (label) => {
  return EMOTION.META[label] ?? EMOTION.META[EMOTION.FALLBACK_EMOTION];
};

export default { mapEmotion };
