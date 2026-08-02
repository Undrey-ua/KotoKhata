# KotoXata — AI Module Architecture

AI assists volunteers — never acts autonomously. Human always confirms before publish.

---

## 1. Module Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      AI MODULE                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │   Vision    │    │    Text      │    │   Safety      │  │
│  │   Analyzer  │───►│   Generator  │───►│   Filter      │  │
│  └─────────────┘    └──────────────┘    └───────────────┘  │
│        │                   │                    │           │
│        ▼                   ▼                    ▼           │
│  Photo description    Personality-based     Block medical  │
│  (internal only)      story text            hallucinations │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         ▲                                          │
         │                                          ▼
   Volunteer Bot                              AiDraft (DB)
   "🤖 AI" button                           status: PENDING_REVIEW
                                                    │
                              ┌─────────────────────┼──────────────┐
                              ▼                     ▼              ▼
                         ✅ Approve           ✏️ Edit         🎲 Regenerate
                              │                     │              │
                              └─────────────────────┼──────────────┘
                                                    ▼
                                            LifeStory.published
```

---

## 2. Capabilities (MVP)

| Feature | Input | Output | Auto-publish |
|---------|-------|--------|--------------|
| **Story generation** | Photo + animal personality | Text in animal's voice | ❌ Never |
| **Photo analysis** | Photo | Scene description (internal) | ❌ Never |
| **Variant regeneration** | Same input + variant number | Alternative text | ❌ Never |

## 3. Explicitly Forbidden

| Forbidden | Reason |
|-----------|--------|
| Auto-publish any content | Human trust & accuracy |
| Generate medical data | Safety — could harm animals |
| Access medical records | Privacy + accuracy |
| Respond to sponsors automatically | Personal touch required |
| Invent animal history | Factual integrity |

---

## 4. Personality System

Each animal has `personality` enum that drives prompt selection:

```typescript
const PERSONALITY_PROMPTS: Record<AnimalPersonality, string> = {
  PLAYFUL: `
    Ти грайливе кошеня. Пишеш з ентузіазмом, багато emoji.
    Любиш ігри, коробки, полювання на іграшки.
    Стиль: короткі речення, восклики, "Мяу!".
  `,
  CALM: `
    Ти спокійний котик. Пишеш розмірено, тепло.
    Любиш сонечко, м'які подушки, тихі вечори.
    Стиль: плавні речення, без зайвого шуму.
  `,
  SHY: `
    Ти сором'язливий котик. Пишеш обережно, з "мм...".
    Поступово відкриваєшся. Менше emoji.
    Стиль: коротко, ніжно, з паузами.
  `,
  SERIOUS: `
    Ти серйозний котик з характером. Пишеш з гідністю.
    Спостерігаєш за всім зверху. Іронічний тон.
    Стиль: лаконічно, з легким гумором.
  `,
  KITTEN: `
    Ти маленьке кошеня. Пишеш наївно і мило.
    Все дивує і радує. Багато "!" та emoji.
    Стиль: дитячий, простий, емоційний.
  `,
}
```

---

## 5. Generation Pipeline

```typescript
// src/lib/ai/generate-story.ts

export async function generateLifeStory(input: {
  animal: Animal
  photoUrl: string
  mood?: AnimalMood
  variantNumber?: number
}): Promise<AiGenerationResult> {

  // Step 1: Vision analysis (internal, not shown to user)
  const photoAnalysis = await analyzePhoto(input.photoUrl)

  // Step 2: Build prompt
  const systemPrompt = buildSystemPrompt(input.animal)
  const userPrompt = buildUserPrompt({
    animalName: input.animal.name,
    photoAnalysis,
    mood: input.mood,
    variantNumber: input.variantNumber ?? 1,
  })

  // Step 3: Generate text
  const generatedText = await aiClient.complete({
    model: 'gpt-4o-mini', // cost-effective for MVP
    system: systemPrompt,
    user: userPrompt,
    maxTokens: 200,
    temperature: 0.8 + (input.variantNumber ?? 0) * 0.1, // more creative on regen
  })

  // Step 4: Safety filter
  const safeText = await safetyFilter(generatedText)

  return {
    generatedText: safeText,
    photoAnalysis, // stored in AiDraft, not shown to sponsors
    variantNumber: input.variantNumber ?? 1,
  }
}
```

### System Prompt Template

```
Ти — {animalName}, {personality_description}.

Правила:
- Пиши українською мовою
- Пиши від першої особи (я, мені, мій)
- 2-4 речення максимум
- Додай 1-2 emoji
- НЕ згадуй медичні терміни, ліки, діагнози
- НЕ вигадуй події, яких не було на фото
- Описуй лише те, що бачиш на фото
- Будь теплим і автентичним
```

### User Prompt Template

```
На фото: {photoAnalysis}
Настрій сьогодні: {mood_ukrainian}
{variant_hint if variantNumber > 1}

Напиши коротку новину для моїх опікунів.
```

---

## 6. Vision Analysis

```typescript
// src/lib/ai/analyze-photo.ts

export async function analyzePhoto(photoUrl: string): Promise<string> {
  const response = await aiClient.vision({
    model: 'gpt-4o-mini',
    image: photoUrl,
    prompt: `Опиши що відбувається на фото з кошеням/котом.
             Будь конкретним: де знаходиться, що робить, що поруч.
             1-2 речення українською. Без медичних термінів.`,
  })
  return response
}
```

Photo analysis is stored in `AiDraft.photoAnalysis` for debugging/regeneration — never shown to sponsors directly.

---

## 7. Safety Filter

```typescript
// src/lib/ai/safety-filter.ts

const BLOCKED_PATTERNS = [
  /лікування|діагноз|ліки|операція|хвор/i,
  /veterinary|medication|diagnosis/i,
  /\d+\s*(мг|mg|ml|мл)/i,  // dosage patterns
]

export function safetyFilter(text: string): string {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      throw new AiSafetyError('Generated text contains medical content')
    }
  }
  return text
}
```

---

## 8. API Integration

```
POST /api/v1/ai/generate-story
  → generateLifeStory()
  → create LifeStory (unpublished) + AiDraft
  → return { draftId, generatedText }

POST /api/v1/ai/regenerate-story
  → increment variantNumber
  → generateLifeStory() with higher temperature
  → update AiDraft
  → return new text

Volunteer confirms in Telegram:
  → lifeStoryService.publish(storyId, finalText)
  → AiDraft.status = APPROVED
  → EventBus → notify sponsors
```

---

## 9. Provider Abstraction

```typescript
// src/lib/ai/client.ts

interface AiProvider {
  complete(params: CompletionParams): Promise<string>
  vision(params: VisionParams): Promise<string>
}

// MVP: OpenAI
class OpenAiProvider implements AiProvider { ... }

// Future: Anthropic, local models
class AnthropicProvider implements AiProvider { ... }

export const aiClient: AiProvider = new OpenAiProvider()
```

Environment:
```
OPENAI_API_KEY=sk-...
AI_MODEL_TEXT=gpt-4o-mini
AI_MODEL_VISION=gpt-4o-mini
AI_MAX_VARIANTS=5
```

---

## 10. Cost Estimation (MVP)

| Action | Tokens | Cost per action |
|--------|--------|-----------------|
| Vision analysis | ~500 | ~$0.001 |
| Story generation | ~300 | ~$0.0005 |
| Regeneration ×3 avg | ~900 | ~$0.0015 |
| **Per news post** | | **~$0.003** |

100 news posts/month ≈ $0.30 — negligible.

---

## 11. Future AI Features (V2+)

| Feature | Priority | Notes |
|---------|----------|-------|
| Auto-suggest animal description from photos | Medium | CRM assist, not auto-save |
| Help volunteer reply to sponsor messages | Low | Draft only |
| Generate adoption profile summary | Medium | From existing data |
| Translate stories (UA → EN) | Low | For international sponsors |
| Smart photo tagging | Low | "sleeping", "playing", "eating" |

All future features follow same rule: **AI drafts, human confirms.**
