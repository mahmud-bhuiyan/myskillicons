# MyIconix

Serve icons as SVG via URL — with themes, sizing, batch layouts, a gallery, community requests, and an admin panel.

Embed icons in READMEs, portfolios, and docs with a single image URL.

```html
<img src="http://localhost:5000/icons?i=js,react,nodejs&theme=dark" />
```

```md
![My Skills](http://localhost:5000/icons?i=js,react,nodejs&theme=dark)
```

This repo is **two packages** (`client/` and `server/`) — there is no root `package.json`.

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
| Hosting | Dual Vercel projects (SPA + serverless API) |

---

## Features

- **Icon API** — single or batch SVGs with theme, size, layout, and gap
- **Playground** — pick icons and generate embed URLs
- **Gallery** — browse ~236 icons by category
- **Request icons** — submit and upvote community requests (rate-limited)
- **Admin panel** — JWT-protected icons CRUD, category order, requests, and profile/avatar

### Built-in icons

About **236** seeded icons (skill-icons based). Browse them in the [Gallery](http://localhost:5173/gallery) or list keys via `GET /icons/list`.

---

## Project Structure

```
myskillicons/
├── client/                 # React + Vite SPA
│   ├── src/
│   │   ├── components/     # Navbar, Footer, ColorField, shared UI
│   │   ├── pages/          # Home, Gallery, Playground, Request, Admin*
│   │   ├── context/        # Auth, Theme, Icons, Requests, AdminData
│   │   ├── hooks/          # useGalleryIcons, useDebouncedValue
│   │   └── utils/          # API client, serverUrl, color, formClasses
│   ├── vercel.json
│   └── .env.example
├── server/                 # Express API
│   ├── api/index.js        # Vercel serverless entry
│   ├── src/
│   │   ├── config/         # MongoDB connection
│   │   ├── controllers/
│   │   ├── middleware/     # Auth, rate limit
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/          # SVG processor, icon seed data, store
│   ├── vercel.json
│   └── .env.example
├── docs/                   # Project plans / notes
└── README.md
```

---

## Prerequisites

- **Node.js 18+** ([nvm-windows](https://github.com/coreybutler/nvm-windows) or [nodejs.org](https://nodejs.org/))
- **MongoDB** running locally, or a [MongoDB Atlas](https://www.mongodb.com/atlas) connection string

```bash
node -v   # should be v18 or higher
```

---

## Getting Started

Follow these steps from the repo root.

### 1. Clone the repo

```bash
git clone https://github.com/mahmud-bhuiyan/myskillicons.git
cd myskillicons
```

### 2. Install dependencies

```bash
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 3. Environment variables

**Server (required):**

```bash
cp server/.env.example server/.env
```

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/skillicons
ADMIN_JWT_SECRET=your-secret-here
```

| Variable | Notes |
|----------|--------|
| `PORT` | API port (default `5000`) |
| `MONGO_URI` | Local MongoDB, or your Atlas URI |
| `ADMIN_JWT_SECRET` | Long random string for admin JWT + first setup |

**Client:**

```bash
cp client/.env.example client/.env
```

```env
VITE_API_URL=http://localhost:5000/api/v1
```

In development, Vite also proxies `/api`, `/icons`, and `/uploads` to port 5000, so a relative `VITE_API_URL=/api/v1` works too.

### 4. Start MongoDB

- **Local:** start the MongoDB service / `mongod`
- **Atlas:** set `MONGO_URI` in `server/.env`

### 5. Run the app

```bash
# Terminal 1 — API
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:5000 |
| Health check | http://localhost:5000/health |

Icons are synced from seed data automatically when the server starts.

### 6. Quick check

```bash
curl "http://localhost:5000/icons?i=js,react,nodejs&theme=dark"
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `'nodemon'` / `'vite' is not recognized` | Run `npm install` inside `server/` and `client/` respectively. |
| MongoDB connection errors | Start local MongoDB, or set a valid `MONGO_URI`. |
| Port already in use | Change `PORT` in `server/.env`, or free 5000 / 5173. |
| Frontend can't reach API | Confirm the server is on 5000; use `VITE_API_URL` from `.env.example` or the Vite proxy. |

---

## Icon API (public)

Base path: `/icons` (no `/api/v1` prefix)

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
| `theme` | `light` | `light`, `dark`, or `auto` |
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
| `POST` | `/request` | Submit an icon request (rate-limited) |
| `GET` | `/request` | List requests |
| `POST` | `/request/:id/upvote` | Upvote a request (rate-limited: 5 / 10 min per IP) |
| `POST` | `/admin/setup` | Create first admin (`Authorization: Bearer <ADMIN_JWT_SECRET>`) |
| `POST` | `/admin/login` | Admin login (JWT) |
| `GET` | `/admin/me` | Current admin (auth) |
| `PATCH` | `/admin/profile` | Update display name (auth) |
| `PATCH` | `/admin/avatar` | Upload avatar (auth, multipart) |
| `DELETE` | `/admin/avatar` | Remove avatar (auth) |
| `PATCH` | `/admin/password` | Change password (auth) |
| `GET` | `/admin/icons` | List icons (auth) |
| `GET` | `/admin/icons/details` | Icon details list (auth) |
| `GET` | `/admin/icons/:key` | Get one icon (auth) |
| `POST` | `/admin/icons` | Create icon (auth, multipart or JSON) |
| `PUT` | `/admin/icons/:key` | Update icon (auth) |
| `DELETE` | `/admin/icons/:key` | Delete icon (auth) |
| `GET` | `/admin/categories` | List categories (auth) |
| `PUT` | `/admin/categories/order` | Save category order (auth) |
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
| `/admin` | Admin dashboard (protected; tabs via `?tab=`) |
| `/admin/details` | Admin profile (protected) |

---

## Scripts

**Server** (`cd server`)

| Command | Description |
|---------|-------------|
| `npm install` | Install server dependencies |
| `npm run dev` | Start with nodemon |
| `npm start` | Start production server |
| `npm run seed` | Sync seed icons into MongoDB |
| `npm run sync-categories` | Rebuild categories from icons |

**Client** (`cd client`)

| Command | Description |
|---------|-------------|
| `npm install` | Install client dependencies |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run oxlint |

---

## Seeding Icons

Defaults live in `server/src/utils/iconSeedData.js` — key, name, category, theme colors, tags, and SVG markup with `{{WIDTH}}`, `{{HEIGHT}}`, `{{COLOR_BG}}`, `{{COLOR_PRIMARY}}` placeholders.

### Behavior

- **Creates** missing seed icons
- **Updates** name, category, tags, and `svgContent` when seed data changes
- **Preserves** theme colors on existing icons (admin color edits stay)
- Runs on server start and via `npm run seed`

### Seed locally

```bash
cd server
npm run seed
```

### Seed a live / production database

1. Set `MONGO_URI` in `server/.env` to your production URI.
2. Run `npm run seed`.

```
Seeded N icon(s) into MongoDB
Updated N icon(s) from seed data
Icon store ready: N icon(s)
```

### After seeding

Manage icons from `/admin` — upload, edit, or delete without redeploying. Append entries to `iconSeedData.js` for future environments.

---

## Adding Icons

**Admin panel (recommended)**

1. Log in at `/admin/login`.
2. Open **Icons** → **Upload icon**.
3. Set key, name, category, theme colors, and upload/paste an SVG that uses placeholders:
   - `{{WIDTH}}`, `{{HEIGHT}}`, `{{COLOR_BG}}`, `{{COLOR_PRIMARY}}`
4. Embed with `/icons?i=your-key&theme=dark&width=48`.

---

## Deploy (Vercel)

The app is meant to run as **two** Vercel projects:

1. **Client** — root directory `client/`; set `VITE_API_URL` to your API’s public `/api/v1` URL; SPA rewrites via `client/vercel.json`.
2. **Server** — root directory `server/`; set `MONGO_URI` and `ADMIN_JWT_SECRET`; entry is `server/api/index.js`.

Do not commit real secrets. Use Vercel project env vars for production.

---

## License

ISC
