const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getProfile, updateProfile, getPublicProfile, getAllTherapists } = require('../controllers/therapistController');
const { protect } = require('../middleware/authMiddleware');

// Multer storage for profile pics
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.therapist._id}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// Public directory route — all active therapists
router.get('/directory/all', getAllTherapists);

// Private routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.single('profilePic'), updateProfile);

// Public route — branded page by slug
router.get('/:slug', getPublicProfile);

module.exports = router;
