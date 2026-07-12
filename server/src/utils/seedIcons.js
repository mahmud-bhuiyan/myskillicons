const Icon = require('../models/Icon');
const iconSeedData = require('./iconSeedData');
const iconStore = require('./iconStore');
const { clearIconCache } = require('./svgProcessor');
const { syncCategoriesFromIcons } = require('./categoryService');

/**
 * Single catalog sync from iconSeedData → MongoDB + in-memory store.
 * - Creates missing seed icons
 * - Updates name, category, tags, svgContent when seed data changes
 * - Leaves themes alone on existing icons (admin color edits stay)
 * Runs on server start and via `npm run seed` — same function, no extra seeds.
 */
const seedIcons = async () => {
  let created = 0;
  let updated = 0;

  const existingDocs = await Icon.find({
    key: { $in: Object.keys(iconSeedData) },
  })
    .select('key name category tags svgContent')
    .lean();
  const byKey = new Map(existingDocs.map((doc) => [doc.key, doc]));

  const ops = [];

  for (const [key, meta] of Object.entries(iconSeedData)) {
    const tags = meta.tags || [meta.category];
    const existing = byKey.get(key);

    if (!existing) {
      ops.push({
        insertOne: {
          document: {
            key,
            name: meta.name,
            category: meta.category,
            svgContent: meta.svgContent,
            themes: meta.themes,
            isApproved: true,
            tags,
          },
        },
      });
      created += 1;
      continue;
    }

    const needsUpdate =
      existing.svgContent !== meta.svgContent ||
      existing.name !== meta.name ||
      existing.category !== meta.category ||
      JSON.stringify(existing.tags || []) !== JSON.stringify(tags);

    if (needsUpdate) {
      ops.push({
        updateOne: {
          filter: { key },
          update: {
            $set: {
              name: meta.name,
              category: meta.category,
              tags,
              svgContent: meta.svgContent,
            },
          },
        },
      });
      updated += 1;
    }
  }

  if (ops.length > 0) {
    await Icon.bulkWrite(ops, { ordered: false });
  }

  clearIconCache();
  const total = await iconStore.loadFromDb(Icon);

  if (created > 0) console.log(`Seeded ${created} icon(s) into MongoDB`);
  if (updated > 0) console.log(`Updated ${updated} icon(s) from seed data`);
  console.log(`Icon store ready: ${total} icon(s)`);

  const categoriesCreated = await syncCategoriesFromIcons();
  if (categoriesCreated > 0) {
    console.log(
      `Synced ${categoriesCreated} categor${categoriesCreated === 1 ? 'y' : 'ies'}`,
    );
  }
};

module.exports = seedIcons;
