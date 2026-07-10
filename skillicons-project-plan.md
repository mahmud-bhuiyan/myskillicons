# SkillIcons — Full Project Plan for Cursor AI
> Build a developer tool that serves skill icons via URL with theme, size, batch, and community features.
> Each phase ends with a testable checkpoint. Complete one phase, test it, then move to the next.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Cache | node-cache (in-memory, upgrade to Redis later) |
| Image/Icon | SVG strings served as `image/svg+xml` |
| Auth (Admin) | JWT + bcrypt |
| File Upload | Multer |
| Deployment | Vercel (frontend) + Render (backend) + MongoDB Atlas |

---

## Folder Structure (Full)

```
skillicons/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── iconController.js
│   │   │   ├── requestController.js
│   │   │   ├── galleryController.js
│   │   │   └── adminController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── cacheMiddleware.js
│   │   ├── models/
│   │   │   ├── Icon.js
│   │   │   ├── IconRequest.js
│   │   │   └── Admin.js
│   │   ├── routes/
│   │   │   ├── iconRoutes.js
│   │   │   ├── requestRoutes.js
│   │   │   ├── galleryRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── icons/
│   │   │   └── (all SVG files go here, e.g. js.svg, react.svg)
│   │   ├── utils/
│   │   │   ├── svgProcessor.js
│   │   │   └── iconRegistry.js
│   │   └── app.js
│   ├── .env
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── IconCard.jsx
│   │   │   ├── IconPicker.jsx
│   │   │   ├── PreviewPane.jsx
│   │   │   ├── URLOutput.jsx
│   │   │   ├── ThemeToggle.jsx
│   │   │   └── AdminRoute.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Playground.jsx
│   │   │   ├── Gallery.jsx
│   │   │   ├── RequestIcon.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

# PHASE 1 — Project Setup & Basic Server
**Goal: A running Express server connected to MongoDB. Test with Postman or browser.**

## Step 1.1 — Initialize the monorepo

```bash
mkdir skillicons && cd skillicons
mkdir server client
cd server
npm init -y
npm install express mongoose dotenv cors helmet morgan node-cache multer bcryptjs jsonwebtoken
npm install -D nodemon
```

## Step 1.2 — Create `server/.env`

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/skillicons
JWT_SECRET=your_super_secret_key_change_this
NODE_ENV=development
```

## Step 1.3 — Create `server/src/config/db.js`

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

## Step 1.4 — Create `server/src/app.js`

```javascript
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SkillIcons API running' });
});

// Routes (will add in later phases)
// app.use('/icons', require('./routes/iconRoutes'));
// app.use('/gallery', require('./routes/galleryRoutes'));
// app.use('/request', require('./routes/requestRoutes'));
// app.use('/admin', require('./routes/adminRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

## Step 1.5 — Add scripts to `server/package.json`

```json
"scripts": {
  "start": "node src/app.js",
  "dev": "nodemon src/app.js"
}
```

## ✅ TEST PHASE 1
```bash
cd server && npm run dev
# Open browser: http://localhost:5000/health
# Expected: { "status": "ok", "message": "SkillIcons API running" }
```

---

# PHASE 2 — Icon Engine (Core Feature)
**Goal: Hit a URL like `/icons?i=js&theme=dark&width=48&height=48` and get back an SVG image.**

## Step 2.1 — Add your first SVG icons

Create folder: `server/src/icons/`

For each icon, create a plain SVG file. The SVG should use these placeholder tokens that the engine will replace:
- `{{WIDTH}}` — will be replaced by requested width
- `{{HEIGHT}}` — will be replaced by requested height
- `{{COLOR_PRIMARY}}` — main icon color (changes per theme)
- `{{COLOR_BG}}` — background color (changes per theme)

**Example: `server/src/icons/js.svg`**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="{{WIDTH}}" height="{{HEIGHT}}">
  <rect width="48" height="48" rx="6" fill="{{COLOR_BG}}"/>
  <path fill="{{COLOR_PRIMARY}}" d="M35.2 34.3c-.5-3.1-2.5-4.1-5-4.9l-1.1-.3c-1.1-.3-2-.6-2-1.5 0-.8.6-1.3 2-1.3 1.3 0 2.2.5 2.6 1.8l2.9-1.8c-.7-2-2.5-3.2-5.5-3.2-3.3 0-5.3 1.7-5.3 4.2 0 2.9 2.1 3.9 4.6 4.6l1.1.3c1.3.4 2.3.8 2.3 1.9 0 1-.9 1.6-2.5 1.6-1.8 0-3-.9-3.4-2.6l-3 1.7c.8 2.7 3 4.2 6.4 4.2 3.6-.1 5.9-1.8 5.9-4.7zm-13.3-1.3c-.4-2.3-1.9-4.2-6-4.2v-5.7h-3.2v5.7c-4.1 0-5.6 1.9-6 4.2-.1.6-.1 1.2-.1 1.8 0 .6 0 1.2.1 1.8.4 2.3 1.9 4.2 6 4.2v2.6h3.2v-2.6c4.1 0 5.6-1.9 6-4.2.1-.6.1-1.2.1-1.8 0-.6 0-1.2-.1-1.8zm-3.1 1.8c0 1.8-.8 2.8-2.9 2.8s-2.9-1-2.9-2.8v-.1l-.1-.1c0-1.8.8-2.8 2.9-2.8s2.9 1 2.9 2.8v.2z"/>
</svg>
```

**Simpler approach for starting out** — use simple colored rect + text SVGs for testing, replace with real icons later:

`server/src/icons/js.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="{{WIDTH}}" height="{{HEIGHT}}">
  <rect width="48" height="48" rx="8" fill="{{COLOR_BG}}"/>
  <text x="24" y="30" font-family="monospace" font-size="14" font-weight="bold" fill="{{COLOR_PRIMARY}}" text-anchor="middle">JS</text>
</svg>
```

`server/src/icons/react.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="{{WIDTH}}" height="{{HEIGHT}}">
  <rect width="48" height="48" rx="8" fill="{{COLOR_BG}}"/>
  <text x="24" y="30" font-family="monospace" font-size="11" font-weight="bold" fill="{{COLOR_PRIMARY}}" text-anchor="middle">REACT</text>
</svg>
```

`server/src/icons/nodejs.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="{{WIDTH}}" height="{{HEIGHT}}">
  <rect width="48" height="48" rx="8" fill="{{COLOR_BG}}"/>
  <text x="24" y="30" font-family="monospace" font-size="10" font-weight="bold" fill="{{COLOR_PRIMARY}}" text-anchor="middle">NODE</text>
</svg>
```

> NOTE FOR CURSOR: After the app is working, replace these placeholder SVGs with real high-quality icons from https://github.com/devicons/devicon (they are free SVGs). Download the ones you want and put them in the icons/ folder, then update iconRegistry.js.

## Step 2.2 — Create `server/src/utils/iconRegistry.js`

```javascript
// This file maps icon short names to their file paths and metadata
// Add more icons here as you expand the library

const iconRegistry = {
  js: {
    name: 'JavaScript',
    file: 'js.svg',
    category: 'language',
    themes: {
      light: { bg: '#F7DF1E', primary: '#323330' },
      dark:  { bg: '#323330', primary: '#F7DF1E' },
      auto:  { bg: '#F7DF1E', primary: '#323330' },
    }
  },
  react: {
    name: 'React',
    file: 'react.svg',
    category: 'framework',
    themes: {
      light: { bg: '#E8F4FD', primary: '#61DAFB' },
      dark:  { bg: '#20232A', primary: '#61DAFB' },
      auto:  { bg: '#20232A', primary: '#61DAFB' },
    }
  },
  nodejs: {
    name: 'Node.js',
    file: 'nodejs.svg',
    category: 'runtime',
    themes: {
      light: { bg: '#EBF5EB', primary: '#339933' },
      dark:  { bg: '#1A2A1A', primary: '#68CC68' },
      auto:  { bg: '#1A2A1A', primary: '#68CC68' },
    }
  },
  python: {
    name: 'Python',
    file: 'python.svg',
    category: 'language',
    themes: {
      light: { bg: '#FFF8E1', primary: '#3776AB' },
      dark:  { bg: '#1A1A2E', primary: '#FFD43B' },
      auto:  { bg: '#1A1A2E', primary: '#FFD43B' },
    }
  },
  mongodb: {
    name: 'MongoDB',
    file: 'mongodb.svg',
    category: 'database',
    themes: {
      light: { bg: '#E8F5E9', primary: '#47A248' },
      dark:  { bg: '#0D1B0F', primary: '#47A248' },
      auto:  { bg: '#0D1B0F', primary: '#47A248' },
    }
  },
  html: {
    name: 'HTML5',
    file: 'html.svg',
    category: 'language',
    themes: {
      light: { bg: '#FFF3E0', primary: '#E34F26' },
      dark:  { bg: '#2A1506', primary: '#FF6B35' },
      auto:  { bg: '#2A1506', primary: '#FF6B35' },
    }
  },
  css: {
    name: 'CSS3',
    file: 'css.svg',
    category: 'language',
    themes: {
      light: { bg: '#E3F2FD', primary: '#1572B6' },
      dark:  { bg: '#051524', primary: '#1572B6' },
      auto:  { bg: '#051524', primary: '#1572B6' },
    }
  },
  typescript: {
    name: 'TypeScript',
    file: 'typescript.svg',
    category: 'language',
    themes: {
      light: { bg: '#E8F0FB', primary: '#3178C6' },
      dark:  { bg: '#0D1926', primary: '#3178C6' },
      auto:  { bg: '#0D1926', primary: '#3178C6' },
    }
  },
};

module.exports = iconRegistry;
```

## Step 2.3 — Create `server/src/utils/svgProcessor.js`

```javascript
const fs = require('fs');
const path = require('path');
const NodeCache = require('node-cache');
const iconRegistry = require('./iconRegistry');

const cache = new NodeCache({ stdTTL: 3600 }); // cache 1 hour
const ICONS_DIR = path.join(__dirname, '../icons');

const DEFAULTS = {
  theme: 'dark',
  width: 48,
  height: 48,
};

const LIMITS = {
  minSize: 16,
  maxSize: 256,
  maxBatch: 20,
};

/**
 * Processes a single icon and returns SVG string
 */
function processSingleIcon(iconKey, theme, width, height) {
  const cacheKey = `${iconKey}_${theme}_${width}_${height}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const iconMeta = iconRegistry[iconKey.toLowerCase()];
  if (!iconMeta) return null;

  const filePath = path.join(ICONS_DIR, iconMeta.file);
  if (!fs.existsSync(filePath)) return null;

  let svgContent = fs.readFileSync(filePath, 'utf-8');

  const themeColors = iconMeta.themes[theme] || iconMeta.themes['dark'];

  svgContent = svgContent
    .replace(/\{\{WIDTH\}\}/g, width)
    .replace(/\{\{HEIGHT\}\}/g, height)
    .replace(/\{\{COLOR_BG\}\}/g, themeColors.bg)
    .replace(/\{\{COLOR_PRIMARY\}\}/g, themeColors.primary);

  cache.set(cacheKey, svgContent);
  return svgContent;
}

/**
 * Processes batch icons and returns combined SVG strip
 */
function processBatchIcons(iconKeys, theme, width, height, layout = 'row', gap = 8) {
  const svgs = [];

  for (const key of iconKeys) {
    const svg = processSingleIcon(key.trim(), theme, width, height);
    if (svg) svgs.push({ key, svg });
  }

  if (svgs.length === 0) return null;

  if (layout === 'row') {
    const totalWidth = svgs.length * width + (svgs.length - 1) * gap;
    const totalHeight = height;

    let combined = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">`;
    svgs.forEach(({ svg }, index) => {
      const x = index * (width + gap);
      // Extract inner content from each SVG
      const innerContent = svg.replace(/<svg[^>]*>/, '').replace('</svg>', '');
      combined += `<g transform="translate(${x}, 0)">${innerContent}</g>`;
    });
    combined += '</svg>';
    return combined;
  }

  // grid layout
  const cols = Math.ceil(Math.sqrt(svgs.length));
  const rows = Math.ceil(svgs.length / cols);
  const totalWidth = cols * width + (cols - 1) * gap;
  const totalHeight = rows * height + (rows - 1) * gap;

  let combined = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">`;
  svgs.forEach(({ svg }, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = col * (width + gap);
    const y = row * (height + gap);
    const innerContent = svg.replace(/<svg[^>]*>/, '').replace('</svg>', '');
    combined += `<g transform="translate(${x}, ${y})">${innerContent}</g>`;
  });
  combined += '</svg>';
  return combined;
}

function validateParams(query) {
  let { i, theme, width, height, w, h, layout, gap } = query;

  // Support both width/height and w/h shorthand
  width = parseInt(width || w) || DEFAULTS.width;
  height = parseInt(height || h) || DEFAULTS.height;

  // Clamp sizes
  width = Math.min(Math.max(width, LIMITS.minSize), LIMITS.maxSize);
  height = Math.min(Math.max(height, LIMITS.minSize), LIMITS.maxSize);

  theme = ['light', 'dark', 'auto'].includes(theme) ? theme : DEFAULTS.theme;
  layout = ['row', 'grid'].includes(layout) ? layout : 'row';
  gap = Math.min(Math.max(parseInt(gap) || 8, 0), 64);

  return { i, theme, width, height, layout, gap };
}

module.exports = { processSingleIcon, processBatchIcons, validateParams, LIMITS };
```

## Step 2.4 — Create `server/src/controllers/iconController.js`

```javascript
const { processSingleIcon, processBatchIcons, validateParams, LIMITS } = require('../utils/svgProcessor');
const iconRegistry = require('../utils/iconRegistry');

/**
 * GET /icons?i=js&theme=dark&width=48&height=48
 * GET /icons?i=js,react,nodejs&theme=dark&width=48&height=48
 */
const getIcons = (req, res) => {
  const { i, theme, width, height, layout, gap } = validateParams(req.query);

  if (!i) {
    return res.status(400).json({ error: 'Missing required param: i (icon name or comma-separated list)' });
  }

  const iconKeys = i.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);

  if (iconKeys.length === 0) {
    return res.status(400).json({ error: 'No valid icon names provided' });
  }

  if (iconKeys.length > LIMITS.maxBatch) {
    return res.status(400).json({ error: `Max ${LIMITS.maxBatch} icons per request` });
  }

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // CDN cache 1 day

  if (iconKeys.length === 1) {
    const svg = processSingleIcon(iconKeys[0], theme, width, height);
    if (!svg) {
      return res.status(404).json({ error: `Icon "${iconKeys[0]}" not found` });
    }
    return res.send(svg);
  }

  // Batch
  const svg = processBatchIcons(iconKeys, theme, width, height, layout, gap);
  if (!svg) {
    return res.status(404).json({ error: 'None of the requested icons were found' });
  }
  return res.send(svg);
};

/**
 * GET /icons/list — returns all available icon keys and metadata
 */
const listIcons = (req, res) => {
  const icons = Object.entries(iconRegistry).map(([key, meta]) => ({
    key,
    name: meta.name,
    category: meta.category,
    themes: Object.keys(meta.themes),
  }));
  res.json({ total: icons.length, icons });
};

module.exports = { getIcons, listIcons };
```

## Step 2.5 — Create `server/src/routes/iconRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { getIcons, listIcons } = require('../controllers/iconController');

router.get('/', getIcons);
router.get('/list', listIcons);

module.exports = router;
```

## Step 2.6 — Wire routes into `server/src/app.js`

Uncomment or add this line in app.js:
```javascript
app.use('/icons', require('./routes/iconRoutes'));
```

Also create the icons directory and add at least the placeholder SVG files for: js, react, nodejs, python, mongodb, html, css, typescript (copy the SVG examples from Step 2.1 for each, adjusting the text label).

## ✅ TEST PHASE 2

```
# Single icon
http://localhost:5000/icons?i=js

# With theme and size
http://localhost:5000/icons?i=js&theme=dark&width=64&height=64

# Batch row
http://localhost:5000/icons?i=js,react,nodejs&theme=dark

# Batch grid
http://localhost:5000/icons?i=js,react,nodejs,python&theme=dark&layout=grid

# List all icons
http://localhost:5000/icons/list
```

Open the single icon URL directly in a browser — you should see an SVG image render inline.

---

# PHASE 3 — MongoDB Models & Icon Request System
**Goal: Users can submit icon requests. Data is stored in MongoDB.**

## Step 3.1 — Create `server/src/models/Icon.js`

```javascript
const mongoose = require('mongoose');

const iconSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['language', 'framework', 'runtime', 'database', 'tool', 'cloud', 'other'],
    default: 'other',
  },
  svgContent: { type: String }, // store SVG as string if not using file system
  filePath: { type: String },   // or store path to file
  themes: {
    light: { bg: String, primary: String },
    dark: { bg: String, primary: String },
  },
  submittedBy: { type: String }, // username or email of community contributor
  isApproved: { type: Boolean, default: true }, // false for community pending approval
  downloadCount: { type: Number, default: 0 },
  tags: [String],
}, { timestamps: true });

module.exports = mongoose.model('Icon', iconSchema);
```

## Step 3.2 — Create `server/src/models/IconRequest.js`

```javascript
const mongoose = require('mongoose');

const iconRequestSchema = new mongoose.Schema({
  iconName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  referenceUrl: {
    type: String, // link to official logo or reference
  },
  submittedSvg: {
    type: String, // optional: user submits their own SVG
  },
  submitterEmail: {
    type: String,
    required: true,
  },
  submitterName: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'in-progress'],
    default: 'pending',
  },
  adminNote: {
    type: String, // note from admin on rejection/approval
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  upvotedBy: [String], // array of emails to prevent double voting
}, { timestamps: true });

module.exports = mongoose.model('IconRequest', iconRequestSchema);
```

## Step 3.3 — Create `server/src/models/Admin.js`

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
```

## Step 3.4 — Create `server/src/controllers/requestController.js`

```javascript
const IconRequest = require('../models/IconRequest');

/**
 * POST /request — Submit a new icon request
 */
const submitRequest = async (req, res) => {
  try {
    const { iconName, description, referenceUrl, submittedSvg, submitterEmail, submitterName } = req.body;

    if (!iconName || !description || !submitterEmail) {
      return res.status(400).json({ error: 'iconName, description, and submitterEmail are required' });
    }

    // Check if a request for this icon already exists (pending)
    const existing = await IconRequest.findOne({
      iconName: { $regex: new RegExp(`^${iconName}$`, 'i') },
      status: 'pending',
    });

    if (existing) {
      // Auto-upvote the existing request instead of creating duplicate
      if (!existing.upvotedBy.includes(submitterEmail)) {
        existing.upvotes += 1;
        existing.upvotedBy.push(submitterEmail);
        await existing.save();
      }
      return res.status(200).json({
        message: 'A request for this icon already exists. Your upvote has been added.',
        request: existing,
      });
    }

    const newRequest = await IconRequest.create({
      iconName,
      description,
      referenceUrl,
      submittedSvg,
      submitterEmail,
      submitterName,
    });

    res.status(201).json({ message: 'Icon request submitted successfully', request: newRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /request — Get all pending requests (public, sorted by upvotes)
 */
const getRequests = async (req, res) => {
  try {
    const requests = await IconRequest.find({ status: 'pending' })
      .select('-upvotedBy') // don't expose who upvoted
      .sort({ upvotes: -1, createdAt: -1 });

    res.json({ total: requests.length, requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /request/:id/upvote — Upvote an existing request
 */
const upvoteRequest = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required to upvote' });

    const request = await IconRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (request.upvotedBy.includes(email)) {
      return res.status(400).json({ error: 'You have already upvoted this request' });
    }

    request.upvotes += 1;
    request.upvotedBy.push(email);
    await request.save();

    res.json({ message: 'Upvote added', upvotes: request.upvotes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { submitRequest, getRequests, upvoteRequest };
```

## Step 3.5 — Create `server/src/routes/requestRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { submitRequest, getRequests, upvoteRequest } = require('../controllers/requestController');

router.post('/', submitRequest);
router.get('/', getRequests);
router.post('/:id/upvote', upvoteRequest);

module.exports = router;
```

## Step 3.6 — Wire routes in `app.js`

```javascript
app.use('/request', require('./routes/requestRoutes'));
```

## ✅ TEST PHASE 3

Use Postman or Thunder Client (VS Code extension):

```
POST http://localhost:5000/request
Content-Type: application/json
Body:
{
  "iconName": "Vue.js",
  "description": "Need Vue.js icon for frontend skill showcase",
  "submitterEmail": "dev@example.com",
  "submitterName": "John Dev",
  "referenceUrl": "https://vuejs.org"
}

Expected: 201 with the created request

GET http://localhost:5000/request
Expected: list of all pending requests sorted by upvotes
```

---

# PHASE 4 — Gallery API & Admin Auth
**Goal: Public gallery endpoint + admin login with JWT.**

## Step 4.1 — Create `server/src/controllers/galleryController.js`

```javascript
const iconRegistry = require('../utils/iconRegistry');

/**
 * GET /gallery — Returns all icons with metadata for the gallery page
 */
const getGallery = (req, res) => {
  const { category, search, page = 1, limit = 50 } = req.query;

  let icons = Object.entries(iconRegistry).map(([key, meta]) => ({
    key,
    name: meta.name,
    category: meta.category,
    previewUrl: `/icons?i=${key}&theme=dark&width=48&height=48`,
    themes: Object.keys(meta.themes),
  }));

  // Filter by category
  if (category && category !== 'all') {
    icons = icons.filter(icon => icon.category === category);
  }

  // Filter by search
  if (search) {
    const q = search.toLowerCase();
    icons = icons.filter(icon =>
      icon.name.toLowerCase().includes(q) || icon.key.toLowerCase().includes(q)
    );
  }

  // Pagination
  const total = icons.length;
  const start = (page - 1) * limit;
  const paginated = icons.slice(start, start + parseInt(limit));

  res.json({
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    icons: paginated,
  });
};

/**
 * GET /gallery/categories — Returns list of unique categories
 */
const getCategories = (req, res) => {
  const categories = [...new Set(Object.values(iconRegistry).map(m => m.category))];
  res.json({ categories: ['all', ...categories] });
};

module.exports = { getGallery, getCategories };
```

## Step 4.2 — Create `server/src/routes/galleryRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { getGallery, getCategories } = require('../controllers/galleryController');

router.get('/', getGallery);
router.get('/categories', getCategories);

module.exports = router;
```

## Step 4.3 — Create `server/src/middleware/authMiddleware.js`

```javascript
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorized. Token missing.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { protect };
```

## Step 4.4 — Create `server/src/controllers/adminController.js`

```javascript
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const IconRequest = require('../models/IconRequest');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

/**
 * POST /admin/setup — Create admin account (only works if no admin exists)
 * Run this ONCE to create your admin. Then disable or remove this route.
 */
const setupAdmin = async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0) return res.status(403).json({ error: 'Admin already exists' });

    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const admin = await Admin.create({ username, password });
    res.status(201).json({ message: 'Admin created', token: generateToken(admin._id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /admin/login
 */
const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ token: generateToken(admin._id), username: admin.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /admin/requests — All requests (all statuses) for admin view
 */
const getAllRequests = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const requests = await IconRequest.find({ status })
      .sort({ upvotes: -1, createdAt: -1 });
    res.json({ total: requests.length, requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PATCH /admin/requests/:id — Update status of a request
 */
const updateRequestStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'in-progress'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const request = await IconRequest.findByIdAndUpdate(
      req.params.id,
      { status, adminNote },
      { new: true }
    );

    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json({ message: 'Request updated', request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { setupAdmin, loginAdmin, getAllRequests, updateRequestStatus };
```

## Step 4.5 — Create `server/src/routes/adminRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { setupAdmin, loginAdmin, getAllRequests, updateRequestStatus } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

router.post('/setup', setupAdmin);       // run once, then remove
router.post('/login', loginAdmin);
router.get('/requests', protect, getAllRequests);
router.patch('/requests/:id', protect, updateRequestStatus);

module.exports = router;
```

## Step 4.6 — Wire remaining routes in `app.js`

```javascript
app.use('/gallery', require('./routes/galleryRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
```

## ✅ TEST PHASE 4

```
# Setup admin (run ONCE)
POST http://localhost:5000/admin/setup
Body: { "username": "admin", "password": "securepass123" }
Expected: 201 with token

# Login
POST http://localhost:5000/admin/login
Body: { "username": "admin", "password": "securepass123" }
Expected: token

# Get gallery
GET http://localhost:5000/gallery
GET http://localhost:5000/gallery?category=language
GET http://localhost:5000/gallery?search=js
GET http://localhost:5000/gallery/categories

# Get all requests as admin (use token from login)
GET http://localhost:5000/admin/requests
Headers: Authorization: Bearer <your_token>

# Approve a request
PATCH http://localhost:5000/admin/requests/<request_id>
Headers: Authorization: Bearer <your_token>
Body: { "status": "approved", "adminNote": "Will add in next release" }
```

---

# PHASE 5 — React Frontend Setup
**Goal: Vite + React app with routing, Tailwind, and API utility.**

## Step 5.1 — Initialize client

```bash
cd ../client
npm create vite@latest . -- --template react
npm install
npm install react-router-dom axios tailwindcss @tailwindcss/vite
```

## Step 5.2 — Configure Tailwind in `client/vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/icons': 'http://localhost:5000',
      '/gallery': 'http://localhost:5000',
      '/request': 'http://localhost:5000',
      '/admin': 'http://localhost:5000',
    }
  }
})
```

## Step 5.3 — Update `client/src/index.css`

```css
@import "tailwindcss";
```

## Step 5.4 — Create `client/src/utils/api.js`

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Auto-attach JWT token if logged in as admin
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

## Step 5.5 — Create `client/src/context/AuthContext.jsx`

```jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));

  const login = (newToken) => {
    localStorage.setItem('adminToken', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, isAdmin: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

## Step 5.6 — Create `client/src/components/AdminRoute.jsx`

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/admin/login" replace />;
}
```

## Step 5.7 — Create `client/src/components/Navbar.jsx`

```jsx
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/playground', label: 'Playground' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/request', label: 'Request Icon' },
  ];

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-white font-bold text-lg tracking-tight">
          skill<span className="text-yellow-400">icons</span>
        </Link>
        <div className="flex gap-6">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm transition-colors ${
                location.pathname === item.path
                  ? 'text-white font-medium'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
```

## Step 5.8 — Update `client/src/App.jsx`

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Playground from './pages/Playground';
import Gallery from './pages/Gallery';
import RequestIcon from './pages/RequestIcon';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-zinc-950 text-white">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/request" element={<RequestIcon />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <AdminRoute><AdminDashboard /></AdminRoute>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

## Step 5.9 — Create stub pages (so routes don't crash)

Create each file with a simple placeholder:

`client/src/pages/Home.jsx`
```jsx
export default function Home() {
  return <div className="p-8 text-center"><h1 className="text-3xl font-bold">SkillIcons</h1><p className="text-zinc-400 mt-2">Homepage coming in Phase 6</p></div>;
}
```

Do the same for `Playground.jsx`, `Gallery.jsx`, `RequestIcon.jsx`, `AdminLogin.jsx`, `AdminDashboard.jsx` — just change the title text.

## ✅ TEST PHASE 5

```bash
cd client && npm run dev
# Open http://localhost:5173
# You should see: Navbar + "SkillIcons Homepage coming in Phase 6"
# Click each nav link — all routes should load without errors
# /admin should redirect to /admin/login
```

---

# PHASE 6 — Playground Page (Core UI)
**Goal: The interactive icon builder — pick icons, set options, preview, copy URL.**

## Step 6.1 — Create `client/src/pages/Playground.jsx`

```jsx
import { useState, useEffect } from 'react';
import api from '../utils/api';

const THEMES = ['dark', 'light', 'auto'];
const LAYOUTS = ['row', 'grid'];
const SIZES = [24, 32, 48, 64, 80, 96];

export default function Playground() {
  const [allIcons, setAllIcons] = useState([]);
  const [selected, setSelected] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [size, setSize] = useState(48);
  const [layout, setLayout] = useState('row');
  const [gap, setGap] = useState(8);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    api.get('/gallery').then(res => setAllIcons(res.data.icons));
  }, []);

  const toggleIcon = (key) => {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const buildUrl = () => {
    if (selected.length === 0) return '';
    const base = `${window.location.origin}/icons`;
    const params = new URLSearchParams({
      i: selected.join(','),
      theme,
      width: size,
      height: size,
      layout,
      gap,
    });
    return `${base}?${params}`;
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(buildUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = ['all', ...new Set(allIcons.map(i => i.category))];

  const filtered = allIcons.filter(icon =>
    (activeCategory === 'all' || icon.category === activeCategory) &&
    (icon.name.toLowerCase().includes(search.toLowerCase()) || icon.key.includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Icon Playground</h1>
      <p className="text-zinc-400 mb-8 text-sm">Pick icons, customize settings, and copy your embed URL.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT: Icon picker */}
        <div className="lg:col-span-2">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Search icons..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400"
            />
          </div>

          {/* Category filters */}
          <div className="flex gap-2 flex-wrap mb-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${
                  activeCategory === cat
                    ? 'bg-yellow-400 text-black border-yellow-400 font-medium'
                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Icon grid */}
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {filtered.map(icon => (
              <button
                key={icon.key}
                onClick={() => toggleIcon(icon.key)}
                title={icon.name}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                  selected.includes(icon.key)
                    ? 'border-yellow-400 bg-yellow-400/10'
                    : 'border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <img
                  src={`/icons?i=${icon.key}&theme=${theme}&width=32&height=32`}
                  width={32}
                  height={32}
                  alt={icon.name}
                  className="rounded"
                />
                <span className="text-zinc-500 text-xs truncate w-full text-center">{icon.key}</span>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Settings + Preview */}
        <div className="space-y-6">

          {/* Selected chips */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Selected ({selected.length})</label>
            <div className="flex flex-wrap gap-1 min-h-8">
              {selected.length === 0 && <span className="text-zinc-600 text-sm">Click icons to select</span>}
              {selected.map(key => (
                <span
                  key={key}
                  onClick={() => toggleIcon(key)}
                  className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded cursor-pointer hover:bg-red-900/40 hover:text-red-400 transition-colors"
                >
                  {key} ×
                </span>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Theme</label>
            <div className="flex gap-2">
              {THEMES.map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex-1 py-2 rounded-lg border text-sm capitalize transition-colors ${
                    theme === t ? 'border-yellow-400 text-yellow-400' : 'border-zinc-700 text-zinc-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Size: {size}px</label>
            <div className="flex gap-2 flex-wrap">
              {SIZES.map(s => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-3 py-1 rounded border text-sm transition-colors ${
                    size === s ? 'border-yellow-400 text-yellow-400' : 'border-zinc-700 text-zinc-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Layout + Gap */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Layout</label>
            <div className="flex gap-2 mb-3">
              {LAYOUTS.map(l => (
                <button
                  key={l}
                  onClick={() => setLayout(l)}
                  className={`flex-1 py-2 rounded-lg border text-sm capitalize transition-colors ${
                    layout === l ? 'border-yellow-400 text-yellow-400' : 'border-zinc-700 text-zinc-400'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <label className="text-xs text-zinc-500 mb-1 block">Gap: {gap}px</label>
            <input
              type="range" min={0} max={32} value={gap}
              onChange={e => setGap(Number(e.target.value))}
              className="w-full accent-yellow-400"
            />
          </div>

          {/* Preview */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Preview</label>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 min-h-20 flex items-center justify-center">
              {selected.length === 0
                ? <span className="text-zinc-600 text-sm">Select icons to preview</span>
                : <img
                    src={buildUrl()}
                    alt="preview"
                    className="max-w-full"
                    key={buildUrl()}
                  />
              }
            </div>
          </div>

          {/* URL output */}
          {selected.length > 0 && (
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Embed URL</label>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-400 break-all font-mono mb-2">
                {buildUrl()}
              </div>
              <button
                onClick={copyUrl}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                  copied ? 'bg-green-600 text-white' : 'bg-yellow-400 text-black hover:bg-yellow-300'
                }`}
              >
                {copied ? 'Copied!' : 'Copy URL'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## ✅ TEST PHASE 6

```
http://localhost:5173/playground
- Icons should load in the grid
- Click icons to select them → preview updates
- Change theme/size/layout → preview updates
- Copy URL → paste in browser tab → SVG renders
```

---

# PHASE 7 — Gallery Page
**Goal: Searchable, filterable, paginated public gallery of all icons.**

## Step 7.1 — Create `client/src/pages/Gallery.jsx`

```jsx
import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Gallery() {
  const [icons, setIcons] = useState([]);
  const [categories, setCategories] = useState(['all']);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState('dark');
  const [size, setSize] = useState(48);
  const [loading, setLoading] = useState(true);
  const [selectedIcon, setSelectedIcon] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/gallery'),
      api.get('/gallery/categories'),
    ]).then(([iconsRes, catRes]) => {
      setIcons(iconsRes.data.icons);
      setCategories(catRes.data.categories);
      setLoading(false);
    });
  }, []);

  const filtered = icons.filter(icon =>
    (activeCategory === 'all' || icon.category === activeCategory) &&
    (icon.name.toLowerCase().includes(search.toLowerCase()) || icon.key.includes(search.toLowerCase()))
  );

  const iconUrl = (key) =>
    `/icons?i=${key}&theme=${theme}&width=${size}&height=${size}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Icon Gallery</h1>
      <p className="text-zinc-400 text-sm mb-6">{icons.length} icons available. Click any icon to get its URL.</p>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search icons..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
        />
        <select
          value={theme}
          onChange={e => setTheme(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          {['dark','light','auto'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={size}
          onChange={e => setSize(Number(e.target.value))}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          {[24,32,48,64,80,96].map(s => <option key={s} value={s}>{s}px</option>)}
        </select>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${
              activeCategory === cat
                ? 'bg-yellow-400 text-black border-yellow-400'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-zinc-500 text-center py-20">Loading icons...</div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {filtered.map(icon => (
            <button
              key={icon.key}
              onClick={() => setSelectedIcon(icon)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-zinc-800 hover:border-zinc-600 transition-all group"
            >
              <img
                src={iconUrl(icon.key)}
                width={size}
                height={size}
                alt={icon.name}
                className="rounded"
              />
              <span className="text-zinc-500 text-xs group-hover:text-zinc-300 transition-colors truncate w-full text-center">
                {icon.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Icon detail modal */}
      {selectedIcon && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedIcon(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <img src={iconUrl(selectedIcon.key)} width={64} height={64} alt={selectedIcon.name} className="rounded-xl" />
              <div>
                <h3 className="font-semibold text-lg">{selectedIcon.name}</h3>
                <span className="text-zinc-400 text-sm capitalize">{selectedIcon.category}</span>
              </div>
            </div>
            <p className="text-zinc-500 text-xs mb-2">URL</p>
            <div className="bg-zinc-950 rounded-lg p-3 text-xs font-mono text-zinc-400 break-all mb-4">
              {iconUrl(selectedIcon.key)}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(iconUrl(selectedIcon.key)); }}
                className="py-2 bg-yellow-400 text-black rounded-lg text-sm font-medium hover:bg-yellow-300"
              >
                Copy URL
              </button>
              <button
                onClick={() => setSelectedIcon(null)}
                className="py-2 border border-zinc-700 text-zinc-400 rounded-lg text-sm hover:border-zinc-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## ✅ TEST PHASE 7

```
http://localhost:5173/gallery
- All icons render in grid
- Search filters correctly
- Category tabs filter correctly
- Theme/size dropdowns change preview images
- Click icon → modal appears with URL
- Copy URL → paste in browser → SVG renders
```

---

# PHASE 8 — Request Icon Page
**Goal: Form to submit icon requests with validation.**

## Step 8.1 — Create `client/src/pages/RequestIcon.jsx`

```jsx
import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function RequestIcon() {
  const [form, setForm] = useState({
    iconName: '', description: '', referenceUrl: '', submitterEmail: '', submitterName: ''
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [existingRequests, setExistingRequests] = useState([]);

  useEffect(() => {
    api.get('/request').then(res => setExistingRequests(res.data.requests));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.post('/request', form);
      setStatus({ type: 'success', message: res.data.message });
      setForm({ iconName: '', description: '', referenceUrl: '', submitterEmail: '', submitterName: '' });
      const updated = await api.get('/request');
      setExistingRequests(updated.data.requests);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Something went wrong' });
    }
    setLoading(false);
  };

  const handleUpvote = async (id) => {
    const email = prompt('Enter your email to upvote:');
    if (!email) return;
    try {
      await api.post(`/request/${id}/upvote`, { email });
      const updated = await api.get('/request');
      setExistingRequests(updated.data.requests);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not upvote');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Request an Icon</h1>
      <p className="text-zinc-400 text-sm mb-8">Don't see your tech? Submit a request and the community can upvote it.</p>

      <form onSubmit={handleSubmit} className="space-y-4 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Icon Name *</label>
            <input
              required
              type="text"
              placeholder="e.g. Vue.js"
              value={form.iconName}
              onChange={e => setForm({ ...form, iconName: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Your Name</label>
            <input
              type="text"
              placeholder="Optional"
              value={form.submitterName}
              onChange={e => setForm({ ...form, submitterName: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Your Email *</label>
          <input
            required
            type="email"
            placeholder="dev@example.com"
            value={form.submitterEmail}
            onChange={e => setForm({ ...form, submitterEmail: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Description * (why is this icon needed?)</label>
          <textarea
            required
            rows={3}
            maxLength={500}
            placeholder="This is a popular framework used for..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 resize-none"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Reference URL (official site or logo)</label>
          <input
            type="url"
            placeholder="https://vuejs.org"
            value={form.referenceUrl}
            onChange={e => setForm({ ...form, referenceUrl: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
          />
        </div>

        {status && (
          <div className={`p-3 rounded-lg text-sm ${status.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
            {status.message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>

      {/* Existing requests */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Pending Requests ({existingRequests.length})</h2>
        <div className="space-y-3">
          {existingRequests.map(req => (
            <div key={req._id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-4">
              <button
                onClick={() => handleUpvote(req._id)}
                className="flex flex-col items-center min-w-10 py-2 px-3 rounded-lg border border-zinc-700 hover:border-yellow-400 transition-colors"
              >
                <span className="text-xs">▲</span>
                <span className="text-sm font-semibold">{req.upvotes}</span>
              </button>
              <div className="flex-1">
                <h3 className="font-medium">{req.iconName}</h3>
                <p className="text-zinc-400 text-sm mt-0.5">{req.description}</p>
                {req.referenceUrl && (
                  <a href={req.referenceUrl} target="_blank" rel="noreferrer" className="text-yellow-400 text-xs mt-1 inline-block hover:underline">
                    {req.referenceUrl}
                  </a>
                )}
              </div>
            </div>
          ))}
          {existingRequests.length === 0 && (
            <p className="text-zinc-600 text-sm">No pending requests yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

## ✅ TEST PHASE 8

```
http://localhost:5173/request
- Fill form → submit → success message
- Submit same icon name → auto-upvote message
- Click upvote arrow → enter email → count increases
```

---

# PHASE 9 — Admin Panel
**Goal: Admin login + dashboard to review and update icon requests.**

## Step 9.1 — Create `client/src/pages/AdminLogin.jsx`

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/admin/login', form);
      login(res.data.token);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold mb-6">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" placeholder="Username" required
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
          />
          <input
            type="password" placeholder="Password" required
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full py-2 bg-yellow-400 text-black font-medium rounded-lg hover:bg-yellow-300 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

## Step 9.2 — Create `client/src/pages/AdminDashboard.jsx`

```jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const STATUS_COLORS = {
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-800',
  approved: 'text-green-400 bg-green-400/10 border-green-800',
  rejected: 'text-red-400 bg-red-400/10 border-red-800',
  'in-progress': 'text-blue-400 bg-blue-400/10 border-blue-800',
};

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/requests?status=${filter}`);
      setRequests(res.data.requests);
    } catch {
      logout(); navigate('/admin/login');
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [filter]);

  const updateStatus = async (id, status, adminNote = '') => {
    setUpdating(id);
    try {
      await api.patch(`/admin/requests/${id}`, { status, adminNote });
      await fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed');
    }
    setUpdating(null);
  };

  const handleReject = async (id) => {
    const note = prompt('Rejection reason (optional):') || '';
    updateStatus(id, 'rejected', note);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={() => { logout(); navigate('/admin/login'); }}
          className="text-sm text-zinc-400 hover:text-white border border-zinc-700 px-3 py-1.5 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6">
        {['pending', 'in-progress', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-lg border text-sm capitalize transition-colors ${
              filter === s ? 'bg-yellow-400 text-black border-yellow-400' : 'border-zinc-700 text-zinc-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : requests.length === 0 ? (
        <p className="text-zinc-600">No {filter} requests.</p>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req._id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-lg">{req.iconName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[req.status]}`}>
                      {req.status}
                    </span>
                    <span className="text-zinc-500 text-sm">▲ {req.upvotes} upvotes</span>
                  </div>
                  <p className="text-zinc-400 text-sm">{req.description}</p>
                  {req.referenceUrl && (
                    <a href={req.referenceUrl} target="_blank" rel="noreferrer" className="text-yellow-400 text-xs hover:underline">
                      {req.referenceUrl}
                    </a>
                  )}
                  <p className="text-zinc-600 text-xs mt-2">
                    By {req.submitterName || 'Anonymous'} · {req.submitterEmail} · {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                  {req.adminNote && (
                    <p className="text-zinc-500 text-xs mt-1 italic">Note: {req.adminNote}</p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                {req.status !== 'in-progress' && (
                  <button
                    onClick={() => updateStatus(req._id, 'in-progress')}
                    disabled={updating === req._id}
                    className="px-3 py-1.5 text-xs border border-blue-700 text-blue-400 rounded-lg hover:bg-blue-900/30 disabled:opacity-50"
                  >
                    Mark In Progress
                  </button>
                )}
                {req.status !== 'approved' && (
                  <button
                    onClick={() => updateStatus(req._id, 'approved')}
                    disabled={updating === req._id}
                    className="px-3 py-1.5 text-xs border border-green-700 text-green-400 rounded-lg hover:bg-green-900/30 disabled:opacity-50"
                  >
                    Approve
                  </button>
                )}
                {req.status !== 'rejected' && (
                  <button
                    onClick={() => handleReject(req._id)}
                    disabled={updating === req._id}
                    className="px-3 py-1.5 text-xs border border-red-800 text-red-400 rounded-lg hover:bg-red-900/30 disabled:opacity-50"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## ✅ TEST PHASE 9

```
http://localhost:5173/admin/login
- Login with credentials from Phase 4 setup
- Redirects to /admin dashboard
- See pending requests
- Click Approve / Reject / Mark In Progress → status changes
- Logout → redirects to login
- Try going to /admin without logging in → redirects to /admin/login
```

---

# PHASE 10 — Home Page + Polish
**Goal: A compelling landing page that explains the product.**

## Step 10.1 — Create `client/src/pages/Home.jsx`

```jsx
import { Link } from 'react-router-dom';

const DEMO_ICONS = ['js', 'react', 'nodejs', 'python', 'mongodb', 'html', 'css', 'typescript'];

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4">

      {/* Hero */}
      <div className="text-center py-20">
        <h1 className="text-5xl font-bold mb-4 tracking-tight">
          Skill icons for<br/>
          <span className="text-yellow-400">developers</span>
        </h1>
        <p className="text-zinc-400 text-lg mb-8 max-w-xl mx-auto">
          Showcase your tech skills anywhere — portfolio, README, or client site.
          One URL. No hosting. No CSS.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/playground" className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-xl hover:bg-yellow-300 transition-colors">
            Open Playground
          </Link>
          <Link to="/gallery" className="px-6 py-3 border border-zinc-700 text-white rounded-xl hover:border-zinc-500 transition-colors">
            Browse Icons
          </Link>
        </div>
      </div>

      {/* Live demo strip */}
      <div className="text-center mb-16">
        <p className="text-zinc-500 text-sm mb-4">Live preview — all icons served from a single URL</p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 inline-block">
          <img
            src={`/icons?i=${DEMO_ICONS.join(',')}&theme=dark&width=48&height=48&gap=12`}
            alt="demo icons"
            className="max-w-full"
          />
        </div>
      </div>

      {/* How it works */}
      <div className="mb-16">
        <h2 className="text-xl font-semibold text-center mb-8">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Pick your icons', desc: 'Choose from 50+ tech icons in the playground' },
            { step: '2', title: 'Customize', desc: 'Set theme (light/dark), size, layout, and spacing' },
            { step: '3', title: 'Copy & embed', desc: 'One URL works in HTML img tags, Markdown, and anywhere else' },
          ].map(item => (
            <div key={item.step} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="w-8 h-8 bg-yellow-400 text-black rounded-lg flex items-center justify-center font-bold text-sm mb-3">
                {item.step}
              </div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-zinc-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Code example */}
      <div className="mb-16 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <p className="text-zinc-400 text-sm mb-3">Paste anywhere that accepts an image URL:</p>
        <pre className="text-sm text-yellow-300 font-mono overflow-x-auto">
{`<!-- In HTML -->
<img src="https://skillicons.dev/icons?i=js,react,nodejs&theme=dark" />

<!-- In Markdown (README) -->
![My Skills](https://skillicons.dev/icons?i=js,react,nodejs&theme=dark)`}
        </pre>
      </div>

    </div>
  );
}
```

## ✅ TEST PHASE 10

```
http://localhost:5173
- Hero text displays
- Live icon strip loads and shows all demo icons
- "Open Playground" and "Browse Icons" links work
- Code examples display correctly
```

---

# PHASE 11 — Real Icons Integration
**Goal: Replace placeholder SVGs with real, high-quality tech icons.**

## Step 11.1 — Download real icons

```bash
cd server/src/icons

# Option A: Download from Simple Icons (recommended — free, consistent style)
# Visit https://simpleicons.org/ and download SVGs you need
# Rename each file to match your registry key (e.g. javascript.svg → js.svg)

# Option B: Use devicons
# Visit https://github.com/devicons/devicon/tree/master/icons
# Download the SVG variants you want
```

## Step 11.2 — Adapt real icons to use theme tokens

Real SVGs won't have `{{COLOR_BG}}` and `{{COLOR_PRIMARY}}` tokens.

Tell Cursor: **"Open each SVG in server/src/icons/ and replace hardcoded fill colors with `{{COLOR_BG}}` for background rects and `{{COLOR_PRIMARY}}` for the main icon shapes. Preserve the SVG structure but inject the template tokens."**

Or do it manually for each icon — it takes ~2 minutes per icon and is worth doing properly.

## Step 11.3 — Expand the iconRegistry

Add more entries to `iconRegistry.js` following the existing pattern. For each new icon, add:
- The short key (e.g. `vue`)
- The display name
- The category
- Theme color pairs (look up official brand colors at https://brandcolors.net)

## ✅ TEST PHASE 11

```
http://localhost:5000/icons?i=js&theme=dark&width=64&height=64
# Should show real JS icon, not placeholder text
```

---

# PHASE 12 — Deployment

## Step 12.1 — Deploy backend to Render

1. Push code to GitHub
2. Go to https://render.com → New Web Service → Connect repo
3. Set root directory: `server`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables:
   - `MONGO_URI` — your MongoDB Atlas connection string (get from https://cloud.mongodb.com)
   - `JWT_SECRET` — a long random string
   - `NODE_ENV` — `production`
7. Deploy → copy the URL (e.g. `https://skillicons-api.onrender.com`)

## Step 12.2 — Deploy frontend to Vercel

1. Create `client/.env.production`:
```
VITE_API_URL=https://skillicons-api.onrender.com
```

2. Update `client/vite.config.js` — remove the proxy block (it was only for local dev). The `VITE_API_URL` env var handles production routing.

3. Update `client/src/utils/api.js` — already using `import.meta.env.VITE_API_URL` so no change needed.

4. Go to https://vercel.com → New Project → Import from GitHub → select `client` folder
5. Framework: Vite
6. Add env variable: `VITE_API_URL=https://skillicons-api.onrender.com`
7. Deploy → your site is live!

## Step 12.3 — Post-deployment setup

```
# Create your admin account on the live server
POST https://skillicons-api.onrender.com/admin/setup
Body: { "username": "admin", "password": "your_secure_password" }

# Then disable the /admin/setup route in adminRoutes.js and redeploy
# to prevent anyone else from creating an admin account
```

## ✅ FINAL TEST

```
https://your-vercel-url.vercel.app
- Homepage loads
- Icons serve from live API
- Playground works
- Gallery works
- Request form submits to live DB
- Admin login works
- Admin dashboard shows real requests
```

---

# Summary: What You're Building

| Feature | Endpoint / Page | Status |
|---------|----------------|--------|
| Single icon URL | GET /icons?i=js | Phase 2 |
| Batch icons | GET /icons?i=js,react,node | Phase 2 |
| Theme + size | &theme=dark&width=64 | Phase 2 |
| Grid layout | &layout=grid | Phase 2 |
| Icon list API | GET /icons/list | Phase 2 |
| Request submission | POST /request | Phase 3 |
| Upvoting | POST /request/:id/upvote | Phase 3 |
| Gallery API | GET /gallery | Phase 4 |
| Admin auth | POST /admin/login | Phase 4 |
| Interactive playground | /playground | Phase 6 |
| Public gallery | /gallery | Phase 7 |
| Request form UI | /request | Phase 8 |
| Admin dashboard | /admin | Phase 9 |
| Landing page | / | Phase 10 |
| Real icons | All endpoints | Phase 11 |
| Live deployment | Render + Vercel | Phase 12 |

---

> Built with: React + Vite + TailwindCSS + Express + MongoDB + JWT
> Portfolio value: Full-stack MERN · SVG generation · REST API · Auth · Community features · Live deployment
