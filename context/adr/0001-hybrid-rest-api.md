# ADR 0001: Hybrid REST/JSON API alongside the Inertia web app

**Status:** Accepted — core domain implemented, API-parity gaps and docs tooling still open (see [Follow-ups](#follow-ups))
**Date:** 2026-08-20

## Context

The capstone (TCC) requirement states that *"the backend must follow the RESTful pattern and communicate
with the frontend via JSON messages."* Before this decision, the project had **no REST/JSON API surface at
all**: it was a pure Inertia.js + Laravel Fortify application — ~50 controller actions returning
`Inertia::render(...)` or `redirect()`, authenticated by session/cookie (stateful), with no `routes/api.php`,
no Sanctum, no API Resources, no OpenAPI docs. Inertia does exchange JSON internally (the `X-Inertia`
protocol), but that JSON is page-coupled, not a resource-oriented REST API — it wouldn't satisfy a literal
reading of the requirement.

Three options were weighed:

- **(A) Hybrid** — keep the Inertia app exactly as-is; add a fully separate, stateless, token-authenticated
  REST/JSON API in parallel, sharing business logic via a Service layer.
- **(B) Full conversion** — remove Inertia, rewrite the frontend as a standalone SPA, switch auth to
  token-only. Architecturally "pure," but a near-total rewrite of the frontend/auth contract with a real
  risk of breaking working flows (login, 2FA, email verification all depend on Fortify) under a TCC deadline.
- **(C) Argue Inertia's own JSON protocol already qualifies.** Cheapest, but fragile if the committee reads
  the requirement strictly (resource-oriented endpoints, stateless auth).

**Decision driver:** the requirement's wording is moderate — it asks for RESTful + JSON, not explicitly a
decoupled SPA or token-only auth everywhere. Given that, and the deadline/regression-risk trade-off, **(A)**
was chosen.

## Decision

Build the API as a **second, independent presentation layer** over the same domain, not a replacement:

- **Routing.** `routes/api.php` registered alongside `routes/web.php` in `bootstrap/app.php`. Everything
  under `/api` is stateless: `auth:sanctum` (Bearer token), no session, no `EnsureFrontendRequestsAreStateful`
  (that middleware is Sanctum's "SPA cookie" mode — deliberately not used, since the goal is a genuinely
  stateless token API, not a same-origin SPA helper).
- **Errors.** `bootstrap/app.php`'s exception handler was extended with `shouldRenderJsonWhen` so any
  `api/*` request (or any request that explicitly wants JSON) always gets a JSON error body — never the
  Inertia `error` page. The web error path is untouched.
- **One business logic layer, two thin presentation layers.** All non-trivial mutation logic (transactions,
  notifications, status transitions, business-rule validation) was extracted out of the Inertia controllers
  and into `App\Services\*`. Both the (now much thinner) Inertia controllers and the new API controllers call
  the *same* service method. This was the single most important rule followed throughout: **the API was
  never allowed to duplicate a business rule that already existed in a web controller** — it was extracted
  first, then reused.
- **Formatting.** One Laravel API Resource per response shape (`app/Http/Resources/*`). Resources were
  written to mirror the exact JSON shape the Inertia controllers already hand-built inline (same keys, same
  ISO-8601 date formatting), so contract parity between web and API was easy to eyeball and test.
- **Reuse over rebuild.** Existing FormRequests, Actions, and middleware were reused as-is wherever their
  logic was guard-agnostic: `StoreDoacaoRequest`, `NecessidadeRequest`, `RejectInstitutionRequest`,
  `EvaluateInstitutionAction`, `CreateNewUser`, and the role middlewares (`CheckDoador`, `CheckInstituicao`,
  `CheckAdmin`, `CheckNecessidadeOwnership`) all work unmodified under both guards, because
  `auth:sanctum` calls `Auth::shouldUse('sanctum')` on success, so `auth()->user()` resolves correctly for
  the rest of the request regardless of which guard authenticated it.

### What was built

| Domain slice | Service | API controller(s) | Resource(s) |
|---|---|---|---|
| Auth (register/login/logout/me) | `ResolveAuthenticatedUser` (extracted from `FortifyServiceProvider`) | `Api\AuthController` | `UserResource` |
| Doações — donor side | `DoacaoService` | `Api\DoacaoController` | `DoacaoResource` |
| Doações — institution side + rating | `DoacaoService` (extended), `AvaliacaoService` | `Api\Instituicao\DoacaoController`, `Api\Instituicao\AvaliacaoController` | `InstituicaoDoacaoResource`, `AvaliacaoResource` |
| Necessidades (CRUD) | `NecessidadeService` | `Api\NecessidadeController` | `NecessidadeResource` |
| Horários (CRUD) | `HorarioService` | `Api\HorarioController` | `HorarioResource` |
| Transferências (full state machine) | `TransferenciaService` (absorbed the `calcularEstoque` stock calculation, previously a `public static` method awkwardly called cross-controller) | `Api\Instituicao\TransferenciaController` | `TransferenciaResource` |
| Admin — institution approval | *(none needed — reused `EvaluateInstitutionAction` directly)* | `Api\Admin\InstitutionController` | `InstituicaoResource` |
| Instituições (public listing/detail/recommendations) | *(read-only — reused `RecommendationService`)* | `Api\InstituicaoController` | `InstituicaoListResource`, `InstituicaoShowResource` |
| Agenda | `AgendaService` | `Api\Instituicao\AgendaController` | `AgendamentoResource` (+ reuses `HorarioResource`, `TransferenciaResource`) |
| Doador — profile | *(read-only)* | `Api\Doador\PerfilController`, `Api\Instituicao\DoadorController` | `DoadorPerfilResource` (one resource, shared — see below) |

Business-rule failures that used to be `abort_if(..., 422, 'message')` or ad-hoc `back()->with('error', ...)`
calls were normalized into small domain exceptions (`DoacaoException`, `NecessidadeException`,
`HorarioException`, `TransferenciaException`) so the web controller can keep doing
`catch (...) { return back()->with('error', $e->getMessage()); }` while the API controller does
`catch (...) { return response()->json(['message' => $e->getMessage()], 422); }` — same exception, two
renderings.

**`EnsureInstitutionIsApproved`** gained a small `$request->is('api/*')` branch: on `api/*` it aborts with a
JSON 403 instead of `redirect()->route('waiting-validation')`. Additive change, guarded so the existing web
redirect behavior is untouched.

**Notable dedup side-effect:** `Doador\PerfilController::show()` and `Instituicao\DoadorController::show()`
(web) were ~90% duplicated code (same donor-profile shape, minor differences for "own profile" vs.
"institution viewing a donor they've interacted with"). The API layer collapsed that into one
`DoadorPerfilResource` that accepts an optional `$instituicaoId` constructor argument to switch views — the
web controllers were left as-is (out of scope for this ADR), but the API proves the shape can be unified.

### Testing

- Pest feature tests under `tests/Feature/Api/`, one file per resource — **33 tests, 114 assertions** as of
  this writing.
- Shared test helpers (`criarDoadorUser`, `criarInstituicaoComHorario`, `criarAdminUser`, `registrarInstituicao`,
  `cnpjValido`, `bearer`, etc.) live in `tests/Pest.php`, not in individual test files. They were originally
  written per-file and worked when the whole suite ran together — but **failed when a single file was run in
  isolation**, because Pest only loads the files matching the run filter and a function defined inside one
  test file isn't visible from another unless both happen to be loaded. Centralizing in `tests/Pest.php`
  (always loaded) fixed this permanently.
- **Regression discipline.** Every slice was verified with a `git stash` A/B: full suite on the clean branch,
  full suite with the slice applied, diff the pass/fail counts. Every single time, the result was the same
  33 pre-existing, unrelated failures (a documented `UserFactory` gap — missing `tipo_usuario` — see
  [known-issues.md](../known-issues.md)) plus zero new failures. Each slice also got a live smoke test
  (`php artisan serve` + `curl`) confirming both the web app and the new endpoints respond correctly outside
  the test environment.
- Two self-seeding Postman collections (`postman/EQ05-testes-api.postman_collection.json`,
  `postman/EQ05-testes-api-instituicao.postman_collection.json`) generate their own valid CPF/CNPJ via
  pre-request scripts and chain tokens between requests, so they run end-to-end with zero manual setup
  (validated live via `newman run`).

### Bugs found along the way (worth remembering)

1. **Sanctum guard caching across test requests.** `Laravel\Sanctum\Guard` checks the `web` session guard
   before falling back to token lookup, and the underlying `RequestGuard`-style wrapper caches the resolved
   user for the lifetime of the guard instance. Laravel's HTTP test client reuses the same container across
   sequential `postJson()` calls within one test method, so switching Bearer tokens mid-test silently kept
   resolving whichever user authenticated *first*. Not a production bug (a real HTTP request always gets a
   fresh process/container) — but a genuine test-authoring trap. Fixed by calling `app('auth')->forgetGuards()`
   before every request that uses a different token than the previous one (see the `bearer()` helper in
   `tests/Pest.php`).
2. **Stale `instituicao` relation.** `EnsureInstitutionIsApproved` only called `$user->load('instituicao')`
   when the relation wasn't already loaded, which could serve a stale `status` if the same `$user` instance
   were reused across requests (surfaced by bug #1 above, but fixed independently since it's a correctness
   improvement regardless of cause). Changed to always reload.
3. **`RecommendationService::forDonor()` returns plain arrays, not `Instituicao` models** — its final `->map()`
   already reshapes into `['usuario_id' => ..., 'nome_fantasia' => ..., ...]`. An initial attempt to wrap the
   result in `InstituicaoListResource::collection(...)` was wrong (there's no model to feed the Resource);
   fixed by returning the array directly via `response()->json(['data' => ...])`.

## Consequences

**Positive**

- The TCC requirement is satisfied literally: resource-oriented endpoints, correct HTTP verbs/status codes,
  stateless Bearer-token auth, JSON in and out.
- Zero behavioral change to the existing Inertia app, verified repeatedly rather than assumed.
- Business logic now has a single source of truth per domain concern, which also quietly improved the web
  app's own code (the `calcularEstoque` cross-controller static call, in particular).
- Every slice is independently tested and was regression-checked before moving to the next.

**Trade-offs / accepted debt**

- **Two auth systems coexist by design**: session/Fortify for the web app, Sanctum tokens for the API. A
  future maintainer needs to know both exist and why.
- **Email verification is not mirrored on the API.** The web app's `verified` middleware gates several
  routes; the API intentionally does not enforce it yet (there's no token-friendly verification flow in
  place). This is a scope cut, not an oversight — closing it requires deciding how an API client verifies an
  email address (magic link? verification code?).
- **Not every web resource has an API counterpart yet**: Notificações (read-only, small), Admin CRUD beyond
  institution approval (usuários, doadores, instituições edit/update), and Settings (profile/photo/password)
  remain web-only.
- **No machine-readable API documentation yet.** No Scramble/OpenAPI generation, and `docs/` (the Docusaurus
  site) is still an empty scaffold. Documenting the backend via that Docusaurus site is itself a capstone
  requirement, and the natural next step once the resource surface is considered "done enough."

## Follow-ups

Roughly in priority order:

1. Notificações (read-only `index`).
2. Admin CRUD (`usuarios`, `doadores`, `instituicoes` edit/update).
3. Settings (profile, photo, password) — lower priority, self-service rather than core domain.
4. Decide on and implement API email verification, or explicitly document its absence as a known limitation.
5. `dedoc/scramble` to auto-generate an OpenAPI spec from `routes/api.php`, embedded into the Docusaurus site
   in `docs/`.
6. Update [architecture.md](../architecture.md) and [backend-reference.md](../backend-reference.md), which
   still describe the pre-API state (no `routes/api.php`, no Sanctum) as of this ADR.
