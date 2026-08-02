# KotoXata — API Structure

Two API surfaces: **REST Route Handlers** (external clients, Telegram, public) and **Server Actions** (CRM forms).

---

## 1. Public REST API (`/api/v1`)

Read-heavy, cache-friendly. No auth for catalog; auth for user actions.

### Shelters

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/shelters/{slug}` | — | Shelter public profile |
| GET | `/api/v1/shelters/{slug}/animals` | — | Catalog with filters |

**Query params for catalog:**
```
?status=SEEKING_SPONSOR,SEEKING_HOME
&sex=FEMALE
&page=1&limit=20
&sort=-createdAt
```

### Animals (Public)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/shelters/{slug}/animals/{animalSlug}` | — | Full public profile |
| GET | `/api/v1/shelters/{slug}/animals/{animalSlug}/stories` | — | Public life stories |
| GET | `/api/v1/shelters/{slug}/animals/{animalSlug}/media` | — | Public photos/videos |

### Sponsorship & Adoption (Authenticated)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/shelters/{slug}/animals/{animalSlug}/sponsor` | User | Start sponsorship |
| POST | `/api/v1/shelters/{slug}/animals/{animalSlug}/adopt` | User | Submit adoption application |
| POST | `/api/v1/shelters/{slug}/donate` | User? | One-time donation (guest OK) |

### User Account

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/me` | User | Profile + sponsorships |
| GET | `/api/v1/me/sponsorships` | User | My sponsored animals |
| POST | `/api/v1/me/telegram/link-code` | User | Generate link code for bot |

---

## 2. CRM REST API (`/api/v1/crm`)

All endpoints require auth + shelter membership.

Base: `/api/v1/crm/{shelterSlug}/...`

### Animals

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/animals` | Volunteer+ | List all (incl. non-public) |
| POST | `/animals` | Volunteer+ | Create animal |
| GET | `/animals/{id}` | Volunteer+ | Full card with all tabs |
| PATCH | `/animals/{id}` | Volunteer+ | Update fields |
| PATCH | `/animals/{id}/status` | Volunteer+ | Change status (logged) |
| DELETE | `/animals/{id}` | Admin | Soft-delete (set isPublic=false) |

### Life Stories

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/animals/{id}/stories` | Volunteer+ | All stories |
| POST | `/animals/{id}/stories` | Volunteer+ | Create story |
| PATCH | `/stories/{id}` | Volunteer+ | Edit / publish |
| DELETE | `/stories/{id}` | Admin | Remove |

### Media

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/animals/{id}/media` | Volunteer+ | Upload (returns signed URL) |
| PATCH | `/media/{id}` | Volunteer+ | Set cover, visibility |
| DELETE | `/media/{id}` | Volunteer+ | Remove |

### Medical

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/animals/{id}/medical` | Volunteer+ | Records list |
| POST | `/animals/{id}/medical` | Volunteer+ | Add record |
| PATCH | `/medical/{id}` | Admin/Vet | Edit record |

### Sponsorships & Applications

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/sponsorships` | Volunteer+ | All shelter sponsorships |
| GET | `/applications` | Volunteer+ | Adoption applications |
| PATCH | `/applications/{id}` | Admin | Approve/reject |

### Admin

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/members` | Admin | Staff list |
| POST | `/members/invite` | Admin | Invite volunteer |
| PATCH | `/members/{id}` | Admin | Change role |
| GET | `/settings` | Admin | Shelter settings |
| PATCH | `/settings` | Admin | Update settings |

---

## 3. Server Actions (CRM)

Used by CRM React forms. Colocated in `src/actions/`.

```typescript
// animals.ts
createAnimal(shelterSlug, data)
updateAnimal(shelterSlug, animalId, data)
changeAnimalStatus(shelterSlug, animalId, status)

// life-stories.ts
createLifeStory(shelterSlug, animalId, data)
publishLifeStory(shelterSlug, storyId)
approveAiDraft(shelterSlug, draftId, editedText?)

// media.ts
uploadAnimalMedia(shelterSlug, animalId, formData)
setCoverPhoto(shelterSlug, mediaId)

// sponsorships.ts
respondToSponsor(shelterSlug, sponsorshipId, message)
```

**Pattern:**
```typescript
'use server'
export async function createAnimal(shelterSlug: string, data: CreateAnimalInput) {
  const ctx = await requireVolunteer(shelterSlug)
  const animal = await animalService.create(ctx.shelterId, ctx.userId, data)
  revalidatePath(`/s/${shelterSlug}/cats`)
  revalidatePath(`/crm/${shelterSlug}/animals`)
  return animal
}
```

---

## 4. Webhook Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/telegram/sponsor` | Sponsor bot updates |
| POST | `/api/webhooks/telegram/volunteer` | Volunteer bot updates |
| POST | `/api/webhooks/stripe` | Payment events (Phase 2) |
| POST | `/api/revalidate` | Internal: ISR on-demand revalidation |

---

## 5. AI Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/ai/generate-story` | Volunteer+ | Generate text from photo |
| POST | `/api/v1/ai/regenerate-story` | Volunteer+ | New variant |
| POST | `/api/v1/ai/analyze-photo` | Volunteer+ | Vision description (no publish) |

**Request:**
```json
{
  "animalId": "uuid",
  "photoUrl": "https://...",
  "mood": "GREAT"
}
```

**Response:**
```json
{
  "draftId": "uuid",
  "generatedText": "Привіт ❤️\nСьогодні я цілий день...",
  "photoAnalysis": "Cat sitting in a cardboard box near window",
  "variantNumber": 1
}
```

---

## 6. Response Format

```typescript
// Success
{ "data": T, "meta"?: { page, total, ... } }

// Error
{
  "error": {
    "code": "ANIMAL_NOT_FOUND",
    "message": "Тварину не знайдено",
    "details"?: {}
  }
}
```

**HTTP Status Codes:**
- `200` — OK
- `201` — Created
- `400` — Validation error
- `401` — Not authenticated
- `403` — Forbidden (wrong role/shelter)
- `404` — Not found
- `429` — Rate limited
- `500` — Internal error

---

## 7. Rate Limits

| Surface | Limit |
|---------|-------|
| Public catalog | 100 req/min/IP |
| Auth endpoints | 20 req/min/IP |
| Telegram webhooks | No limit (validated by secret) |
| AI generation | 10 req/min/user |
| Form submissions | 5 req/min/IP |

---

## 8. API Versioning

- MVP: `/api/v1/...`
- Breaking changes → `/api/v2/...`
- Server Actions unversioned (internal)
