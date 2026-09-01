/**
 * PURPOSE
 * -------
 * Stores minimal crisis audit records for operational oversight.
 *
 * DESIGN CONSTRAINTS (Blueprint §12)
 * -----------------------------------
 * - Records WHEN a crisis was detected and WHAT action was taken
 * - NEVER stores the raw crisis message content
 * - NEVER stores detection patterns
 * - Scoped to userId + conversationId for ownership queries
 *
 * SCHEMA
 * ------
 * userId         — who was involved (for ownership checks)
 * conversationId — which conversation (optional; may be null for edge cases)
 * riskLevel      — 'HIGH' (only HIGH events are logged)
 * category       — which pattern category fired (e.g. 'SUICIDAL_IDEATION')
 * action         — 'CRISIS_RESPONSE'
 * createdAt      — when it happened (TTL candidate for future GDPR)
 *
 * NEVER
 * -----
 * - Store message content
 * - Store raw pattern text
 * - Store personally identifying information beyond userId
 */

import mongoose from 'mongoose';
import { RISK_LEVEL, SAFETY_CATEGORY, SAFETY_ACTION } from '../constants/safety.constants.js';

const crisisAuditSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'userId is required for crisis audit records'],
      index:    true,
    },

    conversationId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Conversation',
      default: null,
      index:   true,
    },

    riskLevel: {
      type:     String,
      enum:     Object.values(RISK_LEVEL),
      required: [true, 'riskLevel is required'],
    },

    category: {
      type:     String,
      enum:     [...Object.values(SAFETY_CATEGORY), null],
      default:  null,
    },

    action: {
      type:     String,
      enum:     Object.values(SAFETY_ACTION),
      required: [true, 'action is required'],
    },
  },
  {
    timestamps: true,           // provides createdAt / updatedAt
    toJSON:     { virtuals: false },
    toObject:   { virtuals: false },
  }
);

// Compound index for owned-record queries
crisisAuditSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('CrisisAudit', crisisAuditSchema);
