# KotoXata — Roles & Permissions

---

## 1. Role Definitions

| Role | Scope | Primary Client | Description |
|------|-------|----------------|-------------|
| **Guest** | Public | Website | Browse catalog, submit forms |
| **Sponsor** | Own animals | Telegram + Website | Financial guardian of specific animals |
| **Volunteer** | One shelter | Telegram (primary) + CRM | Day-to-day animal care & content |
| **Admin** | One shelter | CRM | Full shelter management |
| **Veterinarian** | One shelter | CRM (future) | Medical records only |
| **Platform Admin** | Platform | Internal | Multi-tenant management (SaaS) |

---

## 2. Permission Matrix

Legend: ✅ Allowed · 🔒 Own only · 👁 Read only · ❌ Denied

### Animals

| Action | Guest | Sponsor | Volunteer | Admin | Vet |
|--------|-------|---------|-----------|-------|-----|
| View public catalog | ✅ | ✅ | ✅ | ✅ | ✅ |
| View full card (incl. private) | ❌ | 🔒 | ✅ | ✅ | 👁 |
| Create animal | ❌ | ❌ | ✅ | ✅ | ❌ |
| Edit animal info | ❌ | ❌ | ✅ | ✅ | ❌ |
| Change status | ❌ | ❌ | ✅ | ✅ | ❌ |
| Delete/archive animal | ❌ | ❌ | ❌ | ✅ | ❌ |

### Life Stories & Media

| Action | Guest | Sponsor | Volunteer | Admin | Vet |
|--------|-------|---------|-----------|-------|-----|
| View public stories/photos | ✅ | 🔒 | ✅ | ✅ | 👁 |
| Create story/photo/video | ❌ | ❌ | ✅ | ✅ | ❌ |
| Publish (set isPublic) | ❌ | ❌ | ✅ | ✅ | ❌ |
| Use AI generation | ❌ | ❌ | ✅ | ✅ | ❌ |
| Delete media | ❌ | ❌ | ✅ | ✅ | ❌ |

### Medical Records

| Action | Guest | Sponsor | Volunteer | Admin | Vet |
|--------|-------|---------|-----------|-------|-----|
| View public health notes | ✅ | 🔒 | ✅ | ✅ | ✅ |
| View full medical history | ❌ | ❌ | 👁 | ✅ | ✅ |
| Create medical record | ❌ | ❌ | ✅ | ✅ | ✅ |
| Edit medical record | ❌ | ❌ | ❌ | ✅ | ✅ |

> **AI Rule:** AI module has NO access to `MedicalRecord` table.

### Sponsorship & Finance

| Action | Guest | Sponsor | Volunteer | Admin | Vet |
|--------|-------|---------|-----------|-------|-----|
| Become sponsor | ✅ | ✅ | ❌ | ❌ | ❌ |
| View own sponsorships | ❌ | ✅ | ❌ | ✅ | ❌ |
| View all sponsorships | ❌ | ❌ | 👁 | ✅ | ❌ |
| Respond to sponsors | ❌ | ❌ | ✅ | ✅ | ❌ |
| Manage payments | ❌ | 🔒 | ❌ | ✅ | ❌ |
| View donations | ❌ | ❌ | 👁 | ✅ | ❌ |

### Adoption

| Action | Guest | Sponsor | Volunteer | Admin | Vet |
|--------|-------|---------|-----------|-------|-----|
| Submit application | ✅ | ✅ | ❌ | ❌ | ❌ |
| View applications | ❌ | 🔒 | ✅ | ✅ | ❌ |
| Approve/reject | ❌ | ❌ | ❌ | ✅ | ❌ |

### Shelter Management

| Action | Guest | Sponsor | Volunteer | Admin | Vet |
|--------|-------|---------|-----------|-------|-----|
| Invite members | ❌ | ❌ | ❌ | ✅ | ❌ |
| Change member roles | ❌ | ❌ | ❌ | ✅ | ❌ |
| Edit shelter settings | ❌ | ❌ | ❌ | ✅ | ❌ |
| Configure Telegram bots | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 3. Data Isolation Rules

### Shelter Scoping (Volunteer, Admin, Vet)
```typescript
// Every query MUST include shelterId from membership
const animals = await prisma.animal.findMany({
  where: { shelterId: ctx.shelterId }
})
```

### Sponsor Scoping
```typescript
// Sponsor sees ONLY animals they sponsor
const animals = await prisma.animal.findMany({
  where: {
    sponsorships: {
      some: { sponsorId: ctx.userId, status: 'ACTIVE' }
    }
  }
})
```

### Public Scoping
```typescript
// Guest sees only public content
const animals = await prisma.animal.findMany({
  where: {
    shelterId: shelter.id,
    isPublic: true,
    status: { not: 'ADOPTED' } // or include as success stories
  }
})
```

---

## 4. Implementation

### Permission Check Helper

```typescript
// src/lib/auth/permissions.ts

type Action =
  | 'animal:create' | 'animal:update' | 'animal:delete'
  | 'story:create' | 'story:publish'
  | 'medical:create' | 'medical:view_full'
  | 'sponsorship:view_all' | 'application:approve'
  | 'shelter:manage'

const PERMISSIONS: Record<ShelterMemberRole, Action[]> = {
  ADMIN: [/* all actions */],
  VOLUNTEER: [
    'animal:create', 'animal:update',
    'story:create', 'story:publish',
    'medical:create',
    'sponsorship:view_all',
  ],
  VETERINARIAN: [
    'medical:create', 'medical:view_full',
  ],
}

export function can(role: ShelterMemberRole, action: Action): boolean {
  return PERMISSIONS[role]?.includes(action) ?? false
}
```

### Middleware Chain

```
Request
  → authenticate (Supabase JWT)
  → resolveShelter (from slug or Telegram context)
  → authorize (role + action + resource ownership)
  → handler
```

---

## 5. Telegram-Specific Permissions

| Bot | Who Can Use | Auth Method |
|-----|-------------|-------------|
| **Sponsor Bot** | Linked sponsors | `/link CODE` → TelegramAccount |
| **Volunteer Bot** | Shelter members with Volunteer+ role | `/link CODE` + ShelterMember check |

Unlinked users in Volunteer Bot:
- See welcome message + link instructions
- Cannot perform any actions

Unlinked users in Sponsor Bot:
- Can browse public info (limited)
- Prompted to register on website and link account

---

## 6. Future: Platform Admin (SaaS)

| Action | Platform Admin |
|--------|----------------|
| Create/disable shelters | ✅ |
| View cross-tenant analytics | ✅ |
| Manage billing | ✅ |
| Access shelter data | ❌ (unless impersonating with audit log) |
