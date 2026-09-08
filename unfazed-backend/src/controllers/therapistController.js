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
    if (!therapist) return res.status(404).json({ message: 'Therapist not found' });

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

// @desc    Get public branded profile page by slug
// @route   GET /api/therapist/:slug (public)
// @access  Public
const getPublicProfile = async (req, res) => {
  try {
    const therapist = await Therapist.findOne({ slug: req.params.slug }).select(
      'name bio specializations languages profilePic ogTitle ogDescription slug'
    );
    if (!therapist) return res.status(404).json({ message: 'Therapist not found' });
    res.json(therapist);
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
