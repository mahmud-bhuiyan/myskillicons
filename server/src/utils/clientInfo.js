/**
 * Extract client network / browser details from the request.
 * Supports proxies (Vercel, nginx) via X-Forwarded-For / X-Real-IP.
 */
function getClientInfo(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIps = typeof forwarded === 'string'
    ? forwarded.split(',').map((ip) => ip.trim()).filter(Boolean)
    : [];

  const ip =
    forwardedIps[0] ||
    req.headers['x-real-ip'] ||
    req.headers['cf-connecting-ip'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown';

  return {
    ip: String(ip).replace(/^::ffff:/, ''),
    forwardedIps,
    userAgent: req.headers['user-agent'] || '',
    origin: req.headers.origin || '',
    referer: req.headers.referer || req.headers.referrer || '',
    acceptLanguage: req.headers['accept-language'] || '',
  };
}

module.exports = { getClientInfo };
