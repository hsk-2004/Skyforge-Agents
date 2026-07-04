# Skyforge Agents

A freight-agent directory app: search a global network of logistics agents by country, company, service, or network, and browse them in a rich, filterable results table.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-61dafb) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8) ![Prisma](https://img.shields.io/badge/Prisma-6-2d3748) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)

## Features

- **Landing dashboard** — search bar with live country suggestions, "Get started" onboarding cards, shortlist coverage stats, and a recent-activity feed
- **Results table** — searchable, filterable (country / service / network), sortable, with drag-resizable columns
- **Filters & toggles** — "Shortlist Only" (hides credit-stop agents) and "Consider Coverage"
- **Spreadsheet import** — seed the database from Excel files (base agents + AON network members/affiliates)

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Backend  | Next.js API routes on Node.js |
| Database | PostgreSQL 16 (runs in Docker), Prisma ORM |
| Seeding  | Node/TypeScript script reading `.xlsx` via SheetJS |

## Project structure

```
src/
├── app/                    # Next.js routing layer (thin wrappers only)
│   ├── page.tsx            # Route "/"        → LandingPage
│   ├── results/page.tsx    # Route "/results" → ResultPage
│   ├── api/agents/route.ts # Endpoint GET /api/agents
│   └── layout.tsx          # Root layout (fonts, sidebar, global styles)
├── frontend/               # All UI code
│   ├── LandingPage.tsx     # Home dashboard
│   ├── ResultPage.tsx      # Agent results table
│   ├── Sidebar.tsx         # Navigation rail
│   ├── GetStartedCard.tsx  # Onboarding card
│   └── agentUi.tsx         # Shared types, helpers, and SVG icons
├── backend/                # All server-side logic
│   ├── agentsService.ts    # Agent queries + filter building (Prisma)
│   └── db.ts               # Shared Prisma client
prisma/
├── schema.prisma           # Agent data model
└── seed.ts                 # Excel → database import script
docker-compose.yml          # PostgreSQL container
```

## Getting started

### Prerequisites

- Node.js 20+
- Docker Desktop

### 1. Install dependencies

```bash
npm install
```

### 2. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL 16 in a container (`skyforge_postgres`) on port 5432 with a persistent volume.

### 3. Configure environment

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:localpassword123@localhost:5432/skyforge_db"
```

### 4. Create the schema and seed data

```bash
npx prisma migrate dev     # create tables
npx prisma db seed         # import agents from spreadsheets
```

The seed script looks for these files in the project root (each is optional):

- `agents.xlsx` or `agents.csv` — base agent list
- `AON.xlsx` — AON network members and affiliates

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API

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

## Scripts

| Command             | Description |
|---------------------|-------------|
| `npm run dev`       | Start the dev server |
| `npm run build`     | Production build |
| `npm run start`     | Serve the production build |
| `npm run lint`      | Run ESLint |
| `npx prisma studio` | Browse the database in a GUI |
| `npx prisma db seed`| Re-import agents from spreadsheets |
