const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
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
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
    },
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientPackage',
    },
    // Razorpay fields
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    // Amounts in paise (1 INR = 100 paise)
    amount: { type: Number, required: true },
    platform_fee: { type: Number, default: 0 },
    net_amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
    },
    // GST Invoice
    invoiceUrl: { type: String, default: '' },
    invoiceNumber: { type: String, default: '' },
    // Payment type
    paymentType: {
      type: String,
      enum: ['session', 'package'],
      default: 'session',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
