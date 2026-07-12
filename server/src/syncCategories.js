/**
 * Apply iconCategoryMap to seed data file + live MongoDB.
 * Usage (from server/): node src/syncCategories.js
 *
 * - Rewrites category/tags in iconSeedData.js
 * - Updates existing Icon documents in MongoDB
 * - Syncs Category collection and removes unused slugs
 * - Reloads in-memory icon store
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');
const Icon = require('./models/Icon');
const Category = require('./models/Category');
const iconStore = require('./utils/iconStore');
const iconCategoryMap = require('./utils/iconCategoryMap');
const { syncCategoriesFromIcons, DEFAULT_ORDER } = require('./utils/categoryService');

const SEED_PATH = path.join(__dirname, 'utils', 'iconSeedData.js');

const applyMapToSeedFile = () => {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const iconSeedData = require('./utils/iconSeedData');
  let changed = 0;

  for (const [key, meta] of Object.entries(iconSeedData)) {
    const category = iconCategoryMap[key];
    if (!category) {
      throw new Error(`No category mapping for seed icon "${key}"`);
    }
    if (meta.category !== category || !(meta.tags || []).includes(category)) {
      meta.category = category;
      meta.tags = [category];
      changed += 1;
    }
  }

  const header = `/**
 * Default icon catalog for MongoDB (tandpfun/skill-icons).
 * Source of truth for seed icons — edit here, then restart server or \`npm run seed\`.
 * seedIcons creates missing keys and updates name/category/tags/svgContent.
 * Icons: ${Object.keys(iconSeedData).length}
 */

`;

  const body = `const iconSeedData = ${JSON.stringify(iconSeedData, null, 2)};\n\nmodule.exports = iconSeedData;\n`;
  fs.writeFileSync(SEED_PATH, header + body, 'utf8');
  return { total: Object.keys(iconSeedData).length, changed };
};

const applyMapToDatabase = async () => {
  let updated = 0;
  let unchanged = 0;
  const counts = {};

  for (const [key, category] of Object.entries(iconCategoryMap)) {
    counts[category] = (counts[category] || 0) + 1;
    const result = await Icon.updateOne(
      { key },
      { $set: { category, tags: [category] } }
    );
    if (result.matchedCount === 0) {
      console.warn(`  warn: icon "${key}" not found in DB (skipped)`);
      continue;
    }
    if (result.modifiedCount > 0) updated += 1;
    else unchanged += 1;
  }

  // Also fix any DB-only icons that still use removed/legacy slugs? leave alone.

  const created = await syncCategoriesFromIcons();

  // Drop Category docs that no icons use anymore
  const used = await Icon.distinct('category');
  const usedSet = new Set(used.map((s) => String(s || '').trim().toLowerCase()).filter(Boolean));
  const removed = await Category.deleteMany({ slug: { $nin: [...usedSet] } });

  // Re-apply preferred order for known slugs
  const preferred = DEFAULT_ORDER.filter((s) => usedSet.has(s));
  const rest = [...usedSet].filter((s) => !DEFAULT_ORDER.includes(s)).sort((a, b) => a.localeCompare(b));
  const ordered = [...preferred, ...rest];
  await Promise.all(
    ordered.map((slug, index) => Category.updateOne({ slug }, { $set: { sortOrder: index } }, { upsert: true }))
  );

  await iconStore.loadFromDb(Icon);

  return {
    updated,
    unchanged,
    categoriesCreated: created,
    categoriesRemoved: removed.deletedCount || 0,
    ordered,
    counts,
  };
};

(async () => {
  try {
    console.log('Updating seed file…');
    const seed = applyMapToSeedFile();
    console.log(`  seed icons: ${seed.total}, category fields rewritten: ${seed.changed}`);

    console.log('Connecting to MongoDB…');
    await connectDB();

    console.log('Updating database icons…');
    const db = await applyMapToDatabase();
    console.log(`  icons updated: ${db.updated}, unchanged: ${db.unchanged}`);
    console.log(`  categories created: ${db.categoriesCreated}, removed unused: ${db.categoriesRemoved}`);
    console.log(`  order: ${db.ordered.join(' → ')}`);
    console.log('  counts:');
    Object.entries(db.counts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([c, n]) => console.log(`    ${c}: ${n}`));

    console.log('Done. Restart the API server if it was already running so the in-memory store reloads.');
    process.exit(0);
  } catch (err) {
    console.error('Category sync failed:', err);
    process.exit(1);
  }
})();
