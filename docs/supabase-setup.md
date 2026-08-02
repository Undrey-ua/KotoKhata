# Supabase — підключення до БД

## Симптоми та причини

| Помилка | Причина | Рішення |
|---------|---------|---------|
| `P1001` на `db.*.supabase.co:5432` | Direct host — лише IPv6, мережа без IPv6 | Використовуй **pooler** |
| `tenant/user postgres.xxx not found` | Неправильний **pooler host** (aws-0 vs aws-1) | Скопіюй host з Dashboard |
| `password authentication failed` | Неправильний пароль | Reset password у Dashboard |

---

## Крок 0: Auth URLs

**Supabase Dashboard → Authentication → URL Configuration**

| Поле | Значення (local) |
|------|------------------|
| Site URL | `http://localhost:3000` (без `/` в кінці!) |
| Redirect URLs | `http://localhost:3000/**` |

> Supabase не приймає точний URL `.../auth/callback` — потрібен **wildcard** `/**`

Якщо все одно пише "Please provide a valid URL" — спробуй:
- `http://127.0.0.1:3000/**`
- або **варіант B** нижче (без redirect URLs)

### Варіант B — без підтвердження email (для розробки)

**Authentication → Providers → Email** → вимкни **Confirm email**

Потім у **Users** → Add user → `admin@kotoxata.org` + пароль → увімкни **Auto Confirm User**

---

```bash
supabase projects list
```

Kotoxata = **West EU (Ireland)** → pooler host: `aws-0-eu-west-1.pooler.supabase.com`

> Не припускай `eu-central-1` — регіон у кожного проєкту свій.

## Крок 1: Скопіюй URI з Dashboard

**Supabase Dashboard → Project Settings → Database → Connect**

### DATABASE_URL (для застосунку)

1. Tab: **Connection pooling**
2. Mode: **Transaction**
3. Port: **6543**
4. Скопіюй URI повністю

Має виглядати так:
```
postgresql://postgres.ukadaxgrwraopiybirxt:[PASSWORD]@aws-X-REGION.pooler.supabase.com:6543/postgres
```
Додай `?pgbouncer=true` в кінець, якщо немає.

### DIRECT_URL (для `prisma migrate`)

1. Tab: **Connection pooling**
2. Mode: **Session**
3. Port: **5432**
4. Скопіюй URI повністю

```
postgresql://postgres.ukadaxgrwraopiybirxt:[PASSWORD]@aws-X-REGION.pooler.supabase.com:5432/postgres
```

> **Не копіюй host з документації.** Нові проєкти часто на `aws-1-`, не `aws-0-`.

---

## Крок 2: Онови `.env`

```env
DATABASE_URL="..."   # Transaction, port 6543
DIRECT_URL="..."     # Session, port 5432
```

Переконайся:
- Username: `postgres.ukadaxgrwraopiybirxt` (не просто `postgres`)
- Host: **точно** з Dashboard (напр. `aws-1-eu-central-1.pooler.supabase.com`)
- Пароль без `@` — якщо є спецсимволи, згенеруй новий через **Reset database password**

---

## Крок 3: Міграція

```bash
npm run db:migrate
npm run db:seed
```

---

## Перевірка підключення

```bash
npx prisma db pull
```

Якщо OK — побачиш introspection (навіть якщо схема порожня).

---

## Service Role Key

У `.env` ключ `SUPABASE_SERVICE_ROLE_KEY` має бути з Dashboard → **API → service_role** (secret).

Anon key (`sb_publishable_...` або JWT з `"role":"anon"`) — **не** service role.

---

## Storage — фото тварин

**Dashboard → Storage → New bucket**

| Поле | Значення |
|------|----------|
| Name | `animal-media` (точно, без пробілів) |
| Public | **можна вимкнути** — застосунок віддає фото через `/api/media/[id]` |

> Якщо випадково створив bucket `bucket animal-media` — видали його; потрібен лише `animal-media`.

Після зміни `.env` з service role перезапусти `npm run dev`.

---

## Free tier + IPv6

Direct connection (`db.*.supabase.co`) на Free tier часто **IPv6-only**.
Pooler (`*.pooler.supabase.com`) працює через **IPv4** — використовуй його завжди для локальної розробки.
