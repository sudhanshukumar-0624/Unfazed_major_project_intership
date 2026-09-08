const Therapist = require('../models/Therapist');

/**
 * Generates a unique URL slug from the therapist's name.
 * e.g. "Dr. Priya Sharma" → "dr-priya-sharma"
 * If taken, appends a number: "dr-priya-sharma-2"
 */
const generateSlug = async (name) => {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

  let slug = base;
  let count = 1;

  while (await Therapist.findOne({ slug })) {
    slug = `${base}-${count}`;
    count++;
  }

  return slug;
};

module.exports = { generateSlug };
