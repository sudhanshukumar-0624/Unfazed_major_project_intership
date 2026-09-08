const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, webhookHandler, getPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Public (client portal)
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.post('/webhook', webhookHandler); // Razorpay webhook

// Private (therapist dashboard)
router.get('/', protect, getPayments);

module.exports = router;
