const RateLimitLog = require('../models/RateLimitLog');
const { getClientInfo } = require('../utils/clientInfo');

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 5;

const QUOTA_MESSAGES = {
  submit:
    'Request quota reached. You can submit a maximum of 5 icon requests every 10 minutes. Please try again later.',
  upvote:
    'Upvote quota reached. You can upvote a maximum of 5 times every 10 minutes. Please try again later.',
};

/**
 * Rate limit: max 5 requests per 10 minutes per client IP.
 * Logs IP, forwarded addresses, user-agent, and related headers.
 */
function rateLimit(action = 'submit') {
  return async (req, res, next) => {
    try {
      const client = getClientInfo(req);
      const email = (req.body?.submitterEmail || req.body?.email || '').toLowerCase().trim();
      // Key by IP; fall back to email if IP is missing/unknown
      const key = client.ip && client.ip !== 'unknown'
        ? `ip:${client.ip}`
        : email
          ? `email:${email}`
          : `ua:${client.userAgent || 'anon'}`;

      const since = new Date(Date.now() - WINDOW_MS);
      const recentCount = await RateLimitLog.countDocuments({
        key,
        action,
        blocked: false,
        createdAt: { $gte: since },
      });

      const overLimit = recentCount >= MAX_REQUESTS;

      await RateLimitLog.create({
        key,
        action,
        ip: client.ip,
        forwardedIps: client.forwardedIps,
        userAgent: client.userAgent,
        origin: client.origin,
        referer: client.referer,
        acceptLanguage: client.acceptLanguage,
        email: email || undefined,
        blocked: overLimit,
      });

      // Attach for controllers to persist on IconRequest
      req.clientInfo = client;

      if (overLimit) {
        const retryAfterSec = Math.ceil(WINDOW_MS / 1000);
        res.set('Retry-After', String(retryAfterSec));
        return res.status(429).json({
          error: QUOTA_MESSAGES[action] || QUOTA_MESSAGES.submit,
          code: action === 'upvote' ? 'UPVOTE_QUOTA_EXCEEDED' : 'REQUEST_QUOTA_EXCEEDED',
          retryAfterSeconds: retryAfterSec,
        });
      }

      next();
    } catch (err) {
      console.error('Rate limit middleware error:', err);
      // Fail open only if logging DB is down — still attach client info
      req.clientInfo = getClientInfo(req);
      next();
    }
  };
}

module.exports = { rateLimit, MAX_REQUESTS, WINDOW_MS };
