const SessionNote = require('../models/SessionNote');
const entitlementService = require('../services/entitlementService');

// @desc    Get notes for a client (private notes NEVER returned on client-facing route)
// @route   GET /api/notes?clientId=xxx&type=private|shared
// @access  Private (therapist only)
const getNotes = async (req, res) => {
  try {
    const { clientId, type } = req.query;
    const filter = { therapist_id: req.therapist._id };
    if (clientId) filter.client_id = clientId;
    if (type) filter.type = type;

    const notes = await SessionNote.find(filter).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get SHARED notes only (client portal — private notes NEVER exposed here)
// @route   GET /api/notes/shared/:clientId
// @access  Public (client portal)
const getSharedNotes = async (req, res) => {
  try {
    const notes = await SessionNote.find({
      client_id: req.params.clientId,
      type: 'shared', // STRICTLY shared only — never return private
    }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
  try {
    const { clientId, sessionId, type, content, template, templateData } = req.body;

    // Check note template entitlement
    if (template && template !== 'none') {
      const allowed = await entitlementService.canAccess(req.therapist._id, 'noteTemplates');
      if (!allowed) {
        return res.status(403).json({
          message: 'Note templates require a higher plan. Please upgrade.',
          upgradeRequired: true,
        });
      }
    }

    const note = await SessionNote.create({
      therapist_id: req.therapist._id,
      client_id: clientId,
      session_id: sessionId || undefined,
      type: type || 'private',
      content,
      template: template || 'none',
      templateData: templateData || {},
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res) => {
  try {
    const note = await SessionNote.findOneAndUpdate(
      { _id: req.params.id, therapist_id: req.therapist._id },
      req.body,
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res) => {
  try {
    const note = await SessionNote.findOneAndDelete({
      _id: req.params.id,
      therapist_id: req.therapist._id,
    });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNotes, getSharedNotes, createNote, updateNote, deleteNote };
