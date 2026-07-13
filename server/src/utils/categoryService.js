const Category = require('../models/Category');
const Icon = require('../models/Icon');

/** Preferred initial order when seeding; unknown slugs are appended alphabetically. */
const DEFAULT_ORDER = [
  'build',
  'cloud',
  'cms',
  'database',
  'design',
  'devops',
  'framework',
  'game',
  'hardware',
  'ide',
  'language',
  'library',
  'markup',
  'ml',
  'os',
  'productivity',
  'runtime',
  'social',
  'testing',
  'tool',
  'ui',
];

/**
 * Ensure every distinct icon category has a Category doc.
 * New slugs get appended after the current max sortOrder.
 * Safe to call on every startup.
 */
const syncCategoriesFromIcons = async () => {
  const used = await Icon.distinct('category');
  const slugs = [...new Set(used.map((s) => String(s || '').trim().toLowerCase()).filter(Boolean))];

  const existing = await Category.find().lean();
  const existingBySlug = new Map(existing.map((c) => [c.slug, c]));

  let maxOrder = existing.reduce((max, c) => Math.max(max, c.sortOrder), -1);

  if (existing.length === 0 && slugs.length > 0) {
    const preferred = DEFAULT_ORDER.filter((s) => slugs.includes(s));
    const rest = slugs.filter((s) => !DEFAULT_ORDER.includes(s)).sort((a, b) => a.localeCompare(b));
    const ordered = [...preferred, ...rest];

    await Category.insertMany(
      ordered.map((slug, index) => ({ slug, sortOrder: index })),
      { ordered: false }
    );
    return ordered.length;
  }

  let created = 0;
  for (const slug of slugs) {
    if (existingBySlug.has(slug)) continue;
    maxOrder += 1;
    await Category.create({ slug, sortOrder: maxOrder });
    created += 1;
  }
  return created;
};

/** Ensure a single category exists (e.g. when admin creates an icon with a new type). */
const ensureCategory = async (slug) => {
  const normalized = String(slug || '')
    .trim()
    .toLowerCase();
  if (!normalized || !/^[a-z0-9][a-z0-9-]*$/.test(normalized)) return null;

  const existing = await Category.findOne({ slug: normalized });
  if (existing) return existing;

  const last = await Category.findOne().sort({ sortOrder: -1 }).lean();
  const sortOrder = last ? last.sortOrder + 1 : 0;
  return Category.create({ slug: normalized, sortOrder });
};

/** Ordered category slugs for public + admin UIs (excludes virtual "all"). */
const getOrderedCategorySlugs = async () => {
  const docs = await Category.find().sort({ sortOrder: 1, slug: 1 }).lean();
  if (docs.length > 0) return docs.map((d) => d.slug);

  // Fallback if Category collection is empty
  const used = await Icon.distinct('category');
  return [...new Set(used.filter(Boolean))].sort((a, b) => a.localeCompare(b));
};

/**
 * Persist a new order. `slugs` must include every existing category exactly once.
 */
const reorderCategories = async (slugs) => {
  if (!Array.isArray(slugs) || slugs.length === 0) {
    throw Object.assign(new Error('categories array is required'), { status: 400 });
  }

  const normalized = slugs.map((s) => String(s || '').trim().toLowerCase());
  if (normalized.some((s) => !s || !/^[a-z0-9][a-z0-9-]*$/.test(s))) {
    throw Object.assign(new Error('invalid category slug'), { status: 400 });
  }
  if (new Set(normalized).size !== normalized.length) {
    throw Object.assign(new Error('duplicate category in order list'), { status: 400 });
  }

  const existing = await Category.find().lean();
  const existingSlugs = new Set(existing.map((c) => c.slug));

  if (normalized.length !== existingSlugs.size || normalized.some((s) => !existingSlugs.has(s))) {
    throw Object.assign(
      new Error('order list must include every category exactly once'),
      { status: 400 }
    );
  }

  await Promise.all(
    normalized.map((slug, index) => Category.updateOne({ slug }, { $set: { sortOrder: index } }))
  );

  return getOrderedCategorySlugs();
};

module.exports = {
  DEFAULT_ORDER,
  syncCategoriesFromIcons,
  ensureCategory,
  getOrderedCategorySlugs,
  reorderCategories,
};
