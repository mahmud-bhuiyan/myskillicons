const Icon = require('../models/Icon');
const iconSeedData = require('./iconSeedData');
const iconStore = require('./iconStore');
const { syncCategoriesFromIcons } = require("./categoryService");

/**
 * Seeds default icons into MongoDB when missing,
 * then loads the full catalog into the in-memory store.
 * Safe for local and live DBs — skips keys that already exist.
 */
async function seedIcons() {
  let created = 0;

  for (const [key, meta] of Object.entries(iconSeedData)) {
    const exists = await Icon.exists({ key });
    if (exists) continue;

    await Icon.create({
      key,
      name: meta.name,
      category: meta.category,
      svgContent: meta.svgContent,
      themes: meta.themes,
      isApproved: true,
      tags: meta.tags || [meta.category],
    });
    created += 1;
  }

  const total = await iconStore.loadFromDb(Icon);
  if (created > 0) {
    console.log(`Seeded ${created} icon(s) into MongoDB`);
  }
  console.log(`Icon store ready: ${total} icon(s)`);

  const categoriesCreated = await syncCategoriesFromIcons();
  if (categoriesCreated > 0) {
    console.log(
      `Synced ${categoriesCreated} categor${categoriesCreated === 1 ? "y" : "ies"}`,
    );
  }
}

module.exports = seedIcons;
