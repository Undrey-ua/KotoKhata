# KotoXata — Scaling Plan

---

## 1. Scaling Stages

```
Stage 1: MVP           Stage 2: Growth         Stage 3: SaaS
(1-3 shelters)         (10-50 shelters)        (50+ shelters)
     │                       │                       │
     ▼                       ▼                       ▼
 Monolith on           Monolith + Worker      Multi-service
 Railway               + Redis cache          + CDN + Read replicas
 Single Supabase       Supabase Pro           Dedicated DB per tier
```

---

## 2. Bottleneck Analysis

| Component | First bottleneck | Symptom | Solution |
|-----------|-----------------|---------|----------|
| **Database** | Connection pool exhaustion | Slow queries, timeouts | PgBouncer (already via Supabase), read replicas |
| **Telegram webhooks** | Sequential processing | Delayed bot responses | Queue + worker service |
| **Media uploads** | Large video files | Timeout on upload | Direct-to-Storage upload (already planned) |
| **AI generation** | OpenAI rate limits | 429 errors | Queue with retry, fallback message |
| **Public catalog** | ISR regeneration storms | High CPU on publish | Debounced revalidation, batch invalidation |
| **Notifications** | Broadcast to 100+ sponsors | Telegram API rate limit | Queue with 30 msg/sec throttle |

---

## 3. Horizontal Scaling Strategy

### Stage 1 → 2: Extract Worker

```
Before:
  [Next.js Web] ─── handles everything

After:
  [Next.js Web] ─── HTTP, SSR, webhooks (fast response)
  [Worker]      ─── notifications, AI, media processing
         │
         └── Redis/BullMQ queue
```

**Jobs moved to worker:**
- `notify-sponsors` — batch Telegram messages
- `process-media` — thumbnail generation, video transcoding
- `generate-ai-story` — if >3 sec, return immediately and notify when ready
- `send-digest` — weekly email to sponsors (V2)

### Stage 2 → 3: Read Replicas

```
                    ┌── Read Replica 1 (catalog)
[Next.js Web] ──────┤
                    └── Read Replica 2 (CRM reports)
         │
         └── Primary (writes)
```

Prisma read replica support:
```typescript
const readClient = new PrismaClient({ datasourceUrl: env.READ_DATABASE_URL })
const writeClient = new PrismaClient({ datasourceUrl: env.DATABASE_URL })
```

---

## 4. Caching Layers

| Layer | Technology | TTL | Invalidation |
|-------|-----------|-----|-------------|
| CDN (static) | Railway / Cloudflare | 1 year | Deploy |
| ISR (pages) | Next.js | 60s–3600s | On-demand revalidation |
| API response | Redis (Stage 2) | 30s | Event-based |
| DB query | Prisma cache (Stage 3) | 5s | Write-through |

### Cache Keys

```
catalog:{shelterSlug}:page:{n}          → animal list
animal:{shelterSlug}:{animalSlug}       → profile page
sponsor:{userId}:animals                → sponsor's animals
session:{chatId}:{botType}              → Telegram FSM
```

---

## 5. Multi-Tenant Scaling

### Database Strategy

| Shelters | Strategy |
|----------|----------|
| 1–50 | Shared DB, `shelterId` column scoping |
| 50–200 | Shared DB + RLS + connection pooling |
| 200+ | Schema-per-tenant OR dedicated DB for enterprise |

All business tables already have `shelterId` — no schema changes needed to scale.

### Telegram Scaling

| Shelters | Strategy |
|----------|----------|
| MVP | 2 platform bots, shelter from user membership |
| V2 | Per-shelter bot tokens (optional) |
| SaaS | Bot token required per shelter; webhook routes by token |

Webhook routing:
```typescript
// Resolve shelter from bot token
const shelter = await prisma.shelter.findFirst({
  where: {
    OR: [
      { telegramSponsorBotToken: token },
      { telegramVolunteerBotToken: token },
    ]
  }
})
```

---

## 6. Performance Targets

| Metric | MVP | Growth | SaaS |
|--------|-----|--------|------|
| Public page load (LCP) | <2.5s | <1.5s | <1s |
| API response (p95) | <500ms | <200ms | <100ms |
| Telegram response | <3s | <1s | <500ms |
| AI generation | <10s | <5s | <3s |
| Uptime | 99% | 99.5% | 99.9% |

---

## 7. Database Optimization

### Query Patterns to Optimize Early

```sql
-- Most frequent: public catalog
SELECT * FROM animals 
WHERE shelter_id = $1 AND is_public = true AND status != 'ADOPTED'
ORDER BY created_at DESC LIMIT 20;
-- Index: (shelter_id, is_public, status, created_at DESC)

-- Sponsor dashboard
SELECT a.* FROM animals a
JOIN sponsorships s ON s.animal_id = a.id
WHERE s.sponsor_id = $1 AND s.status = 'ACTIVE';
-- Index: sponsorships(sponsor_id, status)

-- CRM timeline
SELECT * FROM life_stories
WHERE animal_id = $1 ORDER BY published_at DESC LIMIT 50;
-- Index: (animal_id, published_at DESC)
```

### Archival Strategy (SaaS)

Animals with status `ADOPTED` older than 2 years:
- Move to `animals_archive` table OR
- Keep in place but exclude from default queries
- Success story page remains accessible via direct URL

---

## 8. Notification Queue Design

```typescript
// BullMQ job: notify-sponsors
interface NotifySponsorsJob {
  animalId: string
  lifeStoryId: string
  type: 'LIFE_STORY' | 'PHOTO' | 'HEALTH_UPDATE'
}

// Processor
async function processNotifySponsors(job: NotifySponsorsJob) {
  const sponsors = await getActiveSponsors(job.animalId)
  
  for (const sponsor of sponsors) {
    await telegramQueue.add('send-message', {
      chatId: sponsor.telegramChatId,
      message: formatNotification(job),
    }, {
      delay: sponsors.indexOf(sponsor) * 35, // 30/sec Telegram limit
    })
  }
}
```

---

## 9. Disaster Recovery

| Scenario | RTO | RPO | Action |
|----------|-----|-----|--------|
| Railway outage | 30 min | 0 | Redeploy to backup region |
| Supabase outage | 1 hour | 1 hour | Wait for Supabase; show maintenance page |
| Data corruption | 4 hours | 24 hours | Restore from Supabase backup |
| Bot token compromised | 15 min | 0 | Revoke token, generate new, update webhook |

---

## 10. Cost Scaling Projection

| Shelters | Users | Railway | Supabase | OpenAI | Total/mo |
|----------|-------|---------|----------|--------|----------|
| 1 | 50 | $5 | $25 | $1 | $31 |
| 10 | 500 | $20 | $25 | $5 | $50 |
| 50 | 2,500 | $50 | $75 | $20 | $145 |
| 100 | 5,000 | $100 | $150 | $50 | $300 |
| 500 | 25,000 | $300 | $500 | $200 | $1,000 |

Revenue model (SaaS): $29–99/shelter/month → profitable at ~5 paying shelters.
