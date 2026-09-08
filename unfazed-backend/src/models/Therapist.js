const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const therapistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password_hash: { type: String, required: true },
    slug: { type: String, unique: true, lowercase: true }, // e.g. "dr-sharma"
    bio: { type: String, default: '' },
    specializations: [{ type: String }],
    languages: [{ type: String }],
    profilePic: { type: String, default: '' }, // URL
    phone: { type: String, default: '' },
    subscriptionTier: {
      type: String,
      enum: ['free', 'basic', 'pro'],
      default: 'free',
    },
    isActive: { type: Boolean, default: true },
    // Open Graph meta for branded link
    ogTitle: { type: String, default: '' },
    ogDescription: { type: String, default: '' },
  },
  { timestamps: true }
);

// Hash password before saving
therapistSchema.pre('save', async function () {
  if (!this.isModified('password_hash')) return;
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
});

// Compare password
therapistSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password_hash);
};

module.exports = mongoose.model('Therapist', therapistSchema);
