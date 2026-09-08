const Availability = require('../models/Availability');
const Session = require('../models/Session');
const notificationService = require('../services/notificationService');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');

// @desc    Get availability settings for therapist
// @route   GET /api/scheduling/availability
// @access  Private
const getAvailability = async (req, res) => {
  try {
    const availability = await Availability.findOne({ therapist_id: req.therapist._id });
    res.json(availability || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Set / update availability
// @route   PUT /api/scheduling/availability
// @access  Private
const setAvailability = async (req, res) => {
  try {
    const { weeklyTemplate, overrides, sessionDurations, bufferTime, timezone } = req.body;

    const availability = await Availability.findOneAndUpdate(
      { therapist_id: req.therapist._id },
      { weeklyTemplate, overrides, sessionDurations, bufferTime, timezone },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(availability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const DEFAULT_SLOTS = [
  { _id: 'slot-1', startTime: '09:00', endTime: '09:50', displayTime: '09:00 AM - 09:50 AM' },
  { _id: 'slot-2', startTime: '10:30', endTime: '11:20', displayTime: '10:30 AM - 11:20 AM' },
  { _id: 'slot-3', startTime: '12:00', endTime: '12:50', displayTime: '12:00 PM - 12:50 PM' },
  { _id: 'slot-4', startTime: '14:30', endTime: '15:20', displayTime: '02:30 PM - 03:20 PM' },
  { _id: 'slot-5', startTime: '16:00', endTime: '16:50', displayTime: '04:00 PM - 04:50 PM' },
  { _id: 'slot-6', startTime: '18:00', endTime: '18:50', displayTime: '06:00 PM - 06:50 PM' },
];

// @desc    Get open slots for a therapist (client-facing)
// @route   GET /api/scheduling/:therapistId/slots?date=YYYY-MM-DD
// @access  Public
const getOpenSlots = async (req, res) => {
  try {
    const { therapistId } = req.params;
    const { date } = req.query;

    if (!date) return res.json({ slots: DEFAULT_SLOTS });

    let availability;
    try {
      availability = await Availability.findOne({ therapist_id: therapistId });
    } catch (e) {
      availability = null;
    }

    if (!availability || !availability.weeklyTemplate) {
      return res.json({ slots: DEFAULT_SLOTS });
    }

    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();

    // Check for override
    const override = availability.overrides?.find(
      (o) => new Date(o.date).toDateString() === requestedDate.toDateString()
    );
    if (override && override.isBlocked) return res.json({ slots: [] });

    // Get weekly template for that day
    const daySlots = override?.slots?.length
      ? override.slots
      : availability.weeklyTemplate.filter((s) => s.dayOfWeek === dayOfWeek);

    if (!daySlots || daySlots.length === 0) {
      return res.json({ slots: DEFAULT_SLOTS });
    }

    let existingBookings = [];
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      existingBookings = await Session.find({
        therapist_id: therapistId,
        startTime: { $gte: startOfDay, $lte: endOfDay },
        status: { $nin: ['cancelled'] },
      });
    } catch (e) {
      existingBookings = [];
    }

    const bookedTimes = existingBookings.map((s) => new Date(s.startTime).toTimeString().slice(0, 5));
    const openSlots = daySlots.filter((slot) => !bookedTimes.includes(slot.startTime));

    res.json({ slots: openSlots.length ? openSlots : DEFAULT_SLOTS });
  } catch (error) {
    res.json({ slots: DEFAULT_SLOTS });
  }
};

// @desc    Book a session (client-facing)
// @route   POST /api/scheduling/book
// @access  Public
const bookSession = async (req, res) => {
  try {
    const { therapistId, clientId, startTime, duration, timezone } = req.body;

    // Double-booking prevention
    const endTime = new Date(new Date(startTime).getTime() + duration * 60000);
    const conflict = await Session.findOne({
      therapist_id: therapistId,
      status: { $nin: ['cancelled'] },
      $or: [
        { startTime: { $lt: endTime, $gte: new Date(startTime) } },
      ],
    });
    if (conflict) return res.status(409).json({ message: 'This slot is no longer available.' });

    const meetingLink = req.body.meetingLink || `https://meet.jit.si/Unfazed-Session-${Date.now()}`;

    const session = await Session.create({
      therapist_id: therapistId,
      client_id: clientId,
      startTime,
      endTime,
      duration,
      meetingLink,
      timezone: timezone || 'Asia/Kolkata',
      bookedVia: 'client_portal',
    });

    // Fire notification (non-blocking)
    const therapist = await Therapist.findById(therapistId);
    const client = await Client.findById(clientId);
    notificationService.onBookingConfirmed({ therapist, client, session }).catch(console.error);

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all sessions for therapist
// @route   GET /api/scheduling/sessions
// @access  Private
const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ therapist_id: req.therapist._id })
      .populate('client_id', 'name email phone')
      .sort({ startTime: 1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update session status or meetingLink
// @route   PUT /api/scheduling/sessions/:id
// @access  Private
const updateSession = async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, therapist_id: req.therapist._id },
      req.body,
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Trigger reminder notifications for upcoming sessions
// @route   POST /api/scheduling/send-reminders
// @access  Private
const sendReminders = async (req, res) => {
  try {
    const therapistId = req.therapist._id;
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingSessions = await Session.find({
      therapist_id: therapistId,
      status: 'scheduled',
      startTime: { $gte: now, $lte: next24h },
      reminderSent: false,
    }).populate('client_id');

    const therapist = await Therapist.findById(therapistId);

    let sentCount = 0;
    for (const session of upcomingSessions) {
      if (session.client_id) {
        await notificationService.onSessionReminder({ therapist, client: session.client_id, session });
        session.reminderSent = true;
        await session.save();
        sentCount++;
      }
    }

    res.json({ message: `Sent ${sentCount} reminders successfully!`, sentCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAvailability, setAvailability, getOpenSlots, bookSession, getSessions, updateSession, sendReminders };
