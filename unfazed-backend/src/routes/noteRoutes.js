const express = require('express');
const router = express.Router();
const { getNotes, getSharedNotes, createNote, updateNote, deleteNote } = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');

// Private (therapist only)
router.get('/', protect, getNotes);
router.post('/', protect, createNote);
router.put('/:id', protect, updateNote);
router.delete('/:id', protect, deleteNote);

// Public — ONLY shared notes (client portal)
router.get('/shared/:clientId', getSharedNotes);

module.exports = router;
