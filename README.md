# SaaS Starter Kit

Full-stack starter with a Next.js frontend and NestJS backend, wired for auth, orgs, and subscriptions with Prisma/Postgres.

## Repo layout

- `saas-frontend/` Next.js 16 app (React 19, Tailwind v4)
- `saas-backend/` NestJS 11 API (Prisma, JWT auth, Postgres)

## Requirements

- Node.js + npm
- Postgres (local or remote)

## Setup

Install dependencies for each package:

```bash
npm -C saas-backend install
npm -C saas-frontend install
```

Configure environment variables:

- `saas-backend/.env`
  - `DATABASE_URL` for Postgres
  - JWT and cookie settings used by the API
  - `PORT` (defaults to 3000)
- `saas-frontend/.env.local`
  - `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3000`)

Run database migrations (first time or after schema changes):

```bash
npx -C saas-backend prisma migrate dev
```

## Development

Start the API:

```bash
npm -C saas-backend run start:dev
```

Start the frontend on port 3001 (API CORS allows `http://localhost:3001`):

```bash
npm -C saas-frontend run dev -- -p 3001
```

## Useful scripts

Root scripts:

```bash
npm run format
npm run lint
```

Backend scripts:

```bash
npm -C saas-backend run lint
npm -C saas-backend run test
npm -C saas-backend run start:prod
```

Frontend scripts:

```bash
npm -C saas-frontend run lint
npm -C saas-frontend run build
npm -C saas-frontend run start
```

## Notes

- The backend enables CORS for `http://localhost:3001` (see `saas-backend/src/main.ts`).
- Prisma client output is checked in under `saas-backend/src/prisma/generated`.
