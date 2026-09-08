const express = require('express');
const router = express.Router();
const {
  getAvailability, setAvailability, getOpenSlots, bookSession, getSessions, updateSession, sendReminders,
} = require('../controllers/schedulingController');
const { protect } = require('../middleware/authMiddleware');

// Private routes
router.get('/availability', protect, getAvailability);
router.put('/availability', protect, setAvailability);
router.get('/sessions', protect, getSessions);
router.put('/sessions/:id', protect, updateSession);
router.post('/send-reminders', protect, sendReminders);

// Public routes (client portal)
router.get('/:therapistId/slots', getOpenSlots);
router.post('/book', bookSession);

module.exports = router;
