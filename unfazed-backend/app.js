const express = require('express');
const cors = require('cors');
const path = require('path');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const therapistRoutes = require('./src/routes/therapistRoutes');
const clientRoutes = require('./src/routes/clientRoutes');
const schedulingRoutes = require('./src/routes/schedulingRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const noteRoutes = require('./src/routes/noteRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');

// Error handler
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// ── Middleware ──
app.use(cors({
  origin: (origin, callback) => {
    // Allow local development, Vercel frontend domain, or custom process.env.CLIENT_URL
    if (
      !origin ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      origin.includes('vercel.app') ||
      origin === (process.env.CLIENT_URL || 'https://unfazed-major-project-intership.vercel.app')
    ) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploaded profile pics, invoices)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Unfazed API is running 🚀', timestamp: new Date() });
});

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/therapist', therapistRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/analytics', analyticsRoutes);

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ──
app.use(errorHandler);

module.exports = app;
