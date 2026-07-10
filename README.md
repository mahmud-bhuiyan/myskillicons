# SkillIcons

Serve skill icons as SVG via URL — with themes, sizing, batch layouts, a gallery, community requests, and an admin panel.

Embed icons in READMEs, portfolios, and docs with a single image URL.

```html
<img src="http://localhost:5000/icons?i=js,react,nodejs&theme=dark" />
```

```md
![My Skills](http://localhost:5000/icons?i=js,react,nodejs&theme=dark)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + Tailwind CSS 4 |
| Backend | Node.js + Express 5 |
| Database | MongoDB + Mongoose |
| Cache | node-cache (in-memory) |
| Auth | JWT + bcrypt |
| Icons | SVG templates served as `image/svg+xml` |

---

## Features

- **Icon API** — single or batch SVGs with theme, size, layout, and gap
- **Playground** — pick icons and generate embed URLs
- **Gallery** — browse icons by category
- **Request icons** — submit and upvote community requests
- **Admin panel** — JWT-protected dashboard to manage requests

### Built-in icons

`js` · `react` · `nodejs` · `python` · `mongodb` · `html` · `css` · `typescript` · `vue` · `docker` · `git` · `github` · `express` · `nextjs` · `tailwind` · `postgresql` · `redis`

---

## Project Structure

```
myskillicons/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Navbar, AdminRoute
│   │   ├── pages/          # Home, Playground, Gallery, Request, Admin
│   │   ├── context/        # AuthContext
│   │   └── utils/          # API client
│   └── .env.example
├── server/                 # Express API
│   ├── src/
│   │   ├── config/         # MongoDB connection
│   │   ├── controllers/
│   │   ├── middleware/     # Auth
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/          # SVG processor, icon seed data
│   └── .env.example
└── skillicons-project-plan.md
```

---

## Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd myskillicons

cd server && npm install
cd ../client && npm install
```

### 2. Environment variables

**Server** — copy `server/.env.example` to `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/skillicons
JWT_SECRET=your-secret-here
NODE_ENV=development
```

**Client** — copy `client/.env.example` to `client/.env` (optional; Vite proxies `/api` and `/icons` in dev):

```env
VITE_API_URL=/api/v1
```

### 3. Run locally

Terminal 1 — API:

```bash
cd server
npm run dev
```

Terminal 2 — frontend:

```bash
cd client
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:5000 |
| Health check | http://localhost:5000/health |

---

## Icon API (public)

Short public path — no `/api/v1` prefix:

Base path: `/icons`

### Single icon

```
GET /icons?i=js&theme=dark&width=64&height=64
```

### Batch icons

```
GET /icons?i=js,react,nodejs&theme=dark&layout=row&gap=8
GET /icons?i=js,react,nodejs,python&theme=dark&layout=grid
```

### List all icons

```
GET /icons/list
```

### Query parameters

| Param | Default | Description |
|-------|---------|-------------|
| `i` | — | **Required.** Icon key, or comma-separated list (max 20) |
| `theme` | `dark` | `light`, `dark`, or `auto` |
| `width` / `w` | `48` | Size in px (16–256) |
| `height` / `h` | `48` | Size in px (16–256) |
| `layout` | `row` | `row` or `grid` (batch only) |
| `gap` | `8` | Space between icons in batch |

Responses are `image/svg+xml` with `Cache-Control: public, max-age=86400`.

---

## Other API Endpoints

All under `/api/v1` unless noted.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check (unversioned) |
| `GET` | `/gallery` | Gallery icons |
| `GET` | `/gallery/categories` | Icon categories |
| `POST` | `/request` | Submit an icon request |
| `GET` | `/request` | List requests |
| `POST` | `/request/:id/upvote` | Upvote a request |
| `POST` | `/admin/setup` | Create first admin |
| `POST` | `/admin/login` | Admin login (JWT) |
| `GET` | `/admin/me` | Current admin (auth) |
| `PATCH` | `/admin/password` | Change password (auth) |
| `GET` | `/admin/icons` | List icons in DB (auth) |
| `POST` | `/admin/icons` | Upload/create SVG icon (auth, multipart or JSON) |
| `PUT` | `/admin/icons/:key` | Update icon (auth) |
| `DELETE` | `/admin/icons/:key` | Delete icon (auth) |
| `GET` | `/admin/requests` | All requests (auth) |
| `PATCH` | `/admin/requests/:id` | Update request status (auth) |

---

## Frontend Routes

| Path | Page |
|------|------|
| `/` | Home |
| `/playground` | Icon playground / URL builder |
| `/gallery` | Public gallery |
| `/request` | Request an icon |
| `/admin/login` | Admin login |
| `/admin` | Admin dashboard (protected) |

---

## Scripts

**Root**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server + client together |
| `npm run seed` | Seed default icons into MongoDB |
| `npm run build` | Build the client |

**Server**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon |
| `npm start` | Start production server |
| `npm run seed` | Seed default icons into MongoDB |

**Client**

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run oxlint |

---

## Seeding Icons

Default icons are defined in `server/src/utils/iconSeedData.js` — each entry includes key, name, category, theme colors, tags, and full SVG markup (with `{{WIDTH}}`, `{{HEIGHT}}`, `{{COLOR_BG}}`, `{{COLOR_PRIMARY}}` placeholders). No SVG files are kept on disk.

### Behavior

- Inserts an icon only if its **key does not already exist** in MongoDB
- Never overwrites or updates existing icons
- Runs automatically when the server starts
- Can also be run manually against local or live databases

### Seed locally

Make sure `server/.env` points at your local DB, then:

```bash
# from repo root
npm run seed

# or from server/
cd server
npm run seed
```

### Seed a live / production database

1. Set `MONGO_URI` in `server/.env` to your live MongoDB Atlas (or production) URI.
2. Run the seed command:

```bash
cd server
npm run seed
```

3. You should see logs like:

```
Seeded N icon(s) into MongoDB
Icon store ready: N icon(s)
```

If icons were already seeded, only the store-ready line appears (0 new inserts).

### After seeding

Manage icons from the admin panel (`/admin`) — upload, edit, or delete without redeploying. To add more defaults for future environments, append entries to `iconSeedData.js`.

---

## Adding Icons

Icons are stored in **MongoDB** (`svgContent`) and served via `/icons?...`.

**Admin panel (recommended)**

1. Log in at `/admin/login`.
2. Open **Icons** → **Upload icon**.
3. Set key, name, category, theme colors, and upload/paste an SVG that uses placeholders:
   - `{{WIDTH}}`, `{{HEIGHT}}`, `{{COLOR_BG}}`, `{{COLOR_PRIMARY}}`
4. Users embed with `/icons?i=your-key&theme=dark&width=48`.

---

## License

ISC
