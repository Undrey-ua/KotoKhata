# KotoXata — Entity-Relationship Diagram

## Core Entities Overview

```mermaid
erDiagram
    Shelter ||--o{ ShelterMember : has
    Shelter ||--o{ Animal : owns
    Shelter ||--o{ Donation : receives
    Shelter ||--o{ AdoptionApplication : receives
    
    User ||--o{ ShelterMember : belongs_to
    User ||--o{ Sponsorship : creates
    User ||--o| TelegramAccount : links
    User ||--o{ AdoptionApplication : submits
    
    Animal ||--o{ LifeStory : has
    Animal ||--o{ Media : has
    Animal ||--o{ MedicalRecord : has
    Animal ||--o{ Sponsorship : receives
    Animal ||--o{ AdoptionApplication : target_of
    Animal ||--o{ AnimalStatusHistory : tracks
    
    LifeStory ||--o{ Media : includes
    LifeStory ||--o| AiDraft : may_have
    
    Sponsorship ||--o{ SponsorshipPayment : has
    
    Shelter {
        uuid id PK
        string slug UK
        string name
        string description
        json settings
        datetime createdAt
    }
    
    User {
        uuid id PK
        string email UK
        string fullName
        string avatarUrl
        datetime createdAt
    }
    
    ShelterMember {
        uuid id PK
        uuid shelterId FK
        uuid userId FK
        enum role
        datetime joinedAt
    }
    
    Animal {
        uuid id PK
        uuid shelterId FK
        string slug
        string name
        enum species
        enum sex
        date birthDate
        enum status
        enum personality
        text description
        text characterTraits
        text healthNotes
        boolean vaccinated
        boolean sterilized
        string location
        boolean isPublic
        datetime adoptedAt
        datetime createdAt
    }
    
    LifeStory {
        uuid id PK
        uuid animalId FK
        uuid authorId FK
        text content
        boolean isPublic
        enum mood
        datetime publishedAt
        datetime createdAt
    }
    
    Media {
        uuid id PK
        uuid animalId FK
        uuid lifeStoryId FK
        enum type
        string storagePath
        string publicUrl
        boolean isPublic
        datetime createdAt
    }
    
    MedicalRecord {
        uuid id PK
        uuid animalId FK
        uuid authorId FK
        enum type
        text description
        date recordDate
        boolean isPublic
        datetime createdAt
    }
    
    Sponsorship {
        uuid id PK
        uuid animalId FK
        uuid sponsorId FK
        enum status
        decimal monthlyAmount
        datetime startedAt
        datetime endedAt
    }
    
    SponsorshipPayment {
        uuid id PK
        uuid sponsorshipId FK
        decimal amount
        enum status
        string externalId
        datetime paidAt
    }
    
    AdoptionApplication {
        uuid id PK
        uuid shelterId FK
        uuid animalId FK
        uuid applicantId FK
        enum status
        json formData
        datetime createdAt
    }
    
    Donation {
        uuid id PK
        uuid shelterId FK
        uuid donorId FK
        decimal amount
        enum type
        string message
        datetime createdAt
    }
    
    TelegramAccount {
        uuid id PK
        uuid userId FK
        bigint chatId UK
        string username
        enum botType
        datetime linkedAt
    }
    
    AiDraft {
        uuid id PK
        uuid lifeStoryId FK
        text generatedText
        enum status
        int variantNumber
        datetime createdAt
    }
    
    AnimalStatusHistory {
        uuid id PK
        uuid animalId FK
        enum fromStatus
        enum toStatus
        uuid changedById FK
        datetime changedAt
    }
    
    Notification {
        uuid id PK
        uuid userId FK
        uuid animalId FK
        enum channel
        enum type
        text payload
        boolean sent
        datetime createdAt
    }
```

---

## Relationship Summary

| From | To | Cardinality | Notes |
|------|-----|-------------|-------|
| Shelter | Animal | 1:N | Tenant boundary |
| Shelter | ShelterMember | 1:N | Staff access |
| User | ShelterMember | 1:N | User can belong to multiple shelters |
| User | Sponsorship | 1:N | Sponsor role |
| Animal | LifeStory | 1:N | Timeline entries |
| Animal | Media | 1:N | Photos/videos (may link to story) |
| Animal | MedicalRecord | 1:N | Vet entries (future: restricted) |
| Animal | Sponsorship | 1:N | Multiple sponsors allowed (partial funding) |
| LifeStory | AiDraft | 1:0..1 | Draft before publish |
| User | TelegramAccount | 1:0..1 | One chat per user per bot type |

---

## Status State Machine (Animal)

```mermaid
stateDiagram-v2
    [*] --> SEEKING_SPONSOR: new animal
    
    SEEKING_SPONSOR --> PARTIALLY_FUNDED: first sponsor
    SEEKING_SPONSOR --> SEEKING_HOME: skip sponsorship
    PARTIALLY_FUNDED --> FULLY_SPONSORED: funding goal met
    PARTIALLY_FUNDED --> SEEKING_HOME: also needs home
    
    FULLY_SPONSORED --> SEEKING_HOME: ready for adoption
    SEEKING_HOME --> ADOPTED: application approved
    SEEKING_SPONSOR --> ADOPTED: direct adoption
    
    SEEKING_SPONSOR --> PERMANENT_RESIDENT: not adoptable
    SEEKING_HOME --> PERMANENT_RESIDENT: decision changed
    
    ADOPTED --> [*]: card becomes success story (not deleted)
    PERMANENT_RESIDENT --> [*]: stays in catalog as resident
```

---

## Indexes Strategy

```sql
-- Tenant scoping (every query)
CREATE INDEX idx_animals_shelter ON animals(shelter_id);
CREATE INDEX idx_animals_shelter_status ON animals(shelter_id, status);
CREATE INDEX idx_animals_shelter_slug ON animals(shelter_id, slug);

-- Public catalog
CREATE INDEX idx_animals_public ON animals(shelter_id, is_public, status) 
  WHERE is_public = true;

-- Sponsor lookups
CREATE INDEX idx_sponsorships_sponsor ON sponsorships(sponsor_id, status);
CREATE INDEX idx_sponsorships_animal ON sponsorships(animal_id, status);

-- Timeline
CREATE INDEX idx_life_stories_animal ON life_stories(animal_id, published_at DESC);

-- Telegram
CREATE UNIQUE INDEX idx_telegram_chat ON telegram_accounts(chat_id, bot_type);
```
