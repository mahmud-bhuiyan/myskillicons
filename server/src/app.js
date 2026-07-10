require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const seedIcons = require('./utils/seedIcons');

const start = async () => {
  await connectDB();
  await seedIcons();

  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json({ limit: '300kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // Health check (unversioned for load balancers / uptime monitors)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'SkillIcons API running' });
  });

  // Public icon URLs — short path for embeds (no /api/v1)
  // e.g. https://myskillicons.com/icons?i=js,react,nodejs&theme=dark
  app.use('/icons', require('./routes/iconRoutes'));

  // Versioned backend APIs
  const apiV1 = express.Router();
  apiV1.use('/request', require('./routes/requestRoutes'));
  apiV1.use('/gallery', require('./routes/galleryRoutes'));
  apiV1.use('/admin', require('./routes/adminRoutes'));

  app.use('/api/v1', apiV1);

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
