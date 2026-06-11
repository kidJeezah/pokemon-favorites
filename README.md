# Pokémon Favorites

A small full-stack app for browsing the first 150 Pokémon and keeping a persistent list of favorites — in a cozy 8-bit sticker look.

- **Frontend:** React 19 + TypeScript + Vite, TanStack Query v5, Zustand, Tailwind v4 — deployed on **Vercel**
- **Backend:** Express 5 + TypeScript (Node 22), PostgreSQL via `pg` — deployed on **Render**
- **Data:** [PokéAPI](https://pokeapi.co/), proxied and cached by the backend

> Production URLs: _added on deploy (see [PLAN.md](PLAN.md) M9)_.
> Note: the Render free web service spins down after ~15 min idle — the first request can take 30–60 s. Warm it via `GET /healthz`.

## Quick start

Requires Node ≥ 22 and Docker (for local Postgres).

```bash
cp server/.env.example server/.env && cp client/.env.example client/.env
npm install
npm run db:up          # Postgres 16 in Docker (also creates the pokemon_test DB)
npm run dev            # client on :5173, server on :3001
```

`npm run db:migrate` is optional — the server also runs the idempotent migration on boot.

**No-Docker path:** point `DATABASE_URL` in `server/.env` at any reachable Postgres (e.g. a free [Neon](https://neon.tech) branch, with `?sslmode=require`); everything else is unchanged. Tests, however, expect the dockerized `pokemon_test` DB at `localhost:5432`.

```bash
npm run test           # server suite (real pokemon_test DB) + client suite
npm run lint
npm run build
```

## Architecture

The services/data-flow diagram lives in [`docs/architecture.mmd`](docs/architecture.mmd) (rendered in [PLAN.md §1](PLAN.md)). The short version:

```
React SPA (Vercel) ──HTTPS/JSON──▶ Express 5 API (Render) ──cache miss──▶ PokéAPI
        │                              │
        │ sprite <img> (direct)        │ SQL (pg)
        ▼                              ▼
GitHub raw sprites             Render PostgreSQL (favorites only)
```

- **All PokéAPI _data_ requests are proxied.** The SPA never calls pokeapi.co for JSON. The proxy trims ~250 KB upstream payloads to ~1 KB DTOs and caches them in an in-memory LRU (24 h TTL, promise-cached for stampede protection, errors never cached). `Cache-Control: public, max-age=86400` lets the browser cache too.
- **Sprite _images_ bypass the proxy** — `<img src>` goes straight to GitHub-hosted static sprites (`raw.githubusercontent.com/PokeAPI/sprites`), outside pokeapi.co. This keeps proxy bandwidth and PokéAPI Fair-Use load near zero (GitHub serves `max-age=300`, so it's about offloading, not long-lived caching).
- **PostgreSQL stores only the `favorites` table** — `pokemon_id` (natural PK), denormalized `name` so `GET /api/favorites` answers without touching PokéAPI, `created_at`.

### State ownership (frontend)

| State | Owner |
|---|---|
| Pokémon list / detail / evolution | TanStack Query (`staleTime: Infinity` — Gen-1 data is effectively immutable) |
| Favorites | TanStack Query (`staleTime: 30 s` — mutable) |
| `showFavoritesOnly`, `selectedPokemonId` | Zustand `uiStore` |

Favorites live in Query, **not** Zustand: Postgres is the source of truth and the FE copy is a cache; mirroring it into Zustand would create two caches to sync manually. Optimistic UI is a transient `setQueryData` write inside the mutation — the same cache the read path uses, with snapshot/rollback on error and an invalidation guarded to fire only for the last in-flight favorites mutation (so rapid toggles don't clobber each other). Zustand is deliberately small but load-bearing: the favorites filter, card selection, and evolution-strip navigation all flow through `uiStore`.

**Favorites-only view:** renders **directly from the favorites query**, not `list(150) ∩ favoriteIds`. Evolution-chain members with IDs > 150 (Sylveon #700, Espeon #196…) can be opened and favorited; intersection filtering would silently drop them. Locked by a test.

### API

All responses JSON; errors use the envelope `{ "error": { "code", "message" } }`.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/pokemon?limit=150&offset=0` | `{ count, results: [{ id, name, spriteUrl }] }` |
| GET | `/api/pokemon/:idOrName` | id, name, spriteUrl, types, abilities (incl. hidden flag) |
| GET | `/api/pokemon/:idOrName/evolution` | `{ chainId, stages: PokemonSummary[][] }` — inner array = branches (Eevee has 8); `stages.length === 1` means no evolutions |
| GET | `/api/favorites` | ordered `created_at DESC` |
| POST | `/api/favorites` | idempotent upsert — **201** created, **200** already existed |
| DELETE | `/api/favorites/:pokemonId` | **204 always** (idempotent) |
| GET | `/healthz` | `{ ok: true }` — also useful to warm a cold Render instance |

Idempotency is deliberate: favoriting is a toggle driven by optimistic mutations, so double-clicks and retries are normal traffic, not 409s.

## Environment variables

| Var | Where | Notes |
|---|---|---|
| `DATABASE_URL` | server | required; any Postgres connection string |
| `PORT` | server | default 3001 (Render injects its own) |
| `CORS_ORIGIN` | server | exact frontend origin; default `http://localhost:5173` |
| `POKEAPI_BASE_URL` | server | default `https://pokeapi.co/api/v2` |
| `UPSTREAM_TIMEOUT_MS` | server | default 5000 |
| `VITE_API_URL` | client | empty locally (Vite proxy, no CORS); the Render URL in prod. **Baked at build time** — changing it requires a redeploy |

### Search, infinite scroll & logs

- **Search and infinite scroll are client-side.** The 150-item list is one cheap request (~1 KB DTOs), so search filters the full list in memory (by name — slug or display form — or dex number), and "infinite scroll" is windowing: 20 cards mount initially, +20 as a sentinel scrolls into view. No extra network traffic, and search always covers all 150 regardless of how many cards are mounted.
- **Backend logs every data source** — each response is traceable in the server logs: `pokeapi request` with the full upstream URL/status/duration, `served from LRU cache` / `cache miss` per cache key, and `favorite upserted/listed/deleted` with `source: postgres`. Pretty-printed in dev, raw JSON in prod.

## Testing

- **Server** (14 tests): Vitest + supertest against `createApp()`, MSW for PokéAPI (the Eevee fixture is the real `evolution-chain/67` payload), and a **real Postgres test DB**. The test `DATABASE_URL` is hardcoded in `vitest.config.ts` (never read from `.env`) and the truncation helper refuses to run unless `current_database()` ends in `_test` — the dev DB can't be wiped by accident.
- **Client** (12 tests): Vitest + happy-dom + MSW with absolute URLs, exercising the real `apiFetch`. Covers the optimistic add + 500 rollback, list states, the favorites-only view including an ID > 150, and modal behavior.
- **CI** (GitHub Actions): lint + test + build with a `postgres:16-alpine` service container, so the upsert/idempotency tests run against real SQL.

## Deployment

- **Vercel (client):** Root Directory `client/`, Vite preset, `VITE_API_URL=https://<render-app>.onrender.com` (no trailing slash). SPA rewrites via `client/vercel.json`.
- **Render (server):** one-click via the Blueprint in [`render.yaml`](render.yaml) (dashboard → New → Blueprint → this repo) — creates the web service (build `npm install && npm run build -w server`, start `npm run start -w server`, Node 22, `/healthz` health check) and the free Postgres with `DATABASE_URL` wired. Migration runs idempotently on boot; a 3 s retry absorbs managed-Postgres wake-up. ⚠️ Free Render Postgres expires after 30 days — fallback is a free Neon branch (pure `DATABASE_URL` swap with `?sslmode=require`).
