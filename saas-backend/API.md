# API Guide

Base URL (local): `http://localhost:3000`

All requests/response bodies are JSON unless stated otherwise.

## Auth overview

- Access tokens are JWTs sent via `Authorization: Bearer <token>`.
- Refresh token is stored in an HttpOnly cookie (name from `REFRESH_COOKIE_NAME`, default `refresh_token`).
- Endpoints that require org context need `X-Org-Id` header.

## Auth endpoints

### Register

`POST /auth/register`

Body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "user": { "id": "...", "email": "user@example.com" },
  "accessToken": "<jwt>"
}
```

### Login

`POST /auth/login`

Body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "user": { "id": "...", "email": "user@example.com" },
  "accessToken": "<jwt>"
}
```

### Refresh

`POST /auth/refresh`

- Uses the refresh cookie; no body required.
- Rotates the refresh cookie and returns a new access token.

Response:

```json
{
  "accessToken": "<jwt>"
}
```

### Logout

`POST /auth/logout`

- Uses the refresh cookie; clears it on success.

Response:

```json
{ "ok": true }
```

## User endpoint

### Current user

`GET /user/me`

Requires: `Authorization: Bearer <accessToken>`

## Organization endpoints

### Create org

`POST /orgs`

Requires: `Authorization: Bearer <accessToken>`

Body:

```json
{ "name": "Acme" }
```

### List my orgs

`GET /orgs/mine`

Requires: `Authorization: Bearer <accessToken>`

### Active org context

`GET /orgs/active`

Requires:

- `Authorization: Bearer <accessToken>`
- `X-Org-Id: <orgId>`

Returns:

```json
{ "orgId": "...", "role": "OWNER" }
```

### Get org by id

`GET /orgs/:orgId`

Requires: `Authorization: Bearer <accessToken>`

### List members

`GET /orgs/:orgId/members`

Requires:

- `Authorization: Bearer <accessToken>`
- `X-Org-Id: <orgId>`
- Org role OWNER or ADMIN

### Create invite

`POST /orgs/:orgId/invites`

Requires:

- `Authorization: Bearer <accessToken>`
- `X-Org-Id: <orgId>`
- Org role OWNER or ADMIN

Body:

```json
{ "email": "invitee@example.com", "role": "MEMBER" }
```

### Accept invite

`POST /orgs/invites/accept`

Body:

```json
{ "token": "<inviteToken>", "password": "password123" }
```

## Example curl flow

Register (store refresh cookie):

```bash
curl -i -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  http://localhost:3000/auth/register
```

Refresh access token (send refresh cookie):

```bash
curl -i -b cookies.txt \
  http://localhost:3000/auth/refresh
```

Create org (replace ACCESS_TOKEN):

```bash
curl -i \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme"}' \
  http://localhost:3000/orgs
```
