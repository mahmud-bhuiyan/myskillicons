const multer = require('multer');
const Icon = require('../models/Icon');
const iconStore = require('../utils/iconStore');
const { clearIconCache } = require('../utils/svgProcessor');
const { ensureCategory, DEFAULT_ORDER } = require('../utils/categoryService');

const DEFAULT_CATEGORIES = [...DEFAULT_ORDER];

const normalizeCategory = (raw) => {
  return String(raw || '')
    .trim()
    .toLowerCase();
};

const isValidCategory = (category) => {
  return /^[a-z0-9][a-z0-9-]*$/.test(category);
};

const DEFAULT_THEMES = {
  light: { bg: '#F0F0F0', primary: '#181717' },
  dark: { bg: '#181717', primary: '#FFFFFF' },
  auto: { bg: '#181717', primary: '#FFFFFF' },
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 }, // 200KB
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype === 'image/svg+xml' ||
      file.originalname.toLowerCase().endsWith('.svg');
    cb(ok ? null : new Error('Only SVG files are allowed'), ok);
  },
});

const uploadSvg = upload.single('svg');

const parseThemes = (raw) => {
  if (!raw) return { ...DEFAULT_THEMES };

  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ...DEFAULT_THEMES };
    }
  }

  const light = {
    bg: parsed.light?.bg || DEFAULT_THEMES.light.bg,
    primary: parsed.light?.primary || DEFAULT_THEMES.light.primary,
  };
  const dark = {
    bg: parsed.dark?.bg || DEFAULT_THEMES.dark.bg,
    primary: parsed.dark?.primary || DEFAULT_THEMES.dark.primary,
  };
  const auto = {
    bg: parsed.auto?.bg || dark.bg,
    primary: parsed.auto?.primary || dark.primary,
  };

  return { light, dark, auto };
};

const parseTags = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).map((t) => t.trim()).filter(Boolean);
  return String(raw)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
};

const extractSvgContent = (req) => {
  if (req.file?.buffer) {
    return req.file.buffer.toString('utf-8');
  }
  if (typeof req.body.svgContent === 'string' && req.body.svgContent.trim()) {
    return req.body.svgContent.trim();
  }
  return null;
};

const validateSvg = (svg) => {
  if (!svg || !/<svg[\s>]/i.test(svg)) {
    return 'Valid SVG content is required (must include an <svg> root)';
  }
  if (svg.length > 200 * 1024) {
    return 'SVG is too large (max 200KB)';
  }
  return null;
};

const normalizeKey = (key) => {
  return String(key || '')
    .trim()
    .toLowerCase();
};

const toAdminIcon = (doc, { includeSvg = true } = {}) => {
  const icon = {
    _id: doc._id,
    key: doc.key,
    name: doc.name,
    category: doc.category,
    themes: doc.themes,
    tags: doc.tags || [],
    isApproved: doc.isApproved,
    previewUrl: `/icons?i=${doc.key}&theme=dark&width=48&height=48`,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
  if (includeSvg) icon.svgContent = doc.svgContent;
  return icon;
};

const syncStore = (doc) => {
  iconStore.setIcon(doc);
  clearIconCache(doc.key);
};

/**
 * GET /api/v1/admin/icons
 * List metadata only (no svgContent) so the admin grid stays fast.
 */
const listAdminIcons = async (_req, res) => {
  try {
    const icons = await Icon.find()
      .select('-svgContent')
      .sort({ name: 1 })
      .lean();
    res.json({
      total: icons.length,
      icons: icons.map((doc) => toAdminIcon(doc, { includeSvg: false })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/v1/admin/icons/:key — full icon including svgContent (for edit form)
 */
const getAdminIcon = async (req, res) => {
  try {
    const key = normalizeKey(req.params.key);
    const icon = await Icon.findOne({ key });
    if (!icon) return res.status(404).json({ error: 'Icon not found' });
    res.json({ icon: toAdminIcon(icon) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/v1/admin/icons/details?keys=a,b,c
 * Batch full icons (incl. svgContent) for the visible admin page (max 20).
 */
const listAdminIconDetails = async (req, res) => {
  try {
    const keys = String(req.query.keys || '')
      .split(',')
      .map(normalizeKey)
      .filter(Boolean)
      .slice(0, 20);

    if (keys.length === 0) {
      return res.json({ icons: [] });
    }

    const icons = await Icon.find({ key: { $in: keys } }).lean();
    const byKey = new Map(icons.map((doc) => [doc.key, doc]));
    // Preserve request order so the client can zip easily.
    const ordered = keys.map((key) => byKey.get(key)).filter(Boolean);

    res.json({
      icons: ordered.map((doc) => toAdminIcon(doc, { includeSvg: true })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/v1/admin/icons — upload / create icon
 */
const createIcon = async (req, res) => {
  try {
    const key = normalizeKey(req.body.key);
    const name = (req.body.name || '').trim();
    const category = normalizeCategory(req.body.category || 'tool');

    if (!key || !/^[a-z0-9][a-z0-9-]*$/.test(key)) {
      return res.status(400).json({
        error: 'key is required and must be lowercase alphanumeric (hyphens allowed)',
      });
    }
    if (!name) return res.status(400).json({ error: 'name is required' });
    if (!isValidCategory(category)) {
      return res.status(400).json({
        error: 'category must be lowercase alphanumeric (hyphens allowed)',
      });
    }

    const svgContent = extractSvgContent(req);
    const svgError = validateSvg(svgContent);
    if (svgError) return res.status(400).json({ error: svgError });

    const existing = await Icon.findOne({ key });
    if (existing) {
      return res.status(409).json({ error: `Icon key "${key}" already exists` });
    }

    const icon = await Icon.create({
      key,
      name,
      category,
      svgContent,
      themes: parseThemes(req.body.themes),
      tags: parseTags(req.body.tags),
      isApproved: req.body.isApproved !== 'false' && req.body.isApproved !== false,
    });

    await ensureCategory(category);
    syncStore(icon);
    res.status(201).json({ message: 'Icon created', icon: toAdminIcon(icon) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Icon key already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/v1/admin/icons/:key
 */
const updateIcon = async (req, res) => {
  try {
    const key = normalizeKey(req.params.key);
    const icon = await Icon.findOne({ key });
    if (!icon) return res.status(404).json({ error: 'Icon not found' });

    if (req.body.name) icon.name = String(req.body.name).trim();
    if (req.body.category) {
      const category = normalizeCategory(req.body.category);
      if (!isValidCategory(category)) {
        return res.status(400).json({
          error: 'category must be lowercase alphanumeric (hyphens allowed)',
        });
      }
      icon.category = category;
    }
    if (req.body.themes !== undefined) icon.themes = parseThemes(req.body.themes);
    if (req.body.tags !== undefined) icon.tags = parseTags(req.body.tags);
    if (req.body.isApproved !== undefined) {
      icon.isApproved = req.body.isApproved !== 'false' && req.body.isApproved !== false;
    }

    const svgContent = extractSvgContent(req);
    if (svgContent) {
      const svgError = validateSvg(svgContent);
      if (svgError) return res.status(400).json({ error: svgError });
      icon.svgContent = svgContent;
    }

    await icon.save();
    if (req.body.category) await ensureCategory(icon.category);
    syncStore(icon);
    if (!icon.isApproved) {
      iconStore.removeIcon(icon.key);
      clearIconCache(icon.key);
    }

    res.json({ message: 'Icon updated', icon: toAdminIcon(icon) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/v1/admin/icons/:key
 */
const deleteIcon = async (req, res) => {
  try {
    const key = normalizeKey(req.params.key);
    const icon = await Icon.findOneAndDelete({ key });
    if (!icon) return res.status(404).json({ error: 'Icon not found' });

    iconStore.removeIcon(key);
    clearIconCache(key);
    res.json({ message: 'Icon deleted', key });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadSvg,
  listAdminIcons,
  listAdminIconDetails,
  getAdminIcon,
  createIcon,
  updateIcon,
  deleteIcon,
  DEFAULT_CATEGORIES,
  DEFAULT_THEMES,
};
