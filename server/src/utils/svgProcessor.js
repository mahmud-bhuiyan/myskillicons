const NodeCache = require('node-cache');
const iconStore = require('./iconStore');

const cache = new NodeCache({ stdTTL: 3600 }); // cache 1 hour

const DEFAULTS = {
  theme: 'light',
  width: 48,
  height: 48,
};

const LIMITS = {
  minSize: 16,
  maxSize: 256,
  maxBatch: 20,
};

function clearIconCache(iconKey) {
  if (!iconKey) {
    cache.flushAll();
    return;
  }
  const prefix = `${String(iconKey).toLowerCase()}_`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.del(key);
  }
}

/**
 * Processes a single icon and returns SVG string
 */
function processSingleIcon(iconKey, theme, width, height) {
  const cacheKey = `${iconKey}_${theme}_${width}_${height}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const iconMeta = iconStore.getIcon(iconKey);
  if (!iconMeta?.svgContent) return null;

  const themeColors = iconMeta.themes[theme] || iconMeta.themes.dark;

  const svgContent = iconMeta.svgContent
    .replace(/\{\{WIDTH\}\}/g, width)
    .replace(/\{\{HEIGHT\}\}/g, height)
    .replace(/\{\{COLOR_BG\}\}/g, themeColors.bg)
    .replace(/\{\{COLOR_PRIMARY\}\}/g, themeColors.primary);

  cache.set(cacheKey, svgContent);
  return svgContent;
}

/**
 * Nest a single-icon SVG inside a batch canvas, preserving its viewBox so
 * icons authored at different coordinate systems (e.g. 256 vs 48) scale correctly.
 */
function nestIconSvg(svg, x, y, width, height) {
  const viewBoxMatch = svg.match(/viewBox="([^"]+)"/i);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : `0 0 ${width} ${height}`;
  const innerContent = svg.replace(/<svg[^>]*>/i, '').replace(/<\/svg>\s*$/i, '');
  return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${viewBox}">${innerContent}</svg>`;
}

/**
 * Processes batch icons and returns combined SVG strip
 */
function processBatchIcons(iconKeys, theme, width, height, layout = 'row', gap = 8) {
  const svgs = [];

  for (const key of iconKeys) {
    const svg = processSingleIcon(key.trim(), theme, width, height);
    if (svg) svgs.push({ key, svg });
  }

  if (svgs.length === 0) return null;

  if (layout === 'row') {
    const totalWidth = svgs.length * width + (svgs.length - 1) * gap;
    const totalHeight = height;

    let combined = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">`;
    svgs.forEach(({ svg }, index) => {
      const x = index * (width + gap);
      combined += nestIconSvg(svg, x, 0, width, height);
    });
    combined += '</svg>';
    return combined;
  }

  // grid layout
  const cols = Math.ceil(Math.sqrt(svgs.length));
  const rows = Math.ceil(svgs.length / cols);
  const totalWidth = cols * width + (cols - 1) * gap;
  const totalHeight = rows * height + (rows - 1) * gap;

  let combined = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">`;
  svgs.forEach(({ svg }, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = col * (width + gap);
    const y = row * (height + gap);
    combined += nestIconSvg(svg, x, y, width, height);
  });
  combined += '</svg>';
  return combined;
}

function validateParams(query) {
  let { i, theme, width, height, w, h, layout, gap } = query;

  width = parseInt(width || w) || DEFAULTS.width;
  height = parseInt(height || h) || DEFAULTS.height;

  width = Math.min(Math.max(width, LIMITS.minSize), LIMITS.maxSize);
  height = Math.min(Math.max(height, LIMITS.minSize), LIMITS.maxSize);

  theme = ['light', 'dark', 'auto'].includes(theme) ? theme : DEFAULTS.theme;
  layout = ['row', 'grid'].includes(layout) ? layout : 'row';
  gap = Math.min(Math.max(parseInt(gap) || 8, 0), 64);

  return { i, theme, width, height, layout, gap };
}

module.exports = { processSingleIcon, processBatchIcons, validateParams, LIMITS, clearIconCache };
