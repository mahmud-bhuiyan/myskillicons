const mongoose = require('mongoose');

const colorPairSchema = new mongoose.Schema(
  {
    bg: { type: String, required: true },
    primary: { type: String, required: true },
  },
  { _id: false }
);

const iconSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9][a-z0-9-]*$/, 'key must be lowercase alphanumeric (hyphens allowed)'],
    },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      default: 'tool',
      match: [/^[a-z0-9][a-z0-9-]*$/, 'category must be lowercase alphanumeric (hyphens allowed)'],
    },
    svgContent: { type: String, required: true },
    themes: {
      light: { type: colorPairSchema, required: true },
      dark: { type: colorPairSchema, required: true },
      auto: { type: colorPairSchema },
    },
    submittedBy: { type: String },
    isApproved: { type: Boolean, default: true },
    downloadCount: { type: Number, default: 0 },
    tags: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Icon', iconSchema);
