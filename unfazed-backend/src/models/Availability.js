const mongoose = require('mongoose');

// Recurring weekly availability template
const timeSlotSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, required: true }, // 0=Sunday, 1=Monday ... 6=Saturday
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "17:00"
});

// One-time override (block a day or add extra slots)
const overrideSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  isBlocked: { type: Boolean, default: false }, // true = day off
  slots: [timeSlotSchema], // custom slots for that day
});

const availabilitySchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: true,
      unique: true,
    },
    weeklyTemplate: [timeSlotSchema],
    overrides: [overrideSchema],
    // Session durations offered (in minutes)
    sessionDurations: {
      type: [Number],
      default: [50],
    },
    // Buffer time between sessions (in minutes)
    bufferTime: { type: Number, default: 10 },
    // Timezone
    timezone: { type: String, default: 'Asia/Kolkata' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Availability', availabilitySchema);
