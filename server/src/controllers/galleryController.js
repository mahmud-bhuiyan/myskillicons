const Icon = require('../models/Icon');
const iconStore = require('../utils/iconStore');
const { getOrderedCategorySlugs } = require('../utils/categoryService');

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GET /api/v1/gallery — Paginated icons from MongoDB (supports category + search)
 */
const getGallery = async (req, res) => {
  try {
    const { category, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(10000, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const filter = {
      isApproved: true,
      svgContent: { $exists: true, $ne: '' },
    };

    if (category && category !== 'all') {
      filter.category = String(category).toLowerCase();
    }

    if (search && String(search).trim()) {
      const q = escapeRegex(String(search).trim());
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { key: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ];
    }

    const [total, docs] = await Promise.all([
      Icon.countDocuments(filter),
      Icon.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .select('key name category themes')
        .lean(),
    ]);

    const icons = docs.map((doc) => ({
      key: doc.key,
      name: doc.name,
      category: doc.category,
      previewUrl: `/icons?i=${doc.key}&theme=dark&width=48&height=48`,
      themes: Object.keys(doc.themes || {}),
    }));

    res.json({ total, page, limit, icons });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/v1/gallery/categories — Returns ordered categories with accurate counts
 */
const getCategories = async (_req, res) => {
  try {
    const categories = await getOrderedCategorySlugs();
    const allIcons = iconStore.getAllIcons();
    const counts = { all: allIcons.length };

    for (const meta of allIcons) {
      if (!meta.category) continue;
      counts[meta.category] = (counts[meta.category] || 0) + 1;
    }

    const visible = categories.filter((c) => counts[c] > 0);
    res.json({ categories: ['all', ...visible], counts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getGallery, getCategories };
