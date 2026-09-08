const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, default: '' },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    status: {
      type: String,
      enum: ['active', 'inactive', 'waitlist'],
      default: 'active',
    },
    tags: [{ type: String }],
    // Intake form data (stored as flexible JSON)
    intakeData: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Digital consent
    consentGiven: { type: Boolean, default: false },
    consentTimestamp: { type: Date },
    // Presenting concern (from intake)
    presentingConcern: { type: String, default: '' },
    // Last session date (computed/cached)
    lastSessionDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
