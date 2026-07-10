/**
 * Standalone seed for local or live MongoDB.
 * Usage: npm run seed  (from server/)
 * Skips icons whose keys already exist.
 */
require('dotenv').config();
const connectDB = require('./config/db');
const seedIcons = require('./utils/seedIcons');

(async () => {
  try {
    await connectDB();
    await seedIcons();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
})();
