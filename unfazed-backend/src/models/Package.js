const mongoose = require('mongoose');

// Package template (defined by therapist)
const packageSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: true,
    },
    name: { type: String, required: true }, // e.g. "3-Session Starter"
    sessionCount: { type: Number, required: true }, // 3, 6, or 12
    pricePerSession: { type: Number, required: true }, // in INR
    totalPrice: { type: Number, required: true },      // sessionCount * pricePerSession
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Package', packageSchema);
