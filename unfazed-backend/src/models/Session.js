const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: true,
    },
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: { type: Number, required: true }, // in minutes: 30/45/60/90
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled',
    },
    // Payment info
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    amount: { type: Number, default: 0 }, // in INR (paise stored, display in rupees)
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    // Notes (references)
    notes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SessionNote' }],
    // Timezone info
    timezone: { type: String, default: 'Asia/Kolkata' },
    // Booking source
    bookedVia: { type: String, enum: ['therapist', 'client_portal'], default: 'therapist' },
    // 🎥 1-on-1 Video Call link & Reminder status
    meetingLink: { type: String, default: '' },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
