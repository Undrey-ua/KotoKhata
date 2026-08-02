# KotoXata — Supabase & Railway Integration Plan

---

## 1. Supabase Setup

### Project Structure

```
Supabase Project: kotoxata-prod
├── Database (PostgreSQL 15)
├── Auth (email + magic link + Google OAuth)
├── Storage (media buckets)
└── Edge Functions (optional, Phase 2)
```

### Database Connection

Prisma connects via connection pooler:

```env
# .env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
```

- `DATABASE_URL` — pooled (for app runtime)
- `DIRECT_URL` — direct (for Prisma migrations)

### Auth Integration

```typescript
// User sync flow:
// 1. User registers via Supabase Auth
// 2. Database trigger OR app webhook creates User record with same UUID

// src/lib/auth/supabase-server.ts
import { createServerClient } from '@supabase/ssr'

export async function getSession() {
  const supabase = createServerClient(/* cookies */)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  // Fetch app User with roles
  const appUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { shelterMemberships: true }
  })
  return appUser
}
```

**Auth methods (MVP):**
- Email + password
- Magic link
- Google OAuth (optional)

**Auth methods (V2):**
- Apple Sign-In
- Phone OTP

### Storage Buckets

| Bucket | Access | Contents |
|--------|--------|----------|
| `animal-media` | Public read, auth write | Photos, videos for catalog |
| `animal-media-private` | Auth only | Pre-publish drafts, medical attachments |
| `shelter-assets` | Public read | Logos, branding |

**Upload flow:**
```typescript
// 1. Client requests signed upload URL
const { signedUrl } = await supabase.storage
  .from('animal-media')
  .createSignedUploadUrl(`${shelterId}/${animalId}/${uuid}.jpg`)

// 2. Client uploads directly to Supabase Storage
// 3. Server creates Media record with storagePath
// 4. Public URL: supabase.co/storage/v1/object/public/animal-media/...
```

**Storage policies (RLS):**
```sql
-- Public read for animal-media bucket
CREATE POLICY "Public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'animal-media');

-- Authenticated upload for shelter members
CREATE POLICY "Members upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'animal-media'
    AND auth.uid() IN (
      SELECT user_id FROM shelter_members 
      WHERE shelter_id = (storage.foldername(name))[1]::uuid
    )
  );
```

### Row Level Security (Phase 2)

MVP relies on application-level tenant scoping. Phase 2 adds RLS as defense-in-depth:

```sql
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shelter members access" ON animals
  FOR ALL USING (
    shelter_id IN (
      SELECT shelter_id FROM shelter_members 
      WHERE user_id = auth.uid()
    )
  );
```

---

## 2. Railway Setup

### Services

```toml
# railway.toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

### Environment Variables (Railway)

```env
# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://petshelter.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Telegram
TELEGRAM_SPONSOR_BOT_TOKEN=...
TELEGRAM_VOLUNTEER_BOT_TOKEN=...
TELEGRAM_SPONSOR_WEBHOOK_SECRET=...
TELEGRAM_VOLUNTEER_WEBHOOK_SECRET=...

# AI
OPENAI_API_KEY=sk-...

# Payments (Phase 2)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Deploy Pipeline

```
GitHub push to main
    │
    ▼
Railway auto-deploy
    │
    ├── npm install
    ├── prisma generate
    ├── prisma migrate deploy
    ├── next build
    └── next start
    │
    ▼
Post-deploy hook:
    └── setup-telegram-webhooks.ts
```

### Health Check

```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return Response.json({ status: 'ok', db: 'connected' })
  } catch {
    return Response.json({ status: 'error' }, { status: 503 })
  }
}
```

---

## 3. Domain & SSL

| Domain | Purpose |
|--------|---------|
| `petshelter.app` | Production |
| `staging.petshelter.app` | Staging (Railway environment) |
| `{slug}.petshelter.app` | Tenant subdomains (SaaS, Phase 3) |

Railway handles SSL automatically via Let's Encrypt.

---

## 4. Environments

| Environment | Railway | Supabase | Branch |
|-------------|---------|----------|--------|
| **Development** | — | Local (supabase start) | feature/* |
| **Staging** | staging service | staging project | develop |
| **Production** | prod service | prod project | main |

### Local Development

```bash
# Start local Supabase
supabase start

# Run migrations
npx prisma migrate dev

# Seed demo data
npx prisma db seed

# Start Next.js
npm run dev

# Telegram: use ngrok for webhook testing
ngrok http 3000
npm run setup:webhooks -- --url https://xxx.ngrok.io
```

---

## 5. Monitoring (Phase 2)

| Tool | Purpose |
|------|---------|
| Railway metrics | CPU, memory, deploy logs |
| Supabase dashboard | DB metrics, auth logs |
| Sentry | Error tracking |
| Better Stack | Uptime monitoring |

---

## 6. Backup Strategy

| Component | Strategy |
|-----------|----------|
| Database | Supabase daily backups (Pro plan); point-in-time recovery |
| Storage | Supabase bucket replication; no separate backup needed |
| Code | GitHub |
| Env vars | Railway environment sync; 1Password vault |

---

## 7. Migration Workflow

```bash
# Development
npx prisma migrate dev --name add_animal_mood

# Staging/Production (CI)
npx prisma migrate deploy
```

Migration files committed to git. Railway runs `migrate deploy` on each deploy.

---

## 8. Cost Estimate (MVP)

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Railway (web) | Hobby → Pro | $5–20 |
| Supabase | Pro | $25 |
| OpenAI | Pay-as-you-go | ~$1 |
| Domain | — | ~$1 |
| **Total MVP** | | **~$32–47/mo** |

Scales linearly with shelters until dedicated infrastructure needed (100+ shelters).
