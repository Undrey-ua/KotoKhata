# KotoXata — Approved Decisions

> Затверджено перед Phase 0. Зміни — лише через оновлення цього документа.

---

## 1. Платежі (MVP)

**Рішення:** Ручний банківський переказ + підтвердження адміністратором.

| Аспект | Деталі |
|--------|--------|
| Оформлення | Користувач обирає суму/опіку на сайті → отримує реквізити притулку |
| Підтвердження | Адмін бачить заявку в CRM → позначає «Оплачено» вручну |
| Автоматизація | LiqPay / Stripe — **Phase 2** |
| CRM | Черга заявок: `PENDING` → `CONFIRMED` / `REJECTED` |

**Flow:**
```
Guest/Sponsor → форма на сайті → Sponsorship/Donation (status: PENDING)
    → показ IBAN + призначення платежу
    → Admin підтверджує в CRM
    → status: COMPLETED → оновлення funding → нотифікація опікуну в Telegram
```

---

## 2. Перший притулок

**Рішення:** Один притулок на старті — **Котохата**.

| Поле | Значення |
|------|----------|
| Назва | Котохата |
| Slug | `kotoxata` |
| URL (MVP) | `petshelter.app/s/kotoxata/...` |

Архітектура multi-tenant залишається (`shelterId` на всіх таблицях), але UI/онбординг не будуємо до Phase 3. Seed і конфіг — один притулок.

---

## 3. Домен

**Рішення:** `petshelter.app` (може змінитись до deploy).

| Середовище | URL |
|------------|-----|
| Production | `https://petshelter.app` |
| Staging | `https://staging.petshelter.app` |
| SaaS (Phase 3) | `{slug}.petshelter.app` |

Назва продукту в UI: **KotoXata** / **Котохата**. Домен — нейтральний для майбутнього SaaS.

---

## 4. Telegram-боти

**Рішення:** Одна пара платформних ботів для всіх притулків.

| Bot | Призначення |
|-----|-------------|
| `@...SponsorBot` | Опікуни — Tamagotchi UX |
| `@...VolunteerBot` | Волонтери — швидкі дії |

Притулок визначається з `ShelterMember` після `/link`. Per-shelter bot tokens — **Phase 3 (SaaS)**.

---

## 5. Мови

**Рішення:** Українська + англійська з першого дня.

| Аспект | Деталі |
|--------|--------|
| Бібліотека | `next-intl` |
| Default locale | `uk` |
| Supported | `uk`, `en` |
| URL | `/uk/...`, `/en/...` або cookie/header (визначимо в Phase 0) |
| Telegram | UK за замовчуванням; EN якщо `User.locale = en` |
| AI-генерація | Мова = locale автора новини |
| CRM | Перемикач UA/EN в header |

Контент тварин (опис, історії) — мова автора; переклад контенту — **Phase 4**.

---

## Summary Table

| # | Question | Decision |
|---|----------|----------|
| 1 | Payments MVP | Manual bank transfer |
| 2 | First tenant | Котохата (`kotoxata`) |
| 3 | Domain | `petshelter.app` |
| 4 | Telegram bots | One platform pair |
| 5 | Languages | UA + EN |

**Architecture status:** ✅ Approved — ready for Phase 0 implementation.
