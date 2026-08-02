# KotoXata — System Architecture

> Платформа для притулків тварин. Мета — емоційний зв'язок, не CRM.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS (3 equal peers)                        │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│   Public Website     │        CRM           │         Telegram              │
│   (Next.js SSR/SSG)  │   (Next.js App)      │   (2 Bots + Webhooks)         │
│                      │                      │                               │
│  • Catalog           │  • Full animal mgmt  │  • Sponsor Bot (Tamagotchi) │
│  • Animal profiles   │  • Analytics         │  • Volunteer Bot (actions)  │
│  • Adoption forms    │  • Bulk operations   │  • Inline keyboards           │
│  • Sponsorship       │  • Medical records   │  • Photo/video upload         │
│  • Donations         │  • User management   │  • AI-assisted news           │
└──────────┬───────────┴──────────┬───────────┴──────────────┬────────────────┘
           │                      │                          │
           └──────────────────────┼──────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     Next.js 15 App        │
                    │  (Monolith on Railway)    │
                    ├───────────────────────────┤
                    │  Route Handlers (REST)    │
                    │  Server Actions           │
                    │  Telegram Webhooks        │
                    │  AI Service Layer         │
                    │  Event Bus (internal)     │
                    └─────────────┬─────────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           │                      │                      │
    ┌──────▼──────┐      ┌────────▼────────┐    ┌───────▼───────┐
    │  Supabase   │      │    Supabase     │    │   OpenAI /    │
    │  PostgreSQL │      │    Storage      │    │   Anthropic   │
    │  + Prisma   │      │  (media/files)  │    │   (AI module) │
    └─────────────┘      └─────────────────┘    └───────────────┘
           │
    ┌──────▼──────┐
    │  Supabase   │
    │    Auth     │
    └─────────────┘
```

---

## 2. Architectural Principles

| Principle | Implementation |
|-----------|----------------|
| **Single Source of Truth** | One PostgreSQL DB. All clients read/write via same Prisma layer |
| **One Action → Multiple Channels** | Domain events propagate content to website, Telegram, CRM automatically |
| **Telegram First** | 80% of volunteer/sponsor actions happen in Telegram, not CRM |
| **Mobile First** | UI designed for 375px viewport; CRM is secondary |
| **Multi-Tenant** | Every business entity scoped by `shelterId`; row-level isolation |
| **AI Never Autonomous** | AI generates drafts; humans always confirm before publish |

---

## 3. Deployment Topology (Railway)

```
Railway Project: kotoxata
├── Service: web              # Next.js (public + CRM + API + webhooks)
├── Service: worker           # Background jobs (optional, Phase 2)
│   └── Telegram broadcast, email digests, media processing
├── Service: telegram-sponsor # Long-polling fallback (dev only)
└── Service: telegram-volunteer

External:
├── Supabase (DB + Auth + Storage) — hosted separately
├── Stripe / LiqPay             — payments (Phase 2)
└── OpenAI API                  — AI generation
```

**MVP:** Single `web` service handles everything including Telegram webhooks.
**Scale:** Extract `worker` for async jobs when broadcast volume grows.

---

## 4. Multi-Tenant Model

```
Platform (KotoXata)
└── Shelter (tenant) ─────────────────────────────────────┐
    ├── slug: "koto-lviv"                                  │
    ├── customDomain: "kotylviv.org" (SaaS, Phase 3)      │
    ├── settings: branding, payment keys, bot tokens       │
    │                                                      │
    ├── Members (Admin, Volunteer, Vet)                    │
    ├── Animals                                            │
    ├── Sponsors (linked via platform User)                │
    ├── Donations                                          │
    └── Telegram bots (platform bot OR shelter bot token)  │
```

**Tenant isolation:**
- All queries include `WHERE shelterId = ?`
- Prisma middleware enforces tenant context from session
- Supabase RLS as defense-in-depth (Phase 2)
- Public routes resolve shelter by subdomain or slug

**URL strategy:**
- MVP: `petshelter.app/s/kotoxata/...` (single shelter: Котохата)
- SaaS: `{shelterSlug}.petshelter.app` or custom domain

---

## 5. Event-Driven Content Propagation

When a volunteer adds a life story entry with a photo:

```
Volunteer (Telegram)
    │
    ▼
POST /api/telegram/volunteer/webhook
    │
    ▼
LifeStoryService.create({ animalId, media, text, isPublic })
    │
    ├──► DB: life_stories + media records
    │
    ├──► Storage: upload photo to Supabase
    │
    └──► EventBus.emit('life_story.created')
              │
              ├──► if isPublic:
              │       • Revalidate public animal page (Next.js cache)
              │       • Notify sponsors via Telegram Bot API
              │
              ├──► Always:
              │       • Update animal "last activity" timestamp
              │       • Appear in CRM timeline instantly
              │
              └──► if AI draft pending:
                      • Store draft, await volunteer confirmation
```

No duplicate data entry. One action, multiple surfaces.

---

## 6. Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Client    │────►│ Supabase Auth│────►│  JWT Session    │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                  │
                                         ┌────────▼────────┐
                                         │ Resolve User +  │
                                         │ ShelterMember   │
                                         │ roles           │
                                         └────────┬────────┘
                                                  │
                              ┌───────────────────┼───────────────────┐
                              ▼                   ▼                   ▼
                         Admin/Volunteer      Sponsor              Guest
                         → CRM access         → Sponsor bot        → Public only
                         → Volunteer bot      → Own animals
```

**Telegram linking:**
1. User logs in on website → generates 6-digit code
2. User sends `/link CODE` to bot
3. Bot associates `telegramChatId` ↔ `userId`
4. Future notifications route to linked chat

---

## 7. Caching Strategy

| Layer | Strategy |
|-------|----------|
| Public animal catalog | ISR, revalidate on `animal.updated` event (60s fallback) |
| Animal profile page | ISR per animal, on-demand revalidation |
| CRM dashboards | No cache, always fresh |
| Telegram state | Redis/session in DB (`telegram_sessions` table) for conversation FSM |

---

## 8. Security Boundaries

- **Public API:** Read-only for published content; rate-limited forms
- **Authenticated API:** JWT from Supabase; shelter scoping enforced
- **Telegram Webhooks:** Secret token validation; shelter resolved from bot token
- **AI Module:** No access to medical records; input sanitized; output reviewed
- **Storage:** Signed URLs for private media; public bucket for catalog photos

---

## 9. Technology Decisions & Rationale

| Choice | Why |
|--------|-----|
| Next.js monolith | Shared types, single deploy, Server Actions reduce API boilerplate |
| Prisma + Supabase PG | Type-safe ORM; Supabase gives Auth + Storage + realtime option |
| Two Telegram bots | Different UX flows; separate webhook handlers; clearer permissions |
| Server Actions for CRM | Colocated mutations; less REST ceremony for internal tools |
| REST webhooks for Telegram | Telegram requires HTTP endpoints; stateless handlers |
| No separate CRM framework | Custom UI = warm, not bureaucratic; shadcn gives speed |

---

## 10. Non-Goals (MVP)

- Native mobile apps
- Real-time chat between sponsors and volunteers
- Veterinary module (prescriptions, lab results)
- Multi-language (Ukrainian + English from MVP — see `docs/00-decisions.md`)
- White-label custom domains
- Offline mode
