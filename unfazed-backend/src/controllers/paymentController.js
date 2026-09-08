const getRazorpayInstance = require('../config/razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Session = require('../models/Session');
const ClientPackage = require('../models/ClientPackage');
const { generateInvoice } = require('../services/invoiceService');
const notificationService = require('../services/notificationService');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Public (client portal)
const createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', sessionId, packageId, therapistId, clientId } = req.body;

    const options = {
      amount: amount * 100, // Convert INR to paise
      currency,
      receipt: `rcpt_${Date.now()}`,
    };

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(options);
    const platform_fee = Math.round(amount * 0.02 * 100); // 2% platform fee in paise

    // Create pending payment record
    const payment = await Payment.create({
      therapist_id: therapistId,
      client_id: clientId,
      session_id: sessionId || undefined,
      package_id: packageId || undefined,
      razorpayOrderId: order.id,
      amount: order.amount,
      platform_fee,
      net_amount: order.amount - platform_fee,
      paymentType: packageId ? 'package' : 'session',
    });

    res.json({ orderId: order.id, amount: order.amount, currency, paymentId: payment._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Razorpay payment (webhook-safe)
// @route   POST /api/payments/verify
// @access  Public
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentDbId } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Update payment record
    const payment = await Payment.findByIdAndUpdate(
      paymentDbId,
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'paid',
      },
      { new: true }
    );

    // Update session payment status
    if (payment.session_id) {
      await Session.findByIdAndUpdate(payment.session_id, { paymentStatus: 'paid', razorpayPaymentId: razorpay_payment_id });
    }

    // Generate invoice
    const invoiceNumber = `INV-${Date.now()}`;
    const therapist = await Therapist.findById(payment.therapist_id);
    const client = await Client.findById(payment.client_id);

    const invoicePath = await generateInvoice({ payment, therapist, client, invoiceNumber });
    await Payment.findByIdAndUpdate(paymentDbId, {
      invoiceNumber,
      invoiceUrl: invoicePath,
    });

    // Fire notification
    notificationService.onPaymentReceived({ client, amount: payment.amount }).catch(console.error);

    res.json({ message: 'Payment verified successfully', invoiceNumber });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Razorpay webhook handler
// @route   POST /api/payments/webhook
// @access  Public (Razorpay servers)
const webhookHandler = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    if (event === 'payment.captured') {
      const paymentId = req.body.payload.payment.entity.id;
      await Payment.findOneAndUpdate({ razorpayPaymentId: paymentId }, { status: 'paid' });
    }

    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all payments for therapist
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ therapist_id: req.therapist._id })
      .populate('client_id', 'name email')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder, verifyPayment, webhookHandler, getPayments };
