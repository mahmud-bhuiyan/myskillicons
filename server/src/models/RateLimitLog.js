const mongoose = require('mongoose');

/**
 * Tracks each write attempt for rate limiting and abuse investigation.
 * Documents expire automatically after the window (TTL index).
 */
const rateLimitLogSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    index: true,
  },
  action: {
    type: String,
    required: true,
    enum: ['submit', 'upvote'],
  },
  ip: { type: String, required: true },
  forwardedIps: [String],
  userAgent: String,
  origin: String,
  referer: String,
  acceptLanguage: String,
  email: String,
  blocked: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Auto-delete logs after 10 minutes (rate window)
rateLimitLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

module.exports = mongoose.model('RateLimitLog', rateLimitLogSchema);
