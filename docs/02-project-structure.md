# KotoXata — Project Structure

Monorepo-style single Next.js application with clear domain boundaries.

```
kotoxata/
├── .env.example
├── .github/
│   └── workflows/
│       ├── ci.yml                    # lint, typecheck, prisma validate
│       └── deploy-railway.yml
├── docs/                             # Architecture & specs (this folder)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                       # Котохата shelter + demo cats
├── public/
│   ├── favicon.ico
│   └── images/                       # static marketing assets
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── [locale]/                 # i18n: uk (default), en
│   │   │   ├── (public)/             # Public website route group
│   │   │   │   ├── layout.tsx        # warm, photo-forward layout
│   │   │   │   ├── page.tsx          # landing
│   │   │   │   └── s/
│   │   │   │       └── [shelterSlug]/
│   │   │   │           ├── page.tsx  # shelter home (Котохата)
│   │   │   │           ├── cats/
│   │   │   │           │   ├── page.tsx
│   │   │   │           │   └── [slug]/
│   │   │   │           │       └── page.tsx
│   │   │   │           ├── adopt/
│   │   │   │           ├── sponsor/  # → manual payment instructions
│   │   │   │           └── donate/
│   │   │   │
│   │   │   ├── (crm)/                # CRM route group (auth required)
│   │   │   │   └── crm/
│   │   │   │       └── [shelterSlug]/
│   │   │   │           ├── payments/ # pending manual transfers
│   │   │   │           └── ...
│   │   │   │
│   │   │   └── (auth)/
│   │   │
│   │   ├── api/                      # Route Handlers (locale-agnostic)
│   │   │   ├── v1/
│   │   │   │   ├── shelters/
│   │   │   │   ├── animals/
│   │   │   │   ├── life-stories/
│   │   │   │   ├── media/
│   │   │   │   ├── sponsorships/
│   │   │   │   ├── applications/
│   │   │   │   ├── donations/
│   │   │   │   └── ai/
│   │   │   ├── webhooks/
│   │   │   │   ├── telegram/
│   │   │   │   │   ├── sponsor/
│   │   │   │   │   └── volunteer/
│   │   │   │   └── stripe/           # Phase 2
│   │   │   └── revalidate/           # on-demand ISR
│   │   │
│   │   ├── layout.tsx                # root layout
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives
│   │   ├── public/                   # catalog cards, hero, animal profile
│   │   ├── crm/                      # CRM-specific (minimal tables!)
│   │   └── shared/                   # Avatar, StatusBadge, PhotoGallery
│   │
│   ├── i18n/
│   │   ├── config.ts                 # locales: uk, en
│   │   ├── request.ts                # next-intl server config
│   │   └── messages/
│   │       ├── uk.json
│   │       └── en.json
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── prisma.ts             # singleton client
│   │   │   └── tenant.ts             # shelter context middleware
│   │   ├── auth/
│   │   │   ├── supabase-server.ts
│   │   │   ├── supabase-client.ts
│   │   │   └── permissions.ts        # RBAC helpers
│   │   ├── storage/
│   │   │   └── supabase-storage.ts
│   │   ├── telegram/
│   │   │   ├── client.ts             # Bot API wrapper
│   │   │   ├── sponsor/              # Sponsor bot handlers
│   │   │   │   ├── bot.ts
│   │   │   │   ├── commands/
│   │   │   │   ├── keyboards/
│   │   │   │   └── scenes/           # conversation FSM
│   │   │   └── volunteer/            # Volunteer bot handlers
│   │   │       ├── bot.ts
│   │   │       ├── commands/
│   │   │       ├── keyboards/
│   │   │       └── scenes/
│   │   ├── ai/
│   │   │   ├── client.ts
│   │   │   ├── generate-story.ts
│   │   │   ├── analyze-photo.ts
│   │   │   └── prompts/              # personality templates
│   │   ├── events/
│   │   │   ├── bus.ts
│   │   │   └── handlers/             # notify-sponsors, revalidate, etc.
│   │   └── utils/
│   │       ├── slug.ts
│   │       └── format.ts
│   │
│   ├── services/                     # Domain logic (pure business rules)
│   │   ├── shelter.service.ts
│   │   ├── animal.service.ts
│   │   ├── life-story.service.ts
│   │   ├── media.service.ts
│   │   ├── sponsorship.service.ts
│   │   ├── adoption.service.ts
│   │   ├── donation.service.ts
│   │   ├── medical.service.ts
│   │   └── notification.service.ts
│   │
│   ├── actions/                      # Server Actions (CRM mutations)
│   │   ├── animals.ts
│   │   ├── life-stories.ts
│   │   ├── media.ts
│   │   └── sponsorships.ts
│   │
│   └── types/
│       ├── api.ts                    # request/response types
│       └── telegram.ts               # bot-specific types
│
├── scripts/
│   ├── setup-telegram-webhooks.ts
│   └── migrate-tenant.ts
│
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── railway.toml
```

---

## Layer Responsibilities

| Layer | Responsibility | Rules |
|-------|---------------|-------|
| `app/` | Routing, layouts, page composition | No business logic |
| `components/` | UI rendering | Receive data via props; no direct DB |
| `actions/` | CRM mutations from forms | Call services; revalidate paths |
| `api/` | External integrations (Telegram, webhooks, public REST) | Thin handlers → services |
| `services/` | Business rules, transactions | Shelter-scoped; emit events |
| `lib/` | Infrastructure adapters | DB, Auth, Storage, Telegram, AI |

---

## Key Conventions

1. **Imports:** `@/` maps to `src/`
2. **Naming:** Services = `{domain}.service.ts`, Actions = plural noun
3. **Tenant context:** Every service method receives `shelterId` explicitly or via `TenantContext`
4. **Errors:** Custom `AppError` with codes; never leak internal errors to public API
5. **Validation:** Zod schemas in `src/lib/validations/` shared between API and actions
