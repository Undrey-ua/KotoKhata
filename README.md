# KotoXata

Платформа для притулків тварин. Допомагає тваринам знайти дім, фінансових опікунів та людей, які будуть емоційно з ними пов'язані.

> Людина повинна доглядати за тваринами, а не працювати з CRM.

---

## Status

**Phase 0 — In progress** 🚧 App skeleton running locally

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in Supabase credentials
cp .env.example .env

# 3. Run migrations (requires Supabase DB)
npm run db:migrate

# 4. Seed Котохата shelter + 5 cats
npm run db:seed

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000/uk](http://localhost:3000/uk) — redirects from `/` to default locale.

### Key URLs (local)

| URL | Description |
|-----|-------------|
| `/uk` | Landing (UA) |
| `/en` | Landing (EN) |
| `/uk/s/kotoxata` | Shelter page |
| `/uk/s/kotoxata/cats` | Cat catalog |
| `/api/health` | Health check |

---

## Approved Decisions

| # | Topic | Decision |
|---|-------|----------|
| 1 | Payments MVP | Manual bank transfer + admin confirmation |
| 2 | First shelter | **Котохата** (`kotoxata`) |
| 3 | Domain | `petshelter.app` |
| 4 | Telegram | One platform bot pair |
| 5 | Languages | Ukrainian + English |

Details: [docs/00-decisions.md](./docs/00-decisions.md)

---

## Documentation

| # | Document | Description |
|---|----------|-------------|
| 0 | [Decisions](./docs/00-decisions.md) | Approved product & tech decisions |
| 1 | [Architecture](./docs/01-architecture.md) | System overview, deployment, event flow |
| 2 | [Project Structure](./docs/02-project-structure.md) | Folder layout, layer responsibilities |
| 3 | [ER Diagram](./docs/03-er-diagram.md) | Entity relationships, status state machine |
| 4 | [API Structure](./docs/04-api-structure.md) | REST endpoints, Server Actions, webhooks |
| 5 | [Roles & Permissions](./docs/05-roles-permissions.md) | RBAC matrix, data isolation |
| 6 | [Telegram Architecture](./docs/06-telegram-architecture.md) | Two bots, FSM flows, UX screens |
| 7 | [AI Module](./docs/07-ai-module.md) | Generation pipeline, safety, personalities |
| 8 | [Supabase & Railway](./docs/08-supabase-railway.md) | Infrastructure setup, env vars, deploy |
| 9 | [Scaling Plan](./docs/09-scaling-plan.md) | Growth stages, caching, cost projections |
| 10 | [Roadmap](./docs/10-roadmap.md) | MVP → V2 → SaaS timeline |

## Prisma Schema

Draft schema: [`prisma/schema.prisma`](./prisma/schema.prisma)

---

## Three Equal Clients

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Website    │  │     CRM      │  │   Telegram   │
│   (public)   │  │  (big screen)│  │  (mobile #1) │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ▼
              Single PostgreSQL Database
              (one input → all channels)
```

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, TailwindCSS, shadcn/ui
- **Backend:** Next.js Route Handlers, Server Actions
- **Database:** Supabase PostgreSQL + Prisma ORM
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **AI:** OpenAI (gpt-4o-mini)
- **Bots:** Telegram Bot API (grammy)
- **Deploy:** Railway

## Core Principles

1. **Telegram First** — 80% of daily actions happen in Telegram
2. **Single Source of Truth** — enter data once, appears everywhere
3. **AI Never Autonomous** — AI drafts, human confirms
4. **Mobile First** — every action < 30 seconds from phone
5. **Multi-Tenant** — unlimited shelters, `shelterId` on every table

## Next Steps

1. ~~Review architecture~~ ✅
2. ~~Approve decisions~~ ✅
3. **Begin Phase 0** — Next.js init, Supabase, Railway deploy

---

## License

Private — all rights reserved.
