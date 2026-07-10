# SkillIcons

Serve skill icons as SVG via URL — with themes, sizing, batch layouts, a gallery, community requests, and an admin panel.

Embed icons in READMEs, portfolios, and docs with a single image URL.

```html
<img src="http://localhost:5000/api/v1/icons?i=js,react,nodejs&theme=dark" />
```

```md
![My Skills](http://localhost:5000/api/v1/icons?i=js,react,nodejs&theme=dark)
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

`js` · `react` · `nodejs` · `python` · `mongodb` · `html` · `css` · `typescript`

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
│   │   ├── icons/          # SVG source files
│   │   └── utils/          # SVG processor, icon registry
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

**Client** — copy `client/.env.example` to `client/.env` (optional; Vite proxies `/api` in dev):

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

## Icon API

Base path: `/api/v1/icons`

### Single icon

```
GET /api/v1/icons?i=js&theme=dark&width=64&height=64
```

### Batch icons

```
GET /api/v1/icons?i=js,react,nodejs&theme=dark&layout=row&gap=8
GET /api/v1/icons?i=js,react,nodejs,python&theme=dark&layout=grid
```

### List all icons

```
GET /api/v1/icons/list
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

**Server**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon |
| `npm start` | Start production server |

**Client**

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run oxlint |

---

## Adding Icons

1. Add an SVG under `server/src/icons/` using `{{COLOR_BG}}` and `{{COLOR_PRIMARY}}` placeholders.
2. Register it in `server/src/utils/iconRegistry.js` with name, file, category, and theme colors.

---

## License

ISC
