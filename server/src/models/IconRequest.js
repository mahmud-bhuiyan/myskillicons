const mongoose = require('mongoose');

const iconRequestSchema = new mongoose.Schema({
  iconName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  referenceUrl: {
    type: String,
  },
  submittedSvg: {
    type: String,
  },
  submitterEmail: {
    type: String,
    required: true,
  },
  submitterName: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'in-progress'],
    default: 'pending',
  },
  adminNote: {
    type: String,
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  upvotedBy: [String],
  /** Client network details captured at submission time */
  clientInfo: {
    ip: String,
    forwardedIps: [String],
    userAgent: String,
    origin: String,
    referer: String,
    acceptLanguage: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('IconRequest', iconRequestSchema);
