require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

connectDB();

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check (unversioned for load balancers / uptime monitors)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SkillIcons API running' });
});

const apiV1 = express.Router();
apiV1.use('/icons', require('./routes/iconRoutes'));
apiV1.use('/request', require('./routes/requestRoutes'));
apiV1.use('/gallery', require('./routes/galleryRoutes'));
apiV1.use('/admin', require('./routes/adminRoutes'));

app.use('/api/v1', apiV1);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
