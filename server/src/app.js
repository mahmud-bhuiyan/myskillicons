const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const seedIcons = require('./utils/seedIcons');

let appPromise = null;

async function createApp() {
  await connectDB();
  await seedIcons();

  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));
  app.use(express.json({ limit: '300kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'SkillIcons API running' });
  });

  app.use('/icons', require('./routes/iconRoutes'));

  const apiV1 = express.Router();
  apiV1.use('/request', require('./routes/requestRoutes'));
  apiV1.use('/gallery', require('./routes/galleryRoutes'));
  apiV1.use('/admin', require('./routes/adminRoutes'));
  app.use('/api/v1', apiV1);

  return app;
}

function getApp() {
  if (!appPromise) {
    appPromise = createApp();
  }
  return appPromise;
}

/** Vercel serverless entry — Express handles the request after warm/cold init. */
async function handler(req, res) {
  const app = await getApp();
  return app(req, res);
}

module.exports = handler;
module.exports.getApp = getApp;

if (require.main === module) {
  getApp()
    .then((app) => {
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}
