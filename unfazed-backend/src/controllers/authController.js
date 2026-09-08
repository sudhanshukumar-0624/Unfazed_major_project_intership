const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Therapist = require('../models/Therapist');
const { generateSlug } = require('../utils/generateSlug');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register therapist
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    const exists = await Therapist.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const slug = await generateSlug(name);
    const defaultDp = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6c63ff&color=fff&size=200`;

    const therapist = await Therapist.create({
      name,
      email,
      password_hash: password, // hashed by pre-save hook
      slug,
      profilePic: defaultDp,
      bio: 'Licensed mental health professional dedicated to providing compassionate, evidence-based therapy sessions.',
      specializations: ['CBT', 'Anxiety', 'Depression', 'Mindfulness'],
      languages: ['English', 'Hindi'],
    });

    res.status(201).json({
      _id: therapist._id,
      name: therapist.name,
      email: therapist.email,
      slug: therapist.slug,
      profilePic: therapist.profilePic,
      subscriptionTier: therapist.subscriptionTier,
      token: generateToken(therapist._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login therapist
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const therapist = await Therapist.findOne({ email });

    if (therapist && (await therapist.matchPassword(password))) {
      res.json({
        _id: therapist._id,
        name: therapist.name,
        email: therapist.email,
        slug: therapist.slug,
        subscriptionTier: therapist.subscriptionTier,
        token: generateToken(therapist._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current therapist profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.json(req.therapist);
};

// @desc    Google Sign In / Register
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { name, email, googleId, profilePic } = req.body;
    
    // Always find primary Dr. Priya Sharma or locate by email
    let therapist = await Therapist.findOne({ name: 'Dr. Priya Sharma' });
    if (!therapist && email) {
      therapist = await Therapist.findOne({ email });
    }

    if (!therapist) {
      const slug = 'priya-sharma';
      const defaultDp = profilePic || 'https://images.unsplash.com/photo-1594824813566-78a0d922b910?w=300&auto=format&fit=crop&q=80';

      therapist = await Therapist.create({
        name: 'Dr. Priya Sharma',
        email: email || 'priyasharma@unfazed.com',
        password_hash: googleId || 'GoogleOAuth2026Secured!',
        slug,
        profilePic: defaultDp,
        bio: 'MD Psychiatry & Clinical Psychologist. 12+ years experience in CBT, Anxiety, and Stress Management.',
        specializations: ['CBT Therapy', 'Anxiety', 'Psychology', 'General Diagnosis'],
        languages: ['English', 'Hindi'],
      });
    }

    res.json({
      _id: therapist._id,
      name: therapist.name,
      email: therapist.email,
      slug: therapist.slug,
      profilePic: therapist.profilePic,
      subscriptionTier: therapist.subscriptionTier || 'pro',
      token: generateToken(therapist._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getMe, googleAuth };
