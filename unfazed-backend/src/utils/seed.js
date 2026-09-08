require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Session = require('../models/Session');
const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');
const Availability = require('../models/Availability');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clear existing data
  await SubscriptionTierConfig.deleteMany({});
  await Therapist.deleteMany({});
  await Client.deleteMany({});
  await Session.deleteMany({});
  await Availability.deleteMany({});

  // ── Seed Subscription Tiers ──
  await SubscriptionTierConfig.insertMany([
    {
      tier: 'free',
      displayName: 'Free',
      priceMonthly: 0,
      maxActiveClients: 5,
      maxSessionsPerMonth: 20,
      features: {
        analyticsDepth: 'basic',
        noteTemplates: false,
        packageSales: false,
        customBranding: false,
        whatsappNotifications: false,
        exportReports: false,
      },
    },
    {
      tier: 'basic',
      displayName: 'Basic',
      priceMonthly: 999,
      maxActiveClients: 20,
      maxSessionsPerMonth: 80,
      features: {
        analyticsDepth: 'basic',
        noteTemplates: true,
        packageSales: true,
        customBranding: false,
        whatsappNotifications: false,
        exportReports: false,
      },
    },
    {
      tier: 'pro',
      displayName: 'Pro',
      priceMonthly: 2499,
      maxActiveClients: 999,
      maxSessionsPerMonth: 999,
      features: {
        analyticsDepth: 'advanced',
        noteTemplates: true,
        packageSales: true,
        customBranding: true,
        whatsappNotifications: true,
        exportReports: true,
      },
    },
  ]);
  console.log('✅ Subscription tiers seeded');

  // ── Seed Demo Therapist ──
  const therapist = await Therapist.create({
    name: 'Dr. Priya Sharma',
    email: 'priya@demo.com',
    password_hash: 'password123', // will be hashed by pre-save hook
    slug: 'dr-priya-sharma',
    bio: 'Clinical psychologist with 10 years of experience in CBT and mindfulness.',
    specializations: ['Anxiety', 'Depression', 'Relationship Issues'],
    languages: ['English', 'Hindi'],
    subscriptionTier: 'pro',
  });
  console.log(`✅ Demo therapist created: ${therapist.email}`);

  // Set availability
  await Availability.create({
    therapist_id: therapist._id,
    weeklyTemplate: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, // Monday
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' }, // Tuesday
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' }, // Wednesday
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' }, // Thursday
      { dayOfWeek: 5, startTime: '09:00', endTime: '14:00' }, // Friday
    ],
    sessionDurations: [50, 90],
    bufferTime: 10,
    timezone: 'Asia/Kolkata',
  });
  console.log('✅ Availability set for demo therapist');

  // ── Seed 5 Demo Clients ──
  const clientData = [
    { name: 'Rahul Verma', email: 'rahul@client.com', phone: '9876543210', status: 'active', tags: ['CBT'] },
    { name: 'Ananya Singh', email: 'ananya@client.com', phone: '9876543211', status: 'active', tags: ['Mindfulness'] },
    { name: 'Vikram Patel', email: 'vikram@client.com', phone: '9876543212', status: 'active', tags: ['Anxiety'] },
    { name: 'Meera Nair', email: 'meera@client.com', phone: '9876543213', status: 'inactive', tags: [] },
    { name: 'Arjun Mehta', email: 'arjun@client.com', phone: '9876543214', status: 'active', tags: ['Depression'] },
  ];

  const clients = await Client.insertMany(
    clientData.map((c) => ({ ...c, therapist_id: therapist._id, consentGiven: true, consentTimestamp: new Date() }))
  );
  console.log(`✅ ${clients.length} demo clients seeded`);

  // ── Seed a few sessions ──
  const now = new Date();
  await Session.insertMany([
    {
      therapist_id: therapist._id,
      client_id: clients[0]._id,
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // tomorrow
      endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
      duration: 50,
      status: 'scheduled',
      paymentStatus: 'pending',
      amount: 150000, // ₹1500 in paise
    },
    {
      therapist_id: therapist._id,
      client_id: clients[1]._id,
      startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // last week
      endTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
      duration: 50,
      status: 'completed',
      paymentStatus: 'paid',
      amount: 150000,
    },
  ]);
  console.log('✅ Demo sessions seeded');

  console.log('\n🎉 Seed complete!');
  console.log('   Login with: priya@demo.com / password123');
  mongoose.disconnect();
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect();
});
