# Context
Project `shopee-aff-site` is much closer to production than before: `build` passes and `npm audit --omit=dev` is clean, but deployment is still blocked by failing `lint` and `test`, plus a few remaining security/integrity issues. The goal of this change set is to finish the last minimal-risk fixes required to make the app deployable and safer for production, without broad refactors.

# Recommended approach

## Phase 1 — Unblock deployment checks first

### 1. Fix deterministic lint blockers with minimal behavior change
Update these files in order:

- `src/app/admin/blog/categories/page.tsx`
  - Move `fetchCategories` above first use or convert it to a function declaration so the mount effect does not reference it before declaration.
- `src/app/(public)/nhap-don/submit-order-client.tsx`
  - Do the same for `loadOrders`.
- `src/app/(public)/deal/slot-tabs-client.tsx`
  - Replace effect-driven initial state (`setNowSec(...)` in effect) with lazy `useState` initialization; keep the interval in the effect.
- `src/components/site-header.tsx`
  - Move route-change menu closing logic out of render into `useEffect` keyed by `pathname`; avoid ref mutation/state updates during render.
- `src/app/(auth)/admin-login/page.tsx`
  - Remove the effect that mirrors `searchParams` into state; derive the no-permission message directly from query params plus local auth error state.
- `src/app/(public)/deal/deal-grid-client.tsx`
  - Remove the effect that resets pagination from props. Prefer resetting by remounting from the parent with a stable `key` derived from active filters.
- `src/app/(public)/deal/page.tsx`
  - Remove server-side `Date.now()` render impurity. Keep live timing logic inside existing client-side slot/countdown UI.
- `src/app/(public)/blog/[slug]/page.tsx`
  - Replace the explicit `any` in joined tag mapping with a narrow local type.
- Then rerun lint and clean only the remaining blocking `no-explicit-any` errors, starting with:
  - `src/app/api/admin/withdrawals/route.ts`
  - any additional API files still reported by ESLint.

### 2. Align tests with the current deal-filters implementation
Files:
- `src/lib/deal-filters.ts`
- `src/lib/deal-filters.test.ts`

Approach:
- First verify whether `getSlotForDeal` / `filterDeals` are referenced anywhere in production code.
- If they are not used in production, treat the test file as stale and update tests to the current exported API:
  - `normalizeSlotFilter`
  - `normalizePriceFilter`
  - `getSlotForTimestamp`
  - `filterDealsByPrice`
  - `countDealsByPrice`
- Only reintroduce wrapper exports if production code still depends on the old helpers.

## Phase 2 — Close immediate security blockers

### 3. Make admin UI auth fail-safe by reusing the existing helper
Files:
- `src/app/admin/layout.tsx`
- `src/lib/admin/auth.ts`

Approach:
- Stop duplicating admin auth rules in the layout.
- Reuse `requireAdmin()` so the admin UI and admin APIs share one source of truth.
- Ensure missing `ADMIN_EMAILS` fails closed instead of letting any authenticated user into `/admin`.
- Preserve current UX by mapping auth failures to redirects:
  - unauthenticated → `/admin-login`
  - unauthorized/misconfigured → `/admin-login?error=no_permission` or another explicit denial path if already present.

### 4. Prevent public access to draft blog posts by ID
File:
- `src/app/api/blog/posts/[id]/route.ts`

Approach:
- Public `GET` should return only published posts.
- If the admin editor still needs draft fetch-by-id, support that explicitly with admin-gated access using `requireAdmin()`.
- Do not rely on client-controlled flags without a real admin check.

## Phase 3 — Fix financial integrity on admin withdrawal processing

### 5. Move admin approve/reject logic into an atomic DB RPC
Files:
- `src/app/api/admin/withdrawals/route.ts`
- new migration under `supabase/migrations/` (follow the existing pattern from `supabase/migrations/20260318_create_withdraw_rpc.sql`)

Approach:
- Replace route-side multi-step wallet/status mutations with a PostgreSQL function that:
  - locks the withdrawal row,
  - verifies it is still `pending`,
  - applies approve/paid/reject changes atomically,
  - updates wallet values correctly,
  - returns structured JSON (`ok`, `error`, `status`, optional updated balances).
- In the route, validate input using existing patterns from `src/lib/validations.ts`, then call the RPC.
- While touching this file, remove remaining `any` types reported by lint.

## Phase 4 — Handle rate limiting realistically for this release

### 6. Keep current limiter API, but treat storage choice explicitly
File:
- `src/lib/rate-limit.ts`

Approach:
- Keep the current helper interface so callers do not need a refactor.
- For this release, make one explicit decision:
  - either document that the current in-memory limiter is best-effort and only reliable on single-instance deployments,
  - or upgrade the backend to a shared store if production requirements demand true distributed throttling now.
- If leaving it in-memory for this release, make sure no critical security claim depends solely on it.

## Phase 5 — Final verification and regression pass

Run and verify in this order:
1. `npm run lint`
2. `npm test`
3. `npm run build`
4. `npm audit --omit=dev`

Then manually verify:
- `/admin-login?error=no_permission` still shows the proper message.
- admin pages deny access when `ADMIN_EMAILS` is missing or user is not admin.
- public users cannot fetch unpublished blog posts by ID.
- deal page still resets visible items correctly when filters change.
- countdown/tabs still update correctly.
- categories admin page still loads on mount.
- submit-order page still loads order history.
- admin withdrawal approve/reject cannot double-apply and updates wallet totals correctly.

# Critical files to modify
- `src/app/(auth)/admin-login/page.tsx`
- `src/app/(public)/deal/deal-grid-client.tsx`
- `src/app/(public)/deal/slot-tabs-client.tsx`
- `src/app/(public)/deal/page.tsx`
- `src/app/(public)/blog/[slug]/page.tsx`
- `src/components/site-header.tsx`
- `src/app/admin/blog/categories/page.tsx`
- `src/app/(public)/nhap-don/submit-order-client.tsx`
- `src/lib/deal-filters.test.ts`
- `src/lib/deal-filters.ts` (only if production still needs old helpers)
- `src/app/admin/layout.tsx`
- `src/lib/admin/auth.ts` (only if a small adjustment is needed for shared layout/API behavior)
- `src/app/api/blog/posts/[id]/route.ts`
- `src/app/api/admin/withdrawals/route.ts`
- `supabase/migrations/<new_admin_withdraw_processing_rpc>.sql`
- `src/lib/rate-limit.ts`

# Existing utilities and patterns to reuse
- `src/lib/admin/auth.ts`
  - `requireAdmin()` should be the single source of truth for admin authorization.
- `src/lib/validations.ts`
  - Reuse for request validation rather than adding new validation patterns.
- `src/lib/rate-limit.ts`
  - Keep the existing caller-facing API if the backend storage is changed.
- `supabase/migrations/20260318_create_withdraw_rpc.sql`
  - Reuse its DB-side transaction/locking pattern for admin withdrawal processing.

# Verification
- Automated:
  - `npm run lint`
  - `npm test`
  - `npm run build`
  - `npm audit --omit=dev`
- Manual:
  - auth redirects and admin gating,
  - draft-post protection,
  - deal page interaction regression,
  - submit-order/admin categories load behavior,
  - withdrawal approve/reject integrity and idempotency.