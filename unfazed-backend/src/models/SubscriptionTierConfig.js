const mongoose = require('mongoose');

// Subscription tier configuration — all feature gates defined here, NO hardcoded values
const subscriptionTierConfigSchema = new mongoose.Schema(
  {
    tier: {
      type: String,
      enum: ['free', 'basic', 'pro'],
      required: true,
      unique: true,
    },
    displayName: { type: String, required: true }, // "Free", "Basic", "Pro"
    priceMonthly: { type: Number, required: true }, // in INR
    // Feature caps
    maxActiveClients: { type: Number, default: 5 },
    maxSessionsPerMonth: { type: Number, default: 20 },
    // Feature flags (true/false)
    features: {
      analyticsDepth: { type: String, enum: ['basic', 'advanced'], default: 'basic' },
      noteTemplates: { type: Boolean, default: false },
      packageSales: { type: Boolean, default: false },
      customBranding: { type: Boolean, default: false },
      whatsappNotifications: { type: Boolean, default: false },
      exportReports: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionTierConfig', subscriptionTierConfigSchema);
