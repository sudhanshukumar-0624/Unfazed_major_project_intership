const entitlementService = require('../services/entitlementService');

// Factory function: returns middleware that checks a specific feature key
const requireFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      const therapistId = req.therapist._id;
      const allowed = await entitlementService.canAccess(therapistId, featureKey);
      if (!allowed) {
        return res.status(403).json({
          message: 'This feature is not available on your current plan.',
          upgradeRequired: true,
          featureKey,
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { requireFeature };
