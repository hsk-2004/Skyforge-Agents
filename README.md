# Skyforge Agents

A freight-agent directory app: search a global network of 15,000+ logistics agents by country, company, service, or network, and browse them in a rich, filterable results table. Includes email/password authentication — all pages are protected behind login.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-61dafb) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8) ![Prisma](https://img.shields.io/badge/Prisma-6-2d3748) ![Turso](https://img.shields.io/badge/Turso-libSQL-4ff8d2)

## Features

- **Authentication** — email/password login and registration (Auth.js v5, bcrypt-hashed passwords); middleware redirects unauthenticated visitors to `/login`
- **Landing dashboard** — search bar with live country suggestions, "Get started" onboarding cards, shortlist coverage stats, and a recent-activity feed
- **Results table** — searchable, filterable (country / service / network), sortable, with drag-resizable columns
- **Filters & toggles** — "Shortlist Only" (hides credit-stop agents) and "Consider Coverage"
- **Spreadsheet import** — seed the database from Excel files (base agents, AON network, scraped directory)
- **Responsive** — sidebar becomes a bottom navigation bar on mobile; all pages adapt to phone/tablet widths

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4, Framer Motion |
| Backend  | Next.js API routes on Node.js, Auth.js v5 |
| Database | [Turso](https://turso.tech) (hosted libSQL/SQLite), Prisma ORM via `@prisma/adapter-libsql` |
| Seeding  | Node/TypeScript script reading `.xlsx` via SheetJS |

## Project structure

```
src/
├── app/                    # Next.js routing layer (thin wrappers only)
│   ├── page.tsx            # Route "/"         → LandingPage
│   ├── results/page.tsx    # Route "/results"  → ResultPage
│   ├── login/page.tsx      # Route "/login"    → LoginPage
│   ├── register/page.tsx   # Route "/register" → RegisterPage
│   ├── api/agents/route.ts # Endpoint GET /api/agents
│   ├── api/register/       # Endpoint POST /api/register
│   ├── api/auth/           # Auth.js endpoints (login/logout/session)
│   └── layout.tsx          # Root layout (fonts, sidebar, global styles)
├── frontend/               # All UI code
│   ├── LandingPage.tsx     # Home dashboard
│   ├── ResultPage.tsx      # Agent results table
│   ├── LoginPage.tsx       # Sign-in screen
│   ├── RegisterPage.tsx    # Sign-up screen
│   ├── Sidebar.tsx         # Navigation rail (bottom bar on mobile)
│   ├── GetStartedCard.tsx  # Onboarding card
│   └── agentUi.tsx         # Shared types, helpers, and SVG icons
├── backend/                # All server-side logic
│   ├── agentsService.ts    # Agent queries + filter building (Prisma)
│   ├── usersService.ts     # User registration
│   ├── auth.ts             # Auth.js setup (credentials provider)
│   └── db.ts               # Shared Prisma client (Turso libSQL adapter)
├── proxy.ts                # Route-protection middleware
prisma/
├── schema.prisma           # User + Agent data models (sqlite provider)
└── seed.ts                 # Excel → database import script
```

## Getting started

### Prerequisites

- Node.js 20+
- A free [Turso](https://turso.tech) database (create one in the dashboard, then generate a read-write token)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
# Placeholder for the Prisma CLI (the app connects via the Turso vars below)
DATABASE_URL="file:./prisma/local.db"

# Turso connection
TURSO_DATABASE_URL="libsql://<your-db>.turso.io"
TURSO_AUTH_TOKEN="<your-token>"

# Auth.js session signing secret (generate with: npx auth secret)
AUTH_SECRET="<random-secret>"
```

### 3. Create the schema and seed data

```bash
# Generate the table-creation SQL and apply it to Turso (one-time),
# e.g. via the Turso dashboard SQL console or CLI:
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script

# Import agents from spreadsheets in the project root
npx prisma db seed
```

The seed script looks for these files in the project root (each is optional):

- `agents.xlsx` or `agents.csv` — base agent list
- `AON.xlsx` — AON network members and affiliates
- `mapper-scraped.xlsx` — scraped agent directory (deduped by company + country)

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register an account, and sign in.

## Deployment (Vercel)

1. Push the repo to GitHub and import it into [Vercel](https://vercel.com) (Next.js is auto-detected).
2. Add these environment variables in the Vercel project settings:
   `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET`, and `DATABASE_URL` (`file:./prisma/local.db`).
3. Deploy — the app talks to Turso directly, no separate database host needed.

## API

All API routes except `/api/auth` and `/api/register` require an authenticated session.

### `GET /api/agents`

Returns agents plus the distinct country/network lists used by the filter dropdowns.

| Query param | Description |
|-------------|-------------|
| `search`    | Matches company, city, or country (case-insensitive) |
| `country`   | Exact country filter |
| `network`   | Network membership filter |
| `service`   | Service filter |

Response:

```json
{ "success": true, "agents": [...], "countries": [...], "networks": [...] }
```

### `POST /api/register`

Creates a user account. Body: `{ "name", "email", "password" }` (password min 8 chars).

## Scripts

| Command             | Description |
|---------------------|-------------|
| `npm run dev`       | Start the dev server |
| `npm run build`     | Production build |
| `npm run start`     | Serve the production build |
| `npm run lint`      | Run ESLint |
| `npx prisma studio` | Browse the database in a GUI |
| `npx prisma db seed`| Re-import agents from spreadsheets |
