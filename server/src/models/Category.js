const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9][a-z0-9-]*$/, 'slug must be lowercase alphanumeric (hyphens allowed)'],
    },
    sortOrder: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

categorySchema.index({ sortOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);
