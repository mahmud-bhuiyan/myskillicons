const {
  getOrderedCategorySlugs,
  reorderCategories,
  syncCategoriesFromIcons,
} = require('../utils/categoryService');

/**
 * GET /api/v1/admin/categories
 */
const listCategories = async (_req, res) => {
  try {
    await syncCategoriesFromIcons();
    const categories = await getOrderedCategorySlugs();
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/v1/admin/categories/order
 * Body: { categories: ['cloud', 'database', ...] }
 */
const updateCategoryOrder = async (req, res) => {
  try {
    const categories = await reorderCategories(req.body?.categories);
    res.json({ message: 'Category order updated', categories });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message });
  }
};

module.exports = { listCategories, updateCategoryOrder };
