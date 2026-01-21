# SaaS Backend (NestJS)

NestJS API for the SaaS Starter Kit. Provides JWT auth, org membership, and invite flows backed by Prisma/Postgres.

## Tech

- NestJS 11
- Prisma 7 + Postgres
- JWT access/refresh tokens (refresh token stored in HttpOnly cookie)

## Features

- Auth: register, login, refresh, logout
- Orgs: create, list my orgs, get active org, list members
- Invites: create invite, accept invite
- User: current user profile

## Setup

Install dependencies:

```bash
npm install
```

Configure environment variables in `.env`:

- `DATABASE_URL` (Postgres connection string)
- `PORT` (defaults to 3000)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL_SECONDS`, `JWT_REFRESH_TTL_SECONDS`
- `COOKIE_SECURE`, `COOKIE_SAMESITE`, `COOKIE_DOMAIN`
- `REFRESH_COOKIE_NAME`

Run migrations and generate the Prisma client:

```bash
npx prisma migrate dev
```

## Development

```bash
npm run start:dev
```

The API listens on `PORT` (default `3000`). CORS is enabled for `http://localhost:3001` (see `src/main.ts`).

## API routes (current)

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /user/me`
- `POST /orgs`
- `GET /orgs/mine`
- `GET /orgs/active`
- `GET /orgs/:orgId`
- `GET /orgs/:orgId/members`
- `POST /orgs/:orgId/invites`
- `POST /orgs/invites/accept`

## Scripts

```bash
npm run lint
npm run test
npm run start:prod
```

## Prisma

Schema lives in `prisma/schema.prisma`. The generated client is output to `src/prisma/generated`.
