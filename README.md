# From Shloka to Software

Gamified Sanskrit learning platform. Learn Sanskrit through lessons, track streaks, and compete on leaderboards.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + custom design system |
| Database | PostgreSQL via Prisma ORM |
| Auth | Server Actions + argon2 + httpOnly session cookie |
| Validation | Zod |

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in `DATABASE_URL` with your PostgreSQL connection string.

**Local Postgres (quick option):**
```bash
# macOS
brew install postgresql@16
brew services start postgresql@16
createdb sanskrit_dev

# or use Docker
docker run --name sanskrit-pg -e POSTGRES_DB=sanskrit_dev -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:16
```

Your `DATABASE_URL` will be:
```
postgresql://postgres:password@localhost:5432/sanskrit_dev
```

### 3. Run database migrations

```bash
npm run db:generate   # generate Prisma client
npm run db:migrate    # apply schema to your database
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
fromshlokatosoftware/
├── app/
│   ├── layout.tsx              # Root layout + fonts + metadata
│   ├── globals.css             # Design system (colors, tokens, components)
│   ├── page.tsx                # Homepage — Sanskrit vowel onboarding
│   ├── actions/
│   │   └── auth.ts             # Server Actions: register, login, logout
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── (app)/                  # Authenticated shell (sidebar + bottom nav)
│       ├── layout.tsx
│       ├── dashboard/page.tsx
│       ├── learn/page.tsx
│       ├── leaderboard/page.tsx
│       ├── progress/page.tsx
│       └── achievements/page.tsx
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── session.ts              # getSession() / requireSession()
│   └── validations.ts          # Zod schemas for auth forms
├── prisma/
│   └── schema.prisma           # Database schema
├── .env.example                # All required env vars documented
└── next.config.ts              # Security headers
```

---

## Auth Architecture

- **No localStorage** — sessions are stored as `httpOnly SameSite=strict` cookies.
- Passwords are hashed with **argon2id** (not bcrypt).
- All form input is validated with **Zod** on the server before touching the database.
- Login uses constant-time password comparison to prevent timing attacks.

---

## Database Commands

```bash
npm run db:generate   # regenerate Prisma client after schema changes
npm run db:migrate    # create and apply a new migration
npm run db:studio     # open Prisma Studio (visual DB browser)
```

---

## What's Not Here Yet

- PvP battles (Socket.io — coming next)
- Leaderboard backend (Redis sorted sets — coming next)
- Google OAuth
- Real lesson/question content (seed data TBD)
