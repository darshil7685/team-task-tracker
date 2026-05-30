# Team Task Tracker API

A REST API for a team-based task tracker with JWT authentication, role-based access control, Redis caching, and containerized deployment.

**Stack:** Node.js · Express · MongoDB (Mongoose) · Redis · Docker

## Quick Start

```bash
docker compose up --build
```

The API will be available at **http://localhost:3000**

---

## Environment Variables

Copy `.env.example` to `.env` for local development outside Docker:

## Caching Strategy

### What is cached
Task list responses are cached per unique query signature (organization + role-scoped filters + pagination). Cache keys follow the pattern:

```
tasks:assignee:{assigneeId}:{orgId}:{base64(filters)}   # assignee-scoped
tasks:list:{orgId}:{base64(filters)}                    # full org list (admin/manager)
```
### Cache TTL
Default 5 minutes (configurable via `CACHE_TTL`).

### Invalidation
Cache is invalidated eagerly on every mutation (create / update / status change / delete). The `invalidateTaskCaches()` function uses Redis with glob patterns to delete all affected keys in one sweep:

1. All org-level list caches (`tasks:list:{orgId}:*`)
2. All assignee-scoped caches for the affected user (`tasks:assignee:{id}:{orgId}:*`)

If Redis is unavailable, all cache operations **fail silently** — the API degrades gracefully to hitting MongoDB directly.

---

## Database Schema Description

### Collections

**organizations**
```
_id, name (unique), description, createdAt, updatedAt
```

**users**
```
_id, name, email (unique), password (hashed), role, organization (ref),
refreshTokens[], isActive, createdAt, updatedAt

Indexes: { email }, { organization, role }
```

**tasks**
```
_id, title, description, priority, status, assignee (ref User),
due_date, organization (ref), createdBy (ref User), completedAt,
createdAt, updatedAt

Indexes:
  { status, organization }
  { assignee, organization }
  { due_date, organization }
  { priority, organization }
  { organization, status, assignee, due_date }  ← compound
```

### Design Decision: Compound Index on Tasks

The compound index `{ organization, status, assignee, due_date }` was chosen to cover the most common query pattern: "give me all TODO tasks assigned to user X in org Y, sorted by due date." MongoDB can use the leading fields of a compound index for prefix queries, meaning this single index also serves queries that filter on just `{ organization }` or `{ organization, status }`.

