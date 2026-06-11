# Pokémon Favorites — Implementation Plan

Greenfield take-home in `/Users/kidjeezah/fireflyai`. React 19 + TypeScript + Vite + Zustand + TanStack Query v5 + Tailwind v4 + Vitest on the frontend (Vercel); Express 5 + TypeScript + PostgreSQL on the backend (**Render**). One git repo, npm workspaces, two packages: `client/` and `server/`.

> **Tracking:** milestones in §9 use checkboxes — tick them as steps complete. Milestone 0 (Render pipeline validation via the forked `render-examples/express-hello-world`) is the **last step before implementation**.

---

## 1. Overview & Architecture

Source of truth for this diagram: [`docs/architecture.mmd`](docs/architecture.mmd) — keep both in sync when the architecture changes.

```mermaid
flowchart LR
    subgraph client["Frontend — React SPA on Vercel"]
        UI["React UI<br/>(Tailwind components)"]
        TQ["TanStack Query<br/>server-state cache"]
        ZS["Zustand store<br/>UI state: favorites filter,<br/>selected Pokémon"]
        UI <--> TQ
        UI <--> ZS
    end

    subgraph render["Render — Web Service (pipeline validated via fork of render-examples/express-hello-world)"]
        subgraph api["Backend — Express 5 API (Node.js + TypeScript)"]
            PROXY["PokéAPI proxy routes<br/>GET /api/pokemon?limit=150<br/>GET /api/pokemon/:id<br/>GET /api/pokemon/:id/evolution"]
            FAV["Favorites routes<br/>GET /api/favorites<br/>POST /api/favorites<br/>DELETE /api/favorites/:pokemonId"]
            CACHE[("In-memory LRU cache<br/>trimmed PokéAPI responses, 24h TTL")]
            PROXY <--> CACHE
        end
    end

    PG[("Render PostgreSQL (managed)<br/>favorites table<br/>(only favorites stored)")]
    POKE["PokéAPI<br/>pokeapi.co/api/v2"]
    SPRITES["Sprite images (static)<br/>raw.githubusercontent.com<br/>PokeAPI/sprites"]

    TQ -- "list / detail / evolution<br/>(HTTPS, JSON)" --> PROXY
    TQ -- "add / remove / list favorites<br/>(HTTPS, JSON)" --> FAV
    UI -- "sprite images, direct<br/>(bypasses proxy)" --> SPRITES
    PROXY -- "cache miss only" --> POKE
    FAV -- "SQL (pg)" --> PG
```

- The SPA never calls pokeapi.co for JSON; all **data** requests go through the Express proxy, which trims ~250KB upstream payloads to ~1KB DTOs and caches them (LRU, 24h TTL).
- Sprite **images** bypass the proxy: `<img src>` hits GitHub raw directly. Rationale: keeps proxy bandwidth and PokéAPI Fair-Use load near zero (note: GitHub raw serves `max-age=300`, so this is about offloading, not long-lived caching). State in the README that all PokéAPI data requests are proxied; images are static GitHub-hosted assets outside pokeapi.co.
- PostgreSQL stores **only** the `favorites` table.

## 2. Key Decisions & Assumptions

- **Backend host: Render** (decided) — long-lived process keeps the in-memory LRU cache and classic `pg.Pool` working as designed; serverless would evaporate the cache per cold start. Pipeline validated up front by deploying a fork of `render-examples/express-hello-world` (§9 M0).
- **Database: Render PostgreSQL** (same platform, one dashboard). ⚠️ Render's free Postgres instance **expires after 30 days** — flag in README; fallback is Neon free tier, a pure `DATABASE_URL` swap (the code is host-agnostic).
- **Express 5** (npm `latest`): rejected async handlers auto-forward to the error middleware (no `asyncHandler` wrapper), and `req.query` is a read-only getter — the zod validation middleware writes parsed values to `res.locals.validated`, never reassigns `req.*`.
- **Single user, no auth** — one global favorites list; no `user_id` column (future path in README: new migration, composite PK `(user_id, pokemon_id)`).
- "First 150 Pokémon" = National-dex IDs **1–150** (`?limit=150&offset=0`, ends at Mewtwo; Mew #151 excluded — literal reading; including Mew is a one-character change, note in README).
- PokéAPI Gen-1 data is effectively immutable → aggressive caching (`staleTime: Infinity` client-side, 24h LRU server-side).
- **Detail view = modal, no react-router** — keeps scroll/filter state trivially intact; tradeoff: no deep links (migration path: swap `selectedPokemonId` for a `/pokemon/:id` route). `vercel.json` SPA rewrite kept anyway (harmless, future-proofs).
- Evolution DTO: **flattened `stages: PokemonSummary[][]`** (server-side flattening) — FE renders a left-to-right strip; recursion stays where the data is.
- Package names `client/`/`server/` to match workspace scripts (`-w client` / `-w server`). Server port **3001**; locally the client uses the Vite proxy with empty `VITE_API_URL` (no CORS in dev); absolute URL in prod.
- Node ≥ 22; Docker for local Postgres (README documents a no-Docker path: point `DATABASE_URL` at any Postgres, e.g. a free Neon branch).

## 3. Repo & Project Structure

```
fireflyai/
├── package.json                  # private, workspaces: ["client","server"], orchestration scripts
├── package-lock.json
├── tsconfig.base.json            # strict, noUncheckedIndexedAccess, verbatimModuleSyntax
├── eslint.config.js              # flat config: tseslint recommended; react-hooks scoped to client/**
├── .prettierrc.json
├── .gitignore                    # node_modules, dist, .env, coverage
├── docker-compose.yml            # Postgres 16 only (+ init script creating pokemon_test)
├── README.md
├── PLAN.md                       # this file — tick milestones as they land
├── docs/
│   └── architecture.mmd          # services/data-flow diagram (source for §1)
├── .github/workflows/ci.yml
├── client/
│   ├── package.json              # name: "client"
│   ├── vite.config.ts            # react + @tailwindcss/vite plugins, /api dev proxy, vitest block
│   ├── vercel.json               # SPA rewrites
│   ├── tsconfig.json             # extends ../tsconfig.base.json; paths "@/*" -> "src/*"
│   ├── .env.example              # VITE_API_URL= (empty locally; Render URL in prod)
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── index.css             # @import "tailwindcss"; @theme tokens
│       ├── app/
│       │   ├── App.tsx           # header + FavoritesFilter + PokemonList + PokemonDetailModal
│       │   ├── providers.tsx     # QueryClientProvider
│       │   └── queryClient.ts
│       ├── features/
│       │   ├── pokemon-list/
│       │   │   ├── components/   # PokemonList.tsx(+test), PokemonCard.tsx(+test)
│       │   │   ├── hooks/        # usePokemonList.ts, useDisplayedPokemon.ts
│       │   │   ├── api.ts        # fetchPokemonList()
│       │   │   └── index.ts
│       │   ├── pokemon-detail/
│       │   │   ├── components/   # PokemonDetailModal.tsx(+test), TypeBadge, AbilityList, EvolutionChain
│       │   │   ├── hooks/        # usePokemonDetail.ts, useEvolutionChain.ts
│       │   │   ├── api.ts        # fetchPokemonDetail(), fetchEvolutionChain()
│       │   │   └── index.ts
│       │   └── favorites/
│       │       ├── components/   # FavoriteToggle.tsx(+test), FavoritesFilter.tsx
│       │       ├── hooks/        # useFavorites.ts, useToggleFavorite.ts(+test)
│       │       ├── api.ts        # fetchFavorites(), addFavorite(), removeFavorite()
│       │       └── index.ts
│       ├── shared/
│       │   ├── api/              # client.ts (apiFetch + ApiError, +test), queryKeys.ts
│       │   ├── types/pokemon.ts  # PokemonListItem, Pokemon, EvolutionStages, Favorite, PokemonType
│       │   ├── store/uiStore.ts  # Zustand: showFavoritesOnly, selectedPokemonId (+test)
│       │   ├── components/       # Spinner, ErrorMessage, EmptyState
│       │   └── lib/              # typeColors.ts, sprites.ts (spriteUrl/artworkUrl by id), formatName.ts
│       └── test/
│           ├── setup.ts          # jest-dom, MSW lifecycle, Zustand reset
│           ├── msw/              # server.ts, handlers.ts (absolute URLs, all 6 endpoints)
│           └── utils.tsx         # renderWithProviders (fresh QueryClient, retry: false)
└── server/
    ├── package.json              # name: "server"
    ├── tsconfig.json             # extends base; module NodeNext, outDir dist
    ├── vitest.config.ts          # fileParallelism: false; env: test DATABASE_URL; globalSetup
    ├── .env.example
    ├── src/
    │   ├── index.ts              # bootstrap: env, migrate-on-boot, app.listen(env.PORT)
    │   ├── app.ts                # createApp(): middleware + routes, no .listen (supertest-able)
    │   ├── config/env.ts         # dotenv + zod-validated env, fail-fast
    │   ├── db/
    │   │   ├── pool.ts           # pg Pool from DATABASE_URL (max: 5, ssl in prod, connectionTimeoutMillis)
    │   │   ├── migrate.ts        # executes sql/001_init.sql idempotently
    │   │   └── sql/              # 001_init.sql, init-test-db.sql (mounted into docker-entrypoint-initdb.d)
    │   ├── routes/               # pokemon.routes.ts, favorites.routes.ts
    │   ├── controllers/          # pokemon.controller.ts, favorites.controller.ts
    │   ├── services/             # pokeapi.service.ts, evolution.service.ts, favorites.service.ts
    │   ├── middleware/           # validate.ts (zod -> res.locals.validated), error-handler.ts, not-found.ts
    │   ├── lib/                  # http-error.ts, cache.ts (lru-cache)
    │   └── types/                # dto.ts, pokeapi.ts (minimal upstream shapes)
    └── tests/
        ├── favorites.test.ts
        ├── pokemon.test.ts
        ├── evolution.test.ts
        ├── global-setup.ts       # runs migrate() against the test DB
        └── helpers/              # test-db.ts (guarded truncate), msw-server.ts (PokéAPI fixtures)
```

Rules: features never import each other's internals — only via `index.ts` or `shared/`. Tests colocated with units; cross-cutting infra in `src/test/` (client) and `tests/helpers/` (server).

## 4. Backend Plan

**Stack:** Express 5, TypeScript ESM, Node 22, native `fetch`. Deps: `express@^5`, `pg`, `zod`, `lru-cache`, `cors`, `helmet`, `pino-http`, `dotenv`. Dev: `typescript`, `tsx`, `vitest`, `supertest`, `msw`.

**Layering:** `route → validate(zod) → controller → service → (pg | PokéAPI) → DTO → response`. Controllers never touch `pg`/`fetch`; services never touch `req`/`res`. Raw `pg` with parameterized queries — no ORM (one table; the `ON CONFLICT` SQL *is* the interesting part).

### 4.1 API contract (all responses JSON; error envelope `{ "error": { "code", "message" } }`)

| Method | Path | Request | 2xx Response | Errors |
|---|---|---|---|---|
| GET | `/api/pokemon?limit=150&offset=0` | `limit` int 1–150 (default 150), `offset` int ≥0 (default 0) | `{ count, results: PokemonSummary[] }`; `PokemonSummary = { id, name, spriteUrl }` | 400 `VALIDATION_ERROR`, 502 `UPSTREAM_ERROR` |
| GET | `/api/pokemon/:idOrName` | param `/^[a-z0-9-]+$/i` | `PokemonDetail = { id, name, spriteUrl, types: string[], abilities: { name, isHidden }[] }` | 400, 404 `NOT_FOUND`, 502 |
| GET | `/api/pokemon/:idOrName/evolution` | same param | `{ chainId, stages: PokemonSummary[][] }` — ordered stages; inner array = branches (Eevee) | 400, 404, 502 |
| GET | `/api/favorites` | — | `{ favorites: FavoriteDto[] }`, `FavoriteDto = { pokemonId, name, createdAt }`, ordered `created_at DESC` | — |
| POST | `/api/favorites` | `{ pokemonId: int 1–1025, name: /^[a-z0-9-]+$/ ≤100 }` | `FavoriteDto`; **201** created, **200** already existed (idempotent upsert) | 400 |
| DELETE | `/api/favorites/:pokemonId` | param int ≥1 | empty body, **204 always** (idempotent; `rowCount` not checked) | 400 |
| GET | `/healthz` | — | `{ ok: true }` | — |

- Idempotency rationale: favoriting is a toggle driven by optimistic mutations — double-clicks/retries are normal, not 409s; the DELETE postcondition holds either way per HTTP spec.
- A no-evolution Pokémon returns `stages` of length 1; FE renders "No evolutions" when `stages.length === 1`.
- Accepted tradeoff (state in README): POST trusts the client-supplied `name` after zod shape/range validation — a hand-crafted `{pokemonId: 999, name: "whatever"}` persists as sent. Fine for a single-user take-home; the strict fix (resolve name via the cached detail fetch) is documented, not built.
- The official-artwork URL is **not** in the DTO — the FE builds it from `id` via `shared/lib/sprites.ts` (same helper as list sprites). `height`/`weight` deliberately omitted (not required, not rendered).

### 4.2 DB schema — `server/src/db/sql/001_init.sql` (the entire schema)

```sql
CREATE TABLE IF NOT EXISTS favorites (
  pokemon_id  INTEGER     PRIMARY KEY,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- `pokemon_id` (the PokéAPI id) is the natural PK and the upsert dedup key; no surrogate id.
- `name` denormalized so `GET /api/favorites` answers from Postgres alone — zero PokéAPI calls.
- Migration = idempotent `migrate.ts` run **on boot** (reads the file, `pool.query`); `IF NOT EXISTS` makes reruns safe. No migration framework for one table.
- Core queries in `favorites.service.ts`: `INSERT INTO favorites (pokemon_id, name) VALUES ($1, $2) ON CONFLICT (pokemon_id) DO NOTHING RETURNING *` (row back → 201; else SELECT existing → 200); `DELETE FROM favorites WHERE pokemon_id = $1`; `SELECT * FROM favorites ORDER BY created_at DESC`. Thin `mapRow` for snake_case → camelCase.
- `pool.ts`: `pg.Pool({ max: 5, connectionTimeoutMillis: 10_000, ssl: prod })` + one retry on boot-time migrate (absorbs managed-Postgres wake-up latency).

### 4.3 Proxy + caching (`pokeapi.service.ts`, `lib/cache.ts`) — two explicit layers

- `fetchUpstream<T>(path)`: native `fetch` with `AbortSignal.timeout(env.UPSTREAM_TIMEOUT_MS ?? 5000)`, base `env.POKEAPI_BASE_URL`, descriptive `User-Agent`.
- Error mapping (inherited by all proxy routes): upstream 404 → `HttpError(404, 'NOT_FOUND')`; timeout/network/5xx → `HttpError(502, 'UPSTREAM_ERROR')`.
- **Cache layer 1 — trimmed upstream shapes** (one `lru-cache`, `max: 1000`, `ttl: 24h`):
  - `up:pokemon:{lowercased idOrName}` → `{ id, name, abilities, types, sprites, species }` (~1KB; **keeps `species`** — the evolution service needs it, see §4.4)
  - `up:species:{id}` → `{ evolutionChainId }`
  - `list:{limit}:{offset}` → mapped list DTO (no second consumer, safe to cache final shape)
- **Cache layer 2 — composed DTO:** `chain:{chainId}` → `{ chainId, stages }`. Keying by `chainId` (not by the requested name/id) means `pikachu`, `25`, `raichu`, and `pichu` all share one cached chain.
- Controllers map cached upstream shapes to **public DTOs per response** (e.g. drop `species` from `PokemonDetail`). The cache never stores the public detail DTO.
- The cache stores the **in-flight Promise** — concurrent requests share one upstream call (stampede protection); rejected promises are evicted so errors are never cached.
- Set `Cache-Control: public, max-age=86400` on proxy responses so the browser layer benefits too.
- List DTO: derive `id` from `results[].url` and template `spriteUrl` — the 150-item list renders with images in **one** request, no N+1.
- Sprites are **never proxied**.

### 4.4 Evolution chain resolution (`evolution.service.ts`)

1. Reuse the layer-1 `up:pokemon:{idOrName}` fetch → read `species.url` (handles both `25` and `pikachu` uniformly).
2. `GET {species.url}` (cached as `up:species:{id}`) → parse `evolution_chain.url` for the chain id.
3. On `chain:{chainId}` miss: `GET /evolution-chain/{id}`, recursively walk `chain`: depth = stage index; per node collect `species.name` + id parsed from `species.url`; siblings in `evolves_to` land in the same stage array (Eevee → `[[eevee], [vaporeon, jolteon, flareon, espeon, umbreon, leafeon, glaceon, sylveon]]` — all 8 branches).
4. Map each species to `PokemonSummary` with `spriteUrl` built by ID — no extra fetches per evolution (species id == default pokemon id for this scope).

Three sequential upstream fetches worst case, then everything is warm.

### 4.5 Validation & error handling

- `middleware/validate.ts`: zod middleware factory `validate(schema, 'body'|'query'|'params')`; coerces (`z.coerce.number()`), writes parsed values to **`res.locals.validated`** (Express 5: `req.query` is a read-only getter — never reassign); failure → `HttpError(400, 'VALIDATION_ERROR')` with flattened issues.
- Middleware order in `app.ts`: `helmet()` → `cors({ origin: corsOrigins(env), methods: ['GET','POST','DELETE'] })` → `pino-http` (silent in test) → `express.json()` → routers + `/healthz` → `not-found` → central `error-handler` (`HttpError` → its status/code; else log + `500 INTERNAL`). Express 5 forwards rejected async handlers to the error middleware automatically — no wrapper needed.
- CORS: exact prod origin from `CORS_ORIGIN` (Vercel preview deploys are **not** supported by default — their URLs are per-deploy; if needed later, an origin callback matching `/^https:\/\/<project>-.*\.vercel\.app$/` is the documented extension).
- `config/env.ts`: zod-parsed `process.env`, fail-fast on boot; no `process.env` access elsewhere. Vars: `DATABASE_URL` (required), `PORT` (default 3001), `POKEAPI_BASE_URL`, `CORS_ORIGIN` (default `http://localhost:5173`), `UPSTREAM_TIMEOUT_MS`, `NODE_ENV`.

### 4.6 Backend tests

Vitest + supertest against `createApp()`, MSW for upstream, **real `pokemon_test` Postgres DB**, `fileParallelism: false` (truncation must not race). Wiring that makes it run out of the box:

- `docker-compose.yml` mounts `server/src/db/sql/init-test-db.sql` (`CREATE DATABASE pokemon_test;`) into `/docker-entrypoint-initdb.d/` — created on first volume init (`docker compose down -v` to re-trigger).
- Test `DATABASE_URL` is **hardcoded in `vitest.config.ts` `env`** (`postgres://pokemon:pokemon@localhost:5432/pokemon_test`) — never read from `.env`, so the dev DB can't be truncated by accident.
- `tests/global-setup.ts` runs `migrate()` against the test DB (the table exists before any suite).
- `tests/helpers/test-db.ts` truncates in `beforeEach` and **refuses to run unless `current_database()` ends in `_test`**.
- CI service container sets `POSTGRES_DB: pokemon_test`.

Cases:
1. `POST /api/favorites creates a favorite → 201 with persisted DTO and a row in the table`
2. `POST /api/favorites with existing pokemonId is idempotent → 200, table count stays 1`
3. `DELETE /api/favorites/:pokemonId → 204; repeated DELETE also 204`
4. `GET /api/favorites returns favorites ordered created_at DESC`
5. `GET /api/pokemon/:idOrName returns slimmed DTO; second request served from cache (MSW call count === 1)`; plus upstream 404 → 404 `NOT_FOUND`, upstream 500 → 502 `UPSTREAM_ERROR`
6. `GET /api/pokemon/eevee/evolution flattens the real 8-branch chain → stages[1].length === 8` (fixture = actual `evolution-chain/67` payload, not trimmed)

Exported `cache.clear()` runs between proxy tests.

## 5. Frontend Plan

### 5.1 State ownership

| State | Owner | Key |
|---|---|---|
| Pokémon list (150) | TanStack Query | `['pokemon','list']` |
| Pokémon detail | TanStack Query | `['pokemon','detail',id]` |
| Evolution stages | TanStack Query | `['pokemon','evolution',id]` |
| Favorites | TanStack Query | `['favorites']` |
| `showFavoritesOnly`, `selectedPokemonId` | Zustand `uiStore` | — |

Favorites live in Query, **not** Zustand: Postgres is the source of truth and the FE copy is a cache; mirroring into Zustand creates two caches to sync manually. Optimistic UI is a transient `setQueryData` write inside the mutation — same cache the read path uses. Zustand is deliberately small but **load-bearing**: the favorites filter, card selection, *and* evolution-strip navigation all flow through `uiStore` (`{ showFavoritesOnly, selectedPokemonId, toggleFavoritesFilter, selectPokemon, clearSelection }`, `null` = modal closed). Put this ownership rationale verbatim in the README — it's the headline architecture decision.

### 5.2 Components & hooks

| Name | Responsibility |
|---|---|
| `App` | Sticky header (title + `FavoritesFilter`), `PokemonList`, conditional `PokemonDetailModal` |
| `PokemonList` | Responsive grid; owns loading/error/empty branches. **Client-side infinite scroll**: the 150 list is still one request, but only 20 cards mount initially, +20 as an IntersectionObserver sentinel scrolls into view (resets on search/filter change). No virtualization needed |
| `PokemonCard` | Sprite (via `sprites.ts` helper, `loading="lazy"`), display name, id, embedded `FavoriteToggle`; click → `selectPokemon(id)` |
| `PokemonDetailModal` | Accessible dialog (focus trap, Esc/overlay close): official artwork (URL built from `id` by `sprites.ts`), `TypeBadge`s, `AbilityList`, `EvolutionChain` |
| `TypeBadge` / `AbilityList` | Colored type pill via `typeColors`; ability names with hidden flag |
| `EvolutionChain` | Renders `stages` as horizontal strip with arrows; clicking a stage member calls `selectPokemon(id)`; "No evolutions" when `stages.length === 1` |
| `FavoriteToggle` | Heart button; `useFavorites().isFavorite(id)` + `useToggleFavorite().toggle(p)`; `e.stopPropagation()` |
| `FavoritesFilter` | Switch bound to `showFavoritesOnly`; shows favorites count from `useFavorites` |
| `SearchBox` | Header input bound to `uiStore.searchQuery`; client-side match by name (slug or display form) or dex number |
| `usePokemonList` / `usePokemonDetail(id)` / `useEvolutionChain(id)` | `useQuery` wrappers; detail/evolution `enabled: id !== null` |
| `useFavorites` | `useQuery(['favorites'])` + derived `favoriteIds: Set<number>` + `isFavorite(id)` |
| `useToggleFavorite` | Add/remove `useMutation`s behind one `toggle(pokemon)`, optimistic + rollback |
| `useDisplayedPokemon` | The list the grid renders — see filter semantics below |

**Favorites filter semantics (important):** when `showFavoritesOnly` is on, `useDisplayedPokemon` renders **directly from the favorites query** (`{pokemonId, name}` → `PokemonListItem` via the sprite-by-id helper), *not* the intersection `list(150) ∩ favoriteIds`. Evolution members with IDs > 150 (Sylveon 700, Steelix 208, Pichu 172) can be opened in the modal and favorited — intersection filtering would silently drop them while the header count includes them. Filter off → the plain 150 list. Lock with a test (favorited Sylveon appears in favorites-only view).

### 5.3 Query/mutation design

`app/queryClient.ts`: defaults `{ staleTime: Infinity, gcTime: 30 * 60 * 1000, retry: 1 }` — PokéAPI data is immutable. Favorites query overrides `staleTime: 30_000` (mutable; covers multi-tab drift). Central key factory in `shared/api/queryKeys.ts`.

Optimistic toggle (remove is the symmetric filter-out). Both mutations share `mutationKey: ['favorites']`; `onSettled` only invalidates when it's the **last** in-flight favorites mutation, so rapid toggles of two Pokémon can't clobber each other's optimistic entries:

```ts
const addMutation = useMutation({
  mutationKey: ['favorites'],
  mutationFn: (p: PokemonListItem) => addFavorite(p),
  onMutate: async (p) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });
    const previous = queryClient.getQueryData<Favorite[]>(queryKeys.favorites.all);
    queryClient.setQueryData<Favorite[]>(queryKeys.favorites.all, (old = []) => [
      ...old, { pokemonId: p.id, name: p.name },
    ]);
    return { previous };
  },
  onError: (_e, _p, ctx) => queryClient.setQueryData(queryKeys.favorites.all, ctx?.previous),
  onSettled: () => {
    if (queryClient.isMutating({ mutationKey: ['favorites'] }) === 1) {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    }
  },
});
```

Mutations invalidate only `['favorites']` (success *and* error → always reconciles with the server). Pokémon queries are never invalidated.

### 5.4 API client & types

- `shared/api/client.ts`: `apiFetch<T>` with `BASE_URL = import.meta.env.VITE_API_URL || ''` (relative `/api/...` in dev → Vite proxy; absolute in prod), throws typed `ApiError(status, message)` parsed from the backend error envelope; 204 → `undefined`.
- Feature `api.ts` files are thin typed wrappers; `fetchFavorites` unwraps `{ favorites }`.
- `shared/types/pokemon.ts` mirrors backend DTOs: `PokemonType` union (18 types), `PokemonListItem { id, name, spriteUrl }`, `Pokemon extends PokemonListItem { types, abilities }`, `EvolutionStages = { chainId, stages: PokemonListItem[][] }`, `Favorite { pokemonId, name, createdAt? }` (`createdAt` optional so optimistic entries type-check).
- `shared/lib/sprites.ts` builds both sprite and official-artwork URLs from `id`; `shared/lib/formatName.ts` handles slugs (`mr-mime` → "Mr. Mime").
- Every query-rendering component handles four states: pending → `Spinner`; error → `ErrorMessage` + Retry (`refetch()`); empty → `EmptyState` ("No favorites yet — tap a heart to add one" under the filter); success → content.

### 5.5 Tailwind v4

`tailwindcss` + `@tailwindcss/vite` plugin in `vite.config.ts`; **no `tailwind.config.js`, no PostCSS config**. Dark mode skipped.

**Visual design (decided): the "cozy 8-bit" mockups in `mokup_design/` (gitignored reference), card = variant C "cozy sticker".** VT323 pixel font (Google Fonts), paper background `#f3ead9` with a 5px dot grid, ink `#4a3b4f`, hard offset shadows (no blur). Card: dashed lavender border `#c9a0dd`, `-rotate-2` tilt (straightens on hover), cream sprite frame `#fbeede` with 3px ink border, bobbing pixelated sprite (`steps(2)` keyframes), "FAV ★" badge + filled heart when favorited, centered name, `● type` dot labels. All tokens live in `src/index.css` `@theme` (incl. 18 type bg/ink color pairs from the mockup palette, `--shadow-sticker`, `--animate-bob`). `typeColors.ts` maps each type to a **complete literal class string** (`grass: 'text-type-grass-ink'`, fallback `text-muted`) — never interpolated fragments, so the scanner sees them.

### 5.6 Frontend tests

Vitest, `happy-dom`, `globals: true`, MSW node server, `renderWithProviders` (fresh QueryClient, `retry: false`). To remove relative-URL/fetch-interception ambiguity: vitest `env` sets `VITE_API_URL=http://localhost:3001` and **MSW handlers register absolute URLs**.

1. `uiStore.test.ts` — filter flip + selection lifecycle
2. `useToggleFavorite.test.ts` — optimistically adds to `['favorites']` cache before POST resolves
3. `useToggleFavorite.test.ts` — rolls back cache when backend returns 500
4. `PokemonList.test.tsx` — 150 cards on success, spinner while pending, retryable error on failure
5. `PokemonList.test.tsx` — favorites-only filter incl. empty state **and a favorite with ID > 150 still rendering**
6. `PokemonDetailModal.test.tsx` — types/abilities/evolutions render; closes on Escape

MSW over fetch-mocks so the real `apiFetch` (URL building, error parsing) is exercised. `setup.ts` resets MSW handlers and the Zustand store between tests.

## 6. PokéAPI Integration Reference

| Upstream endpoint | Used for | Notes |
|---|---|---|
| `GET /api/v2/pokemon?limit=150&offset=0` | list | Results contain only `{name, url}`; derive id + sprite. IDs 1–150, ends at Mewtwo. Ignore `count` (~1350, includes forms ≥10001) |
| `GET /api/v2/pokemon/{idOrName}` | detail | ~250KB raw (mostly `moves`) — trim to `{id, name, abilities, types, sprites, species}` for the cache. Artwork key is hyphenated: `sprites.other["official-artwork"].front_default` |
| `GET /api/v2/pokemon-species/{id}` | evolution step 2 | `evolution_chain` is a bare `{ url }` — parse the chain id from it |
| `GET /api/v2/evolution-chain/{id}` | evolution step 3 | Recursive `ChainLink { species, evolution_details[], evolves_to[] }`; `evolves_to: []` = terminal; length > 1 = branched (Eevee has 8) |

Sprite URLs (static GitHub raw, keyed by pokemon ID — no detail fetch needed):

```
list sprite (96×96):  https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png
official artwork:     https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png
```

ID extraction (tolerates trailing slash): `const idFromUrl = (url: string) => Number(url.match(/\/(\d+)\/?$/)![1]);`

Gotchas to honor in code:
- Chain `species.url` points at `pokemon-species`, **not** `pokemon`; species id == default pokemon id for this scope, so sprite-by-id is safe. Match chain nodes by **ID**, never by name.
- The clicked Pokémon may not be the chain root (Pikachu's chain roots at Pichu #172, `is_baby: true`); render the whole chain — simpler and more informative.
- Chain members can exceed 150 (Espeon 196, Steelix 208, Sylveon 700) — render them; sprites resolve by ID; they can be favorited and must appear in the favorites-only view (§5.2).
- `evolution_details` is an array with 0..n entries (Leafeon has 4) — take `[0]` or show only target names.
- Names are lowercase slugs (`mr-mime`, `farfetchd`, `nidoran-f`) — format for display.
- No hard rate limit, but Fair Use requires local caching (IP ban possible) — the LRU cache + `User-Agent` satisfy this.

## 7. Local Dev & Tooling

`docker-compose.yml` (Postgres only; Node runs on host for HMR):

```yaml
services:
  db:
    image: postgres:16-alpine
    environment: { POSTGRES_USER: pokemon, POSTGRES_PASSWORD: pokemon, POSTGRES_DB: pokemon_favorites }
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./server/src/db/sql/init-test-db.sql:/docker-entrypoint-initdb.d/init-test-db.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pokemon -d pokemon_favorites"]
      interval: 5s
      timeout: 3s
      retries: 10
volumes:
  pgdata:
```

`server/.env.example`: `PORT=3001`, `DATABASE_URL=postgres://pokemon:pokemon@localhost:5432/pokemon_favorites`, `CORS_ORIGIN=http://localhost:5173`, `POKEAPI_BASE_URL=https://pokeapi.co/api/v2`. `client/.env.example`: `VITE_API_URL=` (empty → Vite proxy). Vite proxy: `server: { proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } } }`.

Root scripts (`concurrently` as root devDep): `dev` (both packages), `build`, `test`, `lint` (`eslint .`), `format`, `db:up` (`docker compose up -d`), `db:migrate` (`-w server` → `tsx src/db/migrate.ts`). Per-package: client `dev: vite`, `build: tsc -b && vite build`, `test: vitest run`; server `dev: tsx watch src/index.ts`, `build: tsc`, `start: node dist/index.js`, `test: vitest run`.

First-run path:

```bash
cp server/.env.example server/.env && cp client/.env.example client/.env
npm install
npm run db:up
npm run db:migrate     # optional — server also migrates on boot
npm run dev            # client :5173, server :3001
```

Lint/format: ESLint 9 flat config (tseslint `recommended`; react-hooks/react-refresh scoped to `client/**`; `eslint-config-prettier` last), Prettier (`singleQuote: true, printWidth: 100`). No Husky — CI covers it.

CI (`.github/workflows/ci.yml`): one job on push/PR — checkout, setup-node 22 + npm cache, `npm ci`, `npm run lint`, `npm run test`, `npm run build`, plus a `postgres:16-alpine` service container with `POSTGRES_DB: pokemon_test` and `DATABASE_URL=postgres://pokemon:pokemon@localhost:5432/pokemon_test` for the server suite (~20s slower than mocking the DB, but the upsert/idempotency tests run for real). No deploy from CI — Vercel/Render deploy on push via Git integrations.

## 8. Deployment

- **Frontend — Vercel:** Project Root Directory `client/`, framework preset Vite, build `npm run build`, output `dist` (Vercel's monorepo detection uses the repo-root lockfile). Env `VITE_API_URL=https://<render-app>.onrender.com` (no trailing slash; baked at build time — changing it requires a redeploy). `client/vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`.
- **Backend — Render Web Service** (decided; over Railway/Fly/Vercel-serverless because a long-lived process keeps the in-memory LRU cache and classic `pg.Pool` working as designed — serverless would evaporate the cache per cold start and risk connection exhaustion). Pipeline validated first via the **fork of `render-examples/express-hello-world`** (§9 M0); when the real backend lands (M9), point the Render service at this repo (or create a second Web Service from it) with: Build Command `npm install && npm run build -w server`, Start Command `npm run start -w server` (repo root, so the workspace lockfile is used), Node 22. `PORT` is injected by Render — the server reads `env.PORT`. Migration runs idempotently on boot.
- **Database — Render PostgreSQL (managed):** same platform, one dashboard. ⚠️ The **free instance expires after 30 days** — README must state this; fallback is a free Neon branch (pure `DATABASE_URL` + `?sslmode=require` swap, `pg.Pool({ max: 5 })` already fits Neon's limits).
- Render env vars: `DATABASE_URL` (internal connection string), `CORS_ORIGIN=https://<app>.vercel.app` (exact origin; previews unsupported by default — see §4.5), `POKEAPI_BASE_URL`.
- README cold-start notes: Render free web services spin down after ~15 min idle → first request takes ~30–60s (`/healthz` link provided so a reviewer can warm it); managed-Postgres wake-up is absorbed by `connectionTimeoutMillis` + boot retry (§4.2).

## 9. Implementation Milestones — tracking checklist

Each milestone = one commit. Backend-first so every frontend milestone develops against the real API — no mock-then-swap churn. Platform constraints (`process.env.PORT`, relative `/api` paths) locked from M1 so nothing needs retrofitting.

### M0 — Pre-implementation: plan + Render pipeline validation *(last step before implementation)*
- [x] Implementation plan written (this file)
- [x] Services/data-flow diagram (`docs/architecture.mmd`, embedded in §1)
- [x] `gh auth login` (user — interactive) — logged in as `kidJeezah`
- [x] Fork `render-examples/express-hello-world` on GitHub → https://github.com/kidJeezah/express-hello-world
- [ ] Create a Render Web Service from the fork; hello-world responds on its `.onrender.com` URL → **deploy pipeline validated**
- [ ] Create the Render PostgreSQL instance; record the internal `DATABASE_URL`

### M1 — Scaffold *(~10%)*
- [x] `git init` + workspaces root (`package.json`, `tsconfig.base.json`, eslint/prettier)
- [x] Vite React-TS app in `client/`; Express 5 + tsx skeleton in `server/` with `/healthz`
- [x] `docker compose up` healthy (incl. `pokemon_test` init script)
- [x] `npm run dev` boots both; initial commit

### M2 — Backend: favorites + proxy *(~20%)*
- [x] `favorites` table via boot migration
- [x] GET/POST/DELETE favorites against Postgres (upsert → 201/200, 204-always delete)
- [x] `/api/pokemon`, `/:idOrName`, `/:idOrName/evolution` proxying with two-layer LRU cache + error mapping (404 passthrough, 502 upstream)
- [x] Verified via curl (incl. eevee evolution → 8 branches)

### M3 — Frontend: list *(~15%)*
- [x] `usePokemonList` fetches 150 via proxy; scrollable Tailwind grid with sprite + formatted name
- [x] Loading/error/retry states; Vite proxy confirmed (no CORS locally)

### M4 — Frontend: detail modal *(~15%)*
- [x] Click card → modal with types, abilities, evolution strip
- [x] "No evolutions" for single-stage; branched chains render; clicking an evolution re-selects it; Esc/overlay close

### M5 — Favorites integration *(~15%)*
- [x] Heart toggle on card + modal; optimistic mutations with rollback + guarded `onSettled` invalidation
- [x] Favorites survive page reload (proves Postgres persistence)

### M6 — Favorites filter *(~5%)*
- [x] Zustand `showFavoritesOnly` switches the grid to render from the favorites query (IDs > 150 included)
- [x] Favorites count in header; empty state when filter on with zero favorites

### M7 — Tests *(~10%)*
- [x] Server suite green (favorites CRUD/idempotency, cache hit-count, error mapping, 8-branch Eevee flattening) against `pokemon_test`
- [x] Client suite green (store, optimistic add/rollback, list states, filter incl. >150 favorite, modal)
- [ ] CI green (lint + test + build, Postgres service container) — workflow committed; verifiable after first push to GitHub

### M8 — Polish *(~5%)*
- [ ] All four UI states everywhere; a11y (buttons, alt text, focus trap)
- [ ] README per outline: quick start (+ no-Docker path), env vars, architecture & state-ownership rationale, sprite-bypass note, accepted tradeoffs, cold-start + DB-expiry notes
- [ ] `docs/architecture.mmd` still matches reality; lint clean

### M8.5 — User-requested additions (2026-06-11)
- [x] Frontend search by name or dex number (`SearchBox` + `uiStore.searchQuery`, filters the full list client-side in both normal and favorites-only modes; "No Pokémon found" empty state)
- [x] Infinite scroll for the list — first 20 cards, +20 per sentinel intersection (client-side windowing over the single 150-item request)
- [x] Backend source logging (pino + pino-pretty in dev): full upstream PokéAPI URL with status/ms, LRU cache hit/miss per key, and Postgres favorites operations — every response traceable to `source: upstream | cache | postgres`

### M9 — Deploy *(~5%)*
- [ ] Render Web Service pointed at this repo (build/start commands from §8); env vars set
- [ ] Vercel live with `VITE_API_URL` + rewrites; `CORS_ORIGIN` set to the Vercel URL
- [ ] End-to-end smoke on prod URLs (list, detail, evolution, favorite toggle, filter, reload persistence)
- [ ] Prod URLs in README

## 10. Risks & Edge Cases

- **Branched evolutions (Eevee, 8 branches):** handled by `stages: PokemonSummary[][]`; FE wraps stage members; server test #6 locks the flattening against the real fixture.
- **No-evolution Pokémon (Ditto, Tauros, Kangaskhan):** chain fetch is never a 404 — `stages.length === 1` → explicit "No evolutions" UI state.
- **Clicked Pokémon isn't the chain root** (Ivysaur → root Bulbasaur; Pikachu → root Pichu): render the entire chain rather than walking to the clicked node — simpler and more informative.
- **Chain members outside 1–150** (Pichu 172, Espeon 196, Steelix 208, Sylveon 700): rendered, openable, favoritable — and the favorites-only view renders from the favorites query so they're never silently dropped (§5.2).
- **150 vs 151 boundary:** literal `limit=150` ends at Mewtwo; Mew excluded. Documented in README; including Mew is `limit=151`.
- **PokéAPI downtime/slowness:** 5s upstream timeout → 502 `UPSTREAM_ERROR`; warm LRU entries keep serving for 24h; FE shows retryable `ErrorMessage`. Favorites (Postgres) remain fully functional during an upstream outage.
- **Optimistic update rollback:** `onMutate` snapshots, `onError` restores, guarded `onSettled` invalidation reconciles with the server without clobbering concurrent toggles (§5.3); backend idempotency (upsert / 204-always) means double-fires never surface spurious errors.
- **Cache stampede / Fair-Use ban:** promise-caching dedupes concurrent upstream calls behind one Render egress IP; `User-Agent` set; sprites bypass the proxy entirely.
- **Render free-tier lifecycle:** web service spins down after ~15 min idle (~30–60s cold start; `/healthz` to warm) and the free Postgres **expires after 30 days** (Neon fallback documented). Both in README.
- **Express 5 semantics:** `req.query` read-only (validated values live on `res.locals.validated`); async errors auto-forward — don't reintroduce v4-style wrappers.
- **Vite env baking:** `VITE_API_URL` is compile-time — changing the backend URL requires a Vercel redeploy (noted in README env table).
- **Name slugs:** `mr-mime`/`farfetchd`/`nidoran-f` need the display formatter; all matching is by numeric ID, never name.
