const Therapist = require('../models/Therapist');
const { generateSlug } = require('../utils/generateSlug');

// @desc    Get therapist profile
// @route   GET /api/therapist/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const therapist = await Therapist.findById(req.therapist._id).select('-password_hash');
    res.json(therapist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update therapist profile
// @route   PUT /api/therapist/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, bio, specializations, languages, phone, ogTitle, ogDescription } = req.body;

    const therapist = await Therapist.findById(req.therapist._id);
    if (!therapist) return res.status(404).json({ message: 'Doctor profile not found' });

    if (name) therapist.name = name;
    if (bio !== undefined) therapist.bio = bio;
    if (specializations) therapist.specializations = specializations;
    if (languages) therapist.languages = languages;
    if (phone !== undefined) therapist.phone = phone;
    if (ogTitle !== undefined) therapist.ogTitle = ogTitle;
    if (ogDescription !== undefined) therapist.ogDescription = ogDescription;
    if (req.file) therapist.profilePic = `/uploads/${req.file.filename}`;

    const updated = await therapist.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      slug: updated.slug,
      bio: updated.bio,
      specializations: updated.specializations,
      languages: updated.languages,
      profilePic: updated.profilePic,
      subscriptionTier: updated.subscriptionTier,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const DEFAULT_DOCTOR_PROFILES = {
  'priya-sharma': {
    _id: 'doc-fallback-2',
    name: 'Dr. Priya Sharma',
    slug: 'priya-sharma',
    profilePic: 'https://images.unsplash.com/photo-1594824813566-78a0d922b910?w=300&auto=format&fit=crop&q=80',
    specializations: ['CBT Therapy', 'General Diagnosis', 'Psychology'],
    experienceYears: 12,
    education: 'MD Psychiatry, Johns Hopkins',
    certificate: 'Board Certified Psychiatrist',
    symptoms: 'Burnout, ADHD, Relationship Issues, Bipolar Disorder',
    languages: ['English', 'Hindi'],
    bio: 'MD Psychiatry & Clinical Psychologist. 12+ years experience in CBT, Anxiety, and Stress Management.',
  },
  'marcus-vance': {
    _id: 'doc-fallback-1',
    name: 'Dr. Marcus Vance',
    slug: 'marcus-vance',
    profilePic: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
    specializations: ['Psychology', 'CBT Therapy'],
    experienceYears: 12,
    education: 'PhD in Clinical Psychology, UCLA',
    certificate: 'Certified CBT Specialist, APA',
    symptoms: 'Anxiety & Panic Attacks, Stress, Depression, Sleep Disorders',
    languages: ['English', 'Spanish'],
    bio: 'Licensed mental health professional dedicated to providing compassionate, evidence-based therapy sessions.',
  },
  'sarah-jenkins': {
    _id: 'doc-fallback-3',
    name: 'Dr. Sarah Jenkins',
    slug: 'sarah-jenkins',
    profilePic: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
    specializations: ['Pediatrics', 'Psychology'],
    experienceYears: 14,
    education: 'PsyD Child & Adolescent Psychology',
    certificate: 'Pediatric Mental Health Fellow',
    symptoms: 'Child Behavioral Health, Adolescent Anxiety, Family Counseling',
    languages: ['English'],
    bio: 'Specialist in pediatric and adolescent mental wellness.',
  }
};

// @desc    Get public branded profile page by slug
// @route   GET /api/therapist/:slug (public)
// @access  Public
const getPublicProfile = async (req, res) => {
  try {
    const slugKey = req.params.slug?.toLowerCase().trim();
    const therapist = await Therapist.findOne({ slug: slugKey }).select(
      'name bio specializations languages profilePic ogTitle ogDescription slug'
    );
    if (therapist) {
      return res.json(therapist);
    }
    
    // Fallback to default doctor profile
    const fallback = DEFAULT_DOCTOR_PROFILES[slugKey] || DEFAULT_DOCTOR_PROFILES['priya-sharma'];
    res.json(fallback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all active therapists for public directory
// @route   GET /api/therapist/all (public)
// @access  Public
const getAllTherapists = async (req, res) => {
  try {
    const therapists = await Therapist.find({ isActive: true }).select(
      'name bio specializations languages profilePic ogTitle ogDescription slug phone createdAt'
    );
    
    // Deduplicate by normalized name
    const uniqueMap = new Map();
    therapists.forEach(t => {
      const key = (t.name || '').toLowerCase().trim();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, t);
      }
    });

    res.json(Array.from(uniqueMap.values()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, updateProfile, getPublicProfile, getAllTherapists };
