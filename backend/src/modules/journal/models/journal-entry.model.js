/**
 * PURPOSE
 * -------
 * Mongoose schema and model for a journal entry.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Define the JournalEntry document shape
 * - Enforce the V1 emotion vocabulary at the DB level
 * - Compound index: userId + createdAt (newest-first queries)
 *
 * NEVER
 * -----
 * - Contain business logic
 * - Reference other module models directly
 *
 * EXPORTS
 * -------
 * JournalEntry — Mongoose model
 *
 * DEPENDS ON
 * ----------
 * mongoose, journal.constants
 */

import mongoose from 'mongoose';
import JOURNAL  from '../constants/journal.constants.js';

const { Schema } = mongoose;

const journalEntrySchema = new Schema(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    emotion: {
      type:     String,
      enum:     JOURNAL.EMOTIONS,
      required: true,
    },

    reflection: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: JOURNAL.REFLECTION_MAX_LENGTH,
    },

    notes: {
      type:      String,
      trim:      true,
      maxlength: JOURNAL.NOTES_MAX_LENGTH,
      default:   null,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt automatically
  }
);

// Compound index for efficient per-user newest-first queries
journalEntrySchema.index({ userId: 1, createdAt: -1 });

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);

export default JournalEntry;
