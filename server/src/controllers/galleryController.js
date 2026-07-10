const iconStore = require('../utils/iconStore');

/**
 * GET /api/v1/gallery — Returns all icons with metadata for the gallery page
 */
const getGallery = (req, res) => {
  const { category, search, page = 1, limit = 50 } = req.query;

  let icons = iconStore.getAllIcons().map((meta) => ({
    key: meta.key,
    name: meta.name,
    category: meta.category,
    previewUrl: `/icons?i=${meta.key}&theme=dark&width=48&height=48`,
    themes: Object.keys(meta.themes),
  }));

  if (category && category !== 'all') {
    icons = icons.filter((icon) => icon.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    icons = icons.filter(
      (icon) => icon.name.toLowerCase().includes(q) || icon.key.toLowerCase().includes(q)
    );
  }

  const total = icons.length;
  const start = (page - 1) * limit;
  const paginated = icons.slice(start, start + parseInt(limit));

  res.json({
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    icons: paginated,
  });
};

/**
 * GET /api/v1/gallery/categories — Returns list of unique categories
 */
const getCategories = (req, res) => {
  const categories = [
    ...new Set(iconStore.getAllIcons().map((m) => m.category).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));
  res.json({ categories: ['all', ...categories] });
};

module.exports = { getGallery, getCategories };
