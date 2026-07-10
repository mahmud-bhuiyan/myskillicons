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

- **Node.js 18+** ([nvm-windows](https://github.com/coreybutler/nvm-windows) or [nodejs.org](https://nodejs.org/))
- **MongoDB** running locally, or a [MongoDB Atlas](https://www.mongodb.com/atlas) connection string

Check your Node version:

```bash
node -v   # should be v18 or higher
```

---

## Getting Started

Follow these steps in order from the repo root.

### 1. Clone the repo

```bash
git clone https://github.com/mahmud-bhuiyan/myskillicons.git
cd myskillicons
```

### 2. Install dependencies

Install packages in **server** and **client** (each has its own `node_modules`):

```bash
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 3. Environment variables

**Server (required)** — copy the example file and edit if needed:

```bash
cp server/.env.example server/.env.local
```

`server/.env.local` should look like:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/skillicons
ADMIN_JWT_SECRET=your-secret-here
```

| Variable | Notes |
|----------|--------|
| `PORT` | API port (default `5000`) |
| `MONGO_URI` | Local MongoDB, or your Atlas URI |
| `ADMIN_JWT_SECRET` | Any long random string for admin auth |

**Client (optional)** — Vite already proxies `/api` and `/icons` in development:

```bash
cp client/.env.example client/.env
```

```env
VITE_API_URL=/api/v1
```

### 4. Start MongoDB

Make sure MongoDB is running before starting the API.

- **Local:** start the MongoDB service / `mongod`
- **Atlas:** put your connection string in `server/.env.local` as `MONGO_URI`

### 5. Run the app

Use two terminals — one for the API, one for the frontend:

```bash
# Terminal 1 — API
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

You should see something like:

```
Server running on port 5000
➜  Local:   http://localhost:5173/
```

Default icons are seeded automatically on first server start.

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:5000 |
| Health check | http://localhost:5000/health |

### 6. Quick check

Open http://localhost:5173, or hit the icon API:

```bash
curl "http://localhost:5000/icons?i=js,react,nodejs&theme=dark"
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `'nodemon' is not recognized` / `'vite' is not recognized` | Run `npm install` inside `server/` and `client/` respectively. |
| MongoDB connection errors | Start local MongoDB, or set a valid `MONGO_URI` in `server/.env.local`. |
| Port already in use | Change `PORT` in `server/.env.local`, or stop the process using 5000 / 5173. |
| Frontend can't reach API | Confirm the server is on port 5000 and you're using the Vite proxy (`VITE_API_URL=/api/v1`). |

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

**Server** (`cd server`)

| Command | Description |
|---------|-------------|
| `npm install` | Install server dependencies |
| `npm run dev` | Start with nodemon |
| `npm start` | Start production server |
| `npm run seed` | Seed default icons into MongoDB |

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

Default icons are defined in `server/src/utils/iconSeedData.js` — each entry includes key, name, category, theme colors, tags, and full SVG markup (with `{{WIDTH}}`, `{{HEIGHT}}`, `{{COLOR_BG}}`, `{{COLOR_PRIMARY}}` placeholders). No SVG files are kept on disk.

### Behavior

- Inserts an icon only if its **key does not already exist** in MongoDB
- Never overwrites or updates existing icons
- Runs automatically when the server starts
- Can also be run manually against local or live databases

### Seed locally

Make sure `server/.env.local` points at your local DB, then:

```bash
cd server
npm run seed
```

### Seed a live / production database

1. Set `MONGO_URI` in `server/.env.local` to your live MongoDB Atlas (or production) URI.
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
