const Session = require('../models/Session');
const Client = require('../models/Client');
const Payment = require('../models/Payment');
const entitlementService = require('../services/entitlementService');

// @desc    Get analytics dashboard data
// @route   GET /api/analytics
// @access  Private
const getAnalytics = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const isAdvanced = await entitlementService.canAccess(therapistId, 'advancedAnalytics');

    // ── Basic analytics (all tiers) ──
    const totalClients = await Client.countDocuments({ therapist_id: therapistId });
    const activeClients = await Client.countDocuments({ therapist_id: therapistId, status: 'active' });
    const totalSessions = await Session.countDocuments({ therapist_id: therapistId });
    const completedSessions = await Session.countDocuments({ therapist_id: therapistId, status: 'completed' });
    const noShowSessions = await Session.countDocuments({ therapist_id: therapistId, status: 'no_show' });
    const noShowRate = totalSessions > 0 ? ((noShowSessions / totalSessions) * 100).toFixed(1) : 0;

    // Revenue (basic)
    const revenueData = await Payment.aggregate([
      { $match: { therapist_id: therapistId, status: 'paid' } },
      { $group: { _id: null, grossRevenue: { $sum: '$amount' }, totalRevenue: { $sum: '$amount' }, netRevenue: { $sum: '$net_amount' } } },
    ]);
    const grossRevenue = revenueData[0]?.grossRevenue || 0;
    const netRevenue = revenueData[0]?.netRevenue || 0;

    const basicData = {
      totalClients,
      activeClients,
      totalSessions,
      completedSessions,
      noShowSessions,
      noShowRate: `${noShowRate}%`,
      totalRevenue: grossRevenue / 100, // Gross amount collected (e.g. ₹1500)
      netRevenue: netRevenue / 100,     // Net earned after 2% platform fee (e.g. ₹1470)
    };

    if (!isAdvanced) {
      return res.json({ ...basicData, isAdvanced: false });
    }

    // ── Advanced analytics (pro tier) — MongoDB aggregation pipelines ──

    // Revenue trend by month
    const revenueTrend = await Payment.aggregate([
      { $match: { therapist_id: therapistId, status: 'paid' } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          revenue: { $sum: '$net_amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Session status breakdown
    const sessionBreakdown = await Session.aggregate([
      { $match: { therapist_id: therapistId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // New clients per month
    const clientGrowth = await Client.aggregate([
      { $match: { therapist_id: therapistId } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          newClients: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      ...basicData,
      isAdvanced: true,
      revenueTrend,
      sessionBreakdown,
      clientGrowth,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics };
