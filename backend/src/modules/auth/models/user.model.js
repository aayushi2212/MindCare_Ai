/**
 * PURPOSE
 * -------
 * Defines the Mongoose schema and model for the Users collection.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Define identity fields: fullName, email, passwordHash
 * - Define auth state fields: isVerified, accountStatus, lastLogin
 * - Hash password on save via pre-save hook
 * - Expose comparePassword() instance method
 * - Strip sensitive fields from JSON output
 *
 * NEVER
 * -----
 * - Store refresh tokens (RefreshToken collection handles this)
 * - Store profile preferences (User module handles this)
 * - Store chat, journal, or mood data
 *
 * DEPENDS ON
 * ----------
 * mongoose, bcryptjs, config/environment
 */

import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';
import env      from '../../../config/environment/index.js';

const ACCOUNT_STATUS = Object.freeze({
  ACTIVE:    'active',
  SUSPENDED: 'suspended',
  DELETED:   'deleted',
});

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type:      String,
      required:  [true, 'Full name is required'],
      trim:      true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type:     String,
      required: true,
      select:   false, // never returned in queries by default
    },
    profileImage: { type: String,  default: null },
    bio:          { type: String,  maxlength: [300, 'Bio cannot exceed 300 characters'], default: '' },
    isVerified:   { type: Boolean, default: false },
    accountStatus: {
      type:    String,
      enum:    Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE,
      index:   true,
    },
    lastLogin: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: false },
    toObject:   { virtuals: false },
  }
);

// ── Pre-save: hash password ───────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, env.BCRYPT_ROUNDS);
  next();
});

// ── Instance methods ──────────────────────────────────────────────
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

// ── Statics ───────────────────────────────────────────────────────
userSchema.statics.ACCOUNT_STATUS = ACCOUNT_STATUS;

export default mongoose.model('User', userSchema);
