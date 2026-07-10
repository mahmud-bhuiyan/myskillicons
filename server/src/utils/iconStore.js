/**
 * In-memory icon catalog backed by MongoDB.
 * Keeps /icons serving sync and fast while admin CRUD updates the DB + this store.
 */

const store = new Map();
let loaded = false;

function normalizeIcon(doc) {
  const themes = doc.themes?.toObject?.() || doc.themes || {};
  return {
    key: doc.key,
    name: doc.name,
    category: doc.category,
    svgContent: doc.svgContent,
    themes: {
      light: themes.light || { bg: '#F0F0F0', primary: '#181717' },
      dark: themes.dark || { bg: '#181717', primary: '#FFFFFF' },
      auto: themes.auto || themes.dark || { bg: '#181717', primary: '#FFFFFF' },
    },
    tags: doc.tags || [],
    isApproved: doc.isApproved !== false,
  };
}

function setIcon(doc) {
  const icon = normalizeIcon(doc);
  if (!icon.isApproved || !icon.svgContent) {
    store.delete(icon.key);
    return null;
  }
  store.set(icon.key, icon);
  return icon;
}

function removeIcon(key) {
  store.delete(String(key).toLowerCase());
}

function getIcon(key) {
  return store.get(String(key).toLowerCase()) || null;
}

function getAllIcons() {
  return Array.from(store.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function getKeys() {
  return Array.from(store.keys());
}

async function loadFromDb(IconModel) {
  const docs = await IconModel.find({ isApproved: true, svgContent: { $exists: true, $ne: '' } }).lean();
  store.clear();
  for (const doc of docs) {
    setIcon(doc);
  }
  loaded = true;
  return store.size;
}

function isLoaded() {
  return loaded;
}

module.exports = {
  setIcon,
  removeIcon,
  getIcon,
  getAllIcons,
  getKeys,
  loadFromDb,
  isLoaded,
};
