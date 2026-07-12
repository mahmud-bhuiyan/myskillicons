const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const seedIcons = require('./utils/seedIcons');

let appPromise = null;

const createApp = async () => {
  await connectDB();
  await seedIcons();

  const app = express();

  // Trust proxy so req.ip / X-Forwarded-For work behind Vercel, nginx, etc.
  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));
  app.use(express.json({ limit: '300kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  app.get('/', (req, res) => {
    res.type("text").send("MyIconix backend server is running 🚀");
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'MyIconix API running' });
  });

  app.use('/icons', require('./routes/iconRoutes'));

  const apiV1 = express.Router();
  apiV1.use('/request', require('./routes/requestRoutes'));
  apiV1.use('/gallery', require('./routes/galleryRoutes'));
  apiV1.use('/admin', require('./routes/adminRoutes'));
  app.use('/api/v1', apiV1);

  return app;
};

const getApp = () => {
  if (!appPromise) {
    appPromise = createApp().catch((err) => {
      // Allow the next request to retry after a failed cold start
      appPromise = null;
      throw err;
    });
  }
  return appPromise;
};

/** Vercel serverless entry — Express handles the request after warm/cold init. */
const handler = async (req, res) => {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error('Serverless handler failed:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'Server failed to start',
          message: err.message || String(err),
        })
      );
    }
  }
};

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
