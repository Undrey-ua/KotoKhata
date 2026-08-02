# KotoXata — Roadmap

---

## Phase 0: Foundation (Week 1–2)

**Goal:** Project skeleton, DB, auth, deploy pipeline.

| Task | Deliverable |
|------|-------------|
| Init Next.js 15 + TypeScript + Tailwind + shadcn | Running dev environment |
| Prisma schema + initial migration | Database ready |
| Supabase project (Auth + Storage + DB) | External services connected |
| Railway deploy pipeline | Staging URL live |
| Seed script (1 demo shelter, 5 cats) | Demo data |
| Health check endpoint | Monitoring ready |

**Exit criteria:** `staging.petshelter.app` shows landing page; admin can log in.

---

## Phase 1: MVP (Week 3–8)

**Goal:** One shelter can manage cats and sponsors can follow them.

### 1A. Public Website (Week 3–4)

| Feature | Priority |
|---------|----------|
| Shelter home page | P0 |
| Animal catalog with status filters | P0 |
| Animal profile page (photos, story, status) | P0 |
| Responsive mobile design | P0 |
| SEO meta tags | P1 |

### 1B. CRM Core (Week 4–5)

| Feature | Priority |
|---------|----------|
| Animal CRUD (all tabs) | P0 |
| Photo/video upload | P0 |
| Life story creation & publish | P0 |
| Status management | P0 |
| Member invite (admin) | P1 |

### 1C. Telegram Volunteer Bot (Week 5–6)

| Feature | Priority |
|---------|----------|
| Account linking | P0 |
| New cat flow (photo + name) | P0 |
| New story flow (manual text) | P0 |
| New story flow (AI generation) | P0 |
| AI review (approve/edit/regenerate) | P0 |

### 1D. Telegram Sponsor Bot (Week 6–7)

| Feature | Priority |
|---------|----------|
| Account linking | P0 |
| Animal dashboard (Tamagotchi UI) | P0 |
| Photo/video/news viewing | P0 |
| Push notifications on new content | P0 |
| "Допомогти" deep link | P1 |

### 1E. Sponsorship & Applications (Week 7–8)

| Feature | Priority |
|---------|----------|
| Sponsorship signup form (website) | P0 |
| Manual payment flow (IBAN + admin confirmation) | P0 |
| Adoption application form | P1 |
| Application review in CRM | P1 |
| One-time donation form (manual transfer) | P1 |

**MVP Exit criteria:**
- Volunteer adds cat via Telegram in <30 sec ✓
- Volunteer posts AI-generated news via Telegram ✓
- Sponsor receives notification and views update in bot ✓
- Public catalog shows cats with beautiful profiles ✓
- One real shelter using the platform daily ✓

---

## Phase 2: Version 2 (Month 3–4)

**Goal:** Payments, polish, second shelter onboarding.

### Features

| Feature | Priority | Notes |
|---------|----------|-------|
| Stripe / LiqPay recurring payments | P0 | Sponsorship monetization |
| Stripe one-time donations | P0 | |
| Email notifications (digest) | P1 | Alternative to Telegram |
| Medical records tab (full) | P1 | Volunteer + Admin |
| Veterinarian role | P2 | Restricted medical access |
| Animal mood tracking | P1 | Shown in sponsor bot |
| Success stories section | P1 | Adopted cats showcase |
| CRM analytics dashboard | P2 | Sponsors, donations, adoptions |
| Background worker service | P1 | Notification queue |
| On-demand ISR optimization | P1 | Performance |

### Technical Debt

- Add Supabase RLS policies
- Sentry error tracking
- E2E tests (Playwright) for critical flows
- API rate limiting (upstash/redis)

**V2 Exit criteria:**
- 3+ shelters onboarded
- Recurring sponsorship payments working
- <2s page load on mobile

---

## Phase 3: SaaS (Month 5–8)

**Goal:** Self-service shelter registration, billing, white-label.

### Features

| Feature | Priority | Notes |
|---------|----------|-------|
| Shelter self-registration | P0 | |
| Subdomain per shelter (`{slug}.petshelter.app`) | P0 | |
| Platform admin panel | P0 | Manage tenants |
| Subscription billing (platform fee) | P0 | $29–99/mo tiers |
| Custom Telegram bot tokens per shelter | P1 | White-label bots |
| Custom branding (logo, colors) | P1 | |
| Custom domain support | P2 | `cats.shelter.org` |
| Multi-language (EN) | — | Done in MVP (UA + EN from start) |
| Shelter onboarding wizard | P1 | |
| API documentation (public) | P2 | For integrations |

### SaaS Tiers

| Tier | Price | Limits |
|------|-------|--------|
| **Free** | $0 | 10 animals, 1 admin, platform bots |
| **Starter** | $29/mo | 50 animals, 5 volunteers, custom branding |
| **Pro** | $59/mo | Unlimited animals, custom bots, analytics |
| **Enterprise** | $99/mo | Custom domain, priority support, API |

**SaaS Exit criteria:**
- 10+ paying shelters
- Self-service registration → first cat posted in <1 hour
- Platform revenue covers infrastructure

---

## Phase 4: Growth (Month 9+)

| Feature | Notes |
|---------|-------|
| Native mobile app (React Native) | If Telegram isn't enough |
| AI auto-suggest animal descriptions | CRM assist |
| Sponsor ↔ Volunteer messaging | In-app chat |
| Foster home management | New module |
| Event management (open days) | |
| Integration with Ukrainian payment systems | Portmone, Monobank |
| Social media auto-posting | Facebook, Instagram |
| Public API for partners | Pet shops, vet clinics |

---

## Timeline Visual

```
Month:  1    2    3    4    5    6    7    8    9+
        ├────┼────┼────┼────┼────┼────┼────┼────┼───►
Phase 0 ████
Phase 1      ████████████████
Phase 2                   ████████
Phase 3                           ████████████
Phase 4                                       ████→
        
MVP ▲                   V2 ▲              SaaS ▲
   W8                      M4                  M8
```

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Telegram API changes | High | Abstract bot layer; email fallback |
| Low shelter adoption | High | Start with 1 partner shelter; iterate on feedback |
| AI generates inappropriate content | Medium | Safety filter + human review mandatory |
| Payment regulations (UA) | Medium | Start with LiqPay; legal review before SaaS |
| Volunteer resistance to new tool | Medium | Telegram-first = familiar interface |
| Supabase vendor lock-in | Low | Standard PostgreSQL; migration path exists |

---

## Success Metrics

### MVP
- 1 shelter actively using platform
- 10+ cats in catalog
- 5+ active sponsors
- 20+ life stories published
- Volunteer posts news in <30 sec

### V2
- 3+ shelters
- 50+ active sponsors
- $500+/mo in sponsorship payments processed
- 80%+ sponsor retention after 3 months

### SaaS
- 10+ paying shelters
- $1,000+/mo platform revenue
- <5% monthly churn
- NPS > 50 from shelter admins
