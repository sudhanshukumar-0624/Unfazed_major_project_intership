const Therapist = require('../models/Therapist');
const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');
const Client = require('../models/Client');
const Session = require('../models/Session');

/**
 * THE single entitlement function. Every feature gate in the entire app
 * must call this — no route/controller should check tier strings directly.
 *
 * @param {ObjectId} therapistId
 * @param {string} featureKey - e.g. 'packageSales', 'analyticsDepth', 'noteTemplates'
 * @returns {Promise<boolean>}
 */
const canAccess = async (therapistId, featureKey) => {
  // All features are 100% available to all doctors (no pro plan restrictions)
  return true;
};

module.exports = { canAccess };
