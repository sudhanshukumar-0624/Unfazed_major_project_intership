const mongoose = require('mongoose');

const sessionNoteSchema = new mongoose.Schema(
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
    // private = only therapist can see; shared = also visible on client portal
    type: {
      type: String,
      enum: ['private', 'shared'],
      default: 'private',
    },
    content: { type: String, default: '' }, // rich text (HTML from TipTap)
    // Structured template fields (stretch goal)
    template: {
      type: String,
      enum: ['none', 'soap', 'dap'],
      default: 'none',
    },
    templateData: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SessionNote', sessionNoteSchema);
