const mongoose = require('mongoose');

const iconSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['language', 'framework', 'runtime', 'database', 'tool', 'cloud', 'other'],
    default: 'other',
  },
  svgContent: { type: String },
  filePath: { type: String },
  themes: {
    light: { bg: String, primary: String },
    dark: { bg: String, primary: String },
  },
  submittedBy: { type: String },
  isApproved: { type: Boolean, default: true },
  downloadCount: { type: Number, default: 0 },
  tags: [String],
}, { timestamps: true });

module.exports = mongoose.model('Icon', iconSchema);
