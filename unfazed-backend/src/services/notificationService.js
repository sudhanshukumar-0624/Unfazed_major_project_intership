const nodemailer = require('nodemailer');

// Create transporter (real email via Gmail, or stub for dev)
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  // In development, just log instead of sending
  return null;
};

/**
 * Stub: WhatsApp notifications (log + queue — real API needs business approval)
 */
const sendWhatsApp = async (phone, message) => {
  console.log(`[WhatsApp STUB] To: ${phone} | Message: ${message}`);
  // TODO: Integrate real WhatsApp Business API here when approved
};

/**
 * Send email notification
 */
const sendEmail = async ({ to, subject, html }) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Email STUB] To: ${to} | Subject: ${subject}`);
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Unfazed" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

/**
 * Domain event: Booking confirmed
 */
const onBookingConfirmed = async ({ therapist, client, session }) => {
  const dateStr = new Date(session.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const videoCallUrl = session.meetingLink || `https://meet.jit.si/Unfazed-Session-${session._id}`;

  // 1. Notify Client
  await sendEmail({
    to: client.email,
    subject: '1-on-1 Video Session Booked ✅',
    html: `
      <h2>Session Confirmed</h2>
      <p>Hi ${client.name}, your video therapy session with <strong>${therapist.name}</strong> is confirmed for <strong>${dateStr}</strong>.</p>
      <p style="margin-top: 16px;">
        <a href="${videoCallUrl}" style="background: #6c63ff; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          🎥 Join Video Call
        </a>
      </p>
      <p style="font-size: 12px; color: #888;">Meeting Link: ${videoCallUrl}</p>
    `,
  });
  if (client.phone) {
    await sendWhatsApp(client.phone, `Session confirmed for ${dateStr} with ${therapist.name}. Join Video Call: ${videoCallUrl}`);
  }

  // 2. Notify Therapist (Doctor)
  await sendEmail({
    to: therapist.email,
    subject: 'New Session Scheduled 📅',
    html: `
      <h2>New Client Booking</h2>
      <p>Doctor ${therapist.name}, you have a new session scheduled with client <strong>${client.name}</strong> for <strong>${dateStr}</strong>.</p>
      <p style="margin-top: 16px;">
        <a href="${videoCallUrl}" style="background: #6c63ff; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          🎥 Join Video Call
        </a>
      </p>
    `,
  });
};

/**
 * Domain event: Payment received
 */
const onPaymentReceived = async ({ client, amount }) => {
  await sendEmail({
    to: client.email,
    subject: 'Payment Received 💳',
    html: `<p>Hi ${client.name}, we received your payment of ₹${amount / 100}. Invoice attached.</p>`,
  });
};

/**
 * Domain event: Session reminder (to both Doctor and Client)
 */
const onSessionReminder = async ({ therapist, client, session }) => {
  const dateStr = new Date(session.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const videoCallUrl = session.meetingLink || `https://meet.jit.si/Unfazed-Session-${session._id}`;

  // Notify Client
  await sendEmail({
    to: client.email,
    subject: '⏰ Reminder: Upcoming 1-on-1 Video Session Today',
    html: `
      <h2>Session Reminder</h2>
      <p>Hi ${client.name}, your video session with <strong>${therapist.name}</strong> is starting soon at <strong>${dateStr}</strong>.</p>
      <p style="margin-top: 16px;">
        <a href="${videoCallUrl}" style="background: #2dce89; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          🎥 Join Video Call Now
        </a>
      </p>
    `,
  });
  if (client.phone) {
    await sendWhatsApp(client.phone, `Reminder: Your video session with ${therapist.name} is starting soon (${dateStr}). Join here: ${videoCallUrl}`);
  }

  // Notify Therapist (Doctor)
  await sendEmail({
    to: therapist.email,
    subject: '⏰ Reminder: Client Session Today',
    html: `
      <h2>Session Reminder for Doctor</h2>
      <p>Doctor ${therapist.name}, your session with <strong>${client.name}</strong> is scheduled for <strong>${dateStr}</strong>.</p>
      <p style="margin-top: 16px;">
        <a href="${videoCallUrl}" style="background: #2dce89; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          🎥 Join Video Call Now
        </a>
      </p>
    `,
  });
};

module.exports = {
  onBookingConfirmed,
  onPaymentReceived,
  onSessionReminder,
  sendEmail,
  sendWhatsApp,
};
