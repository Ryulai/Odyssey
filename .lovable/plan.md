
## Phase 1 — Cloud + Auth foundation

1. Enable Lovable Cloud.
2. Add `/auth` page (email+password sign in/up). Profiles table linked to `auth.users` storing `display_name`, `path` (hunter/operational), `department`, `manager_id`. Auto-create profile via trigger.
3. `app_role` enum (`director | manager | staff`) + `user_roles` table + `has_role()` security-definer fn. Replace the in-app role switcher with the real signed-in role (keep "view-as" only for directors as a UI helper, optional).
4. Move every protected page under `_authenticated/`. Admin Console gated by `director` / `manager` capabilities (same matrix as today).

## Phase 2 — Config tables (replace mock data)

Tables (all in `public`, RLS on, GRANTs per rules):

- `staff` (mirrors profile fields needed by admin: role title, path, dept, rank, current grade, manager_id) — directors full CRUD, managers edit own team, staff read self.
- `grade_rules` (`grade A/B/C/D`, `min_score`, `bonus_pct`, `notes`) + `grade_weights` (singleton row: `sales_weight`, `review_weight`).
- `achievements` (name, description, star_reward, reset_cycle, difficulty, active).
- `ranks` (key, name, order_index, description, promotion_requirement).
- `legacy_config` (singleton: `stars_per_moon`, `moons_per_sun`) + `legacy_titles` (name, min_stars, flavor).

Director-only write policies; all signed-in users can read config.

Seed migration: insert current sample Hunters, achievements, ranks, legacy titles, grade rules.

Admin modules refactored to React Query + `createServerFn` CRUD. Remove all in-memory state and the `employee-data.ts` constants used as source of truth (keep only type definitions / display helpers).

## Phase 3 — Achievement claim workflow

- Storage bucket `claim-evidence` (private), RLS so claimant uploads under `userId/...`, manager + director can read team files.
- `achievement_claims` (id, staff_id, achievement_id, notes, evidence_urls[], status `pending|approved|rejected`, decided_by, decided_at, decision_notes, created_at).
- `achievement_records` (id, staff_id, achievement_id, stars_awarded, source_claim_id, awarded_at) — feeds the existing star/legacy math.
- Server fns: `submitClaim`, `listMyClaims`, `listTeamClaims`, `approveClaim` (inserts achievement_record + updates claim atomically), `rejectClaim`.
- New routes: `/claims` (staff submit + history) and `/claims/review` (manager queue).

## Phase 4 — Monthly evaluation

- `monthly_evaluations` (staff_id, period `YYYY-MM`, sales_score, review_score, composite_score, grade, evaluator_id, created_at, unique(staff_id, period)).
- Server fn `submitEvaluation` computes `composite = sales*sales_weight + review*review_weight`, looks up `grade_rules` to assign A/B/C/D, inserts row. Manager-only for their reports; directors for anyone.
- New route `/evaluations` (manager view: per-month grid for team) + read-only "My Grades" tab on staff dashboard pulled from this table.
- Career-tree rank-progress reads counts from `monthly_evaluations` instead of mock arrays.

## Tech notes

- All DB access through `createServerFn` with `requireSupabaseAuth`; admin/service-role only inside handler imports.
- Every new `public` table ships with `GRANT`s to `authenticated` + `service_role` and `ENABLE RLS` in the same migration.
- React Query for cache; mutations invalidate per-key.
- Defer: bulk import, email notifications, analytics, OAuth providers.
