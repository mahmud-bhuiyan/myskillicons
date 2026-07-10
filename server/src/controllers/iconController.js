const { processSingleIcon, processBatchIcons, validateParams, LIMITS } = require('../utils/svgProcessor');
const iconRegistry = require('../utils/iconRegistry');

/**
 * GET /api/v1/icons?i=js&theme=dark&width=48&height=48
 * GET /api/v1/icons?i=js,react,nodejs&theme=dark&width=48&height=48
 */
const getIcons = (req, res) => {
  const { i, theme, width, height, layout, gap } = validateParams(req.query);

  if (!i) {
    return res.status(400).json({ error: 'Missing required param: i (icon name or comma-separated list)' });
  }

  const iconKeys = i.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);

  if (iconKeys.length === 0) {
    return res.status(400).json({ error: 'No valid icon names provided' });
  }

  if (iconKeys.length > LIMITS.maxBatch) {
    return res.status(400).json({ error: `Max ${LIMITS.maxBatch} icons per request` });
  }

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  if (iconKeys.length === 1) {
    const svg = processSingleIcon(iconKeys[0], theme, width, height);
    if (!svg) {
      return res.status(404).json({ error: `Icon "${iconKeys[0]}" not found` });
    }
    return res.send(svg);
  }

  const svg = processBatchIcons(iconKeys, theme, width, height, layout, gap);
  if (!svg) {
    return res.status(404).json({ error: 'None of the requested icons were found' });
  }
  return res.send(svg);
};

/**
 * GET /api/v1/icons/list — returns all available icon keys and metadata
 */
const listIcons = (req, res) => {
  const icons = Object.entries(iconRegistry).map(([key, meta]) => ({
    key,
    name: meta.name,
    category: meta.category,
    themes: Object.keys(meta.themes),
  }));
  res.json({ total: icons.length, icons });
};

module.exports = { getIcons, listIcons };
