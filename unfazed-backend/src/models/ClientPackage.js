const mongoose = require('mongoose');

// Tracks a client's purchased package and remaining sessions
const clientPackageSchema = new mongoose.Schema(
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
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
    },
    totalSessions: { type: Number, required: true },
    sessionsUsed: { type: Number, default: 0 },
    sessionsRemaining: { type: Number, required: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'expired'],
      default: 'active',
    },
    expiryDate: { type: Date },
    purchasedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Auto-calculate sessionsRemaining before save
clientPackageSchema.pre('save', function (next) {
  this.sessionsRemaining = this.totalSessions - this.sessionsUsed;
  if (this.sessionsRemaining <= 0) this.status = 'completed';
  next();
});

module.exports = mongoose.model('ClientPackage', clientPackageSchema);
