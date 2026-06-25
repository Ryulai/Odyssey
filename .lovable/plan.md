# Three Identity Systems — Architecture Split

Today the `staff` table mixes operational assignment (fleet/manager), RPG progression (rank/path), and ownership signals (Director = "Shipbuilder"). Splitting these into three independent identities so a person can, e.g., work at Ting Livehouse, play as a Silver Priest, and be Founder of Du Bar — all at once.

## The three identities

```text
WORK IDENTITY            RPG IDENTITY              LEGACY IDENTITY
(operational, 1 record)  (character, 1 record)     (titles, N records)
─────────────────────    ────────────────────      ──────────────────────
Fleet / Location         Class (Warrior/Mage/…)    Founder / Co-Founder
Department               Rank                       Partner / Shareholder
Position                 Career Tree                Investor / Builder
Manager                  Stars / Grades             Pioneer / Mentor
Employment Status        Achievements               + target fleet (optional)
                                                    + start/end date
```

Work answers "where do you report today?" RPG answers "what character are you playing?" Legacy answers "what have you built that outlives your current role?"

## Database changes

1. **`work_identity`** (new) — current operational record, 1:1 with staff.
   - `staff_id` (PK, FK staff), `location_id`, `department`, `position`, `manager_id`, `employment_status` (active/leave/separated), `start_date`.
2. **`rpg_identity`** (new) — character sheet, 1:1 with staff.
   - `staff_id` (PK, FK staff), `class` (enum: warrior/mage/ranger/priest/bard/…), `career_tree`, `shipbuilder_tree`, `current_rank_key`. Stars/grades/achievements stay in their existing tables, keyed by `staff_id`.
3. **`legacy_titles`** (rename existing flavor table → `legacy_title_catalog`; new records table `legacy_holdings`)
   - `legacy_holdings`: `id`, `staff_id`, `title` (Founder/Co-Founder/Partner/Investor/Builder/Pioneer/custom), `location_id` (nullable — title can be company-wide), `note`, `granted_at`, `ended_at` (nullable). Many rows per person.
4. **Migrate** existing `staff` columns into the new tables, then drop the moved columns from `staff` (keep `name`, `email`, `employee_code`, `user_id`, `system_role`, `avatar`, `join_date`).
5. **"Shipbuilder = Director"** coupling goes away. Director is purely a system role (permissions). Whether someone shows as a Shipbuilder in the UI is driven by `legacy_holdings` (e.g. holds a Founder/Partner title), not by app role.

All new tables: GRANT to `authenticated` + `service_role`, RLS on, policies mirroring current `staff` rules (self read, manager reads team via `work_identity.manager_id`, director full).

## Server functions

- Extend `listStaff` / `getStaff` to join all three identities and return `{ staff, work, rpg, legacy: [...] }`.
- New CRUD: `upsertWorkIdentity`, `upsertRpgIdentity`, `addLegacyHolding`, `updateLegacyHolding`, `removeLegacyHolding`.
- `transferStaff` now writes to `work_identity` only.
- Promotion/rank/grade calculations read `rpg_identity` (class, trees) instead of `staff.role_family`.
- Fleet/Manager dashboards filter by `work_identity` (current assignment), so legacy ownership never leaks into "who reports to me".

## Admin UI (`/admin`)

Split the Staff form into three tabs inside the staff editor:

1. **Work** — fleet, department, position, manager, status, start date.
2. **RPG** — class, career tree, shipbuilder tree, starting rank. (Stars/grades remain read-only.)
3. **Legacy** — list of holdings with Add/Edit/End buttons; each row = title + (optional) fleet + dates + note.

New top-level admin tab **Legacy Registry**: cross-fleet view of all holdings (filter by title, fleet, person). This is the "Legendary Titles" registry.

## Profile / Dashboard surface

- **Character Sheet** header shows: Name + Class + Rank (RPG), then a thin "Working as" line (Work), then a Legacy ribbon of title badges (Founder of Du Bar, Partner at Gaia, …).
- Manager/Fleet dashboards unchanged in shape, but pull from `work_identity`.
- Director profiles no longer hardcode "Beyond Rank". A user shows the Shipbuilder/Beyond-Rank treatment when they hold a qualifying legacy title (Founder/Partner/Shareholder). Directors without such a title get a normal RPG sheet.

## Terminology

Keep Odyssey naming. Class list (initial): Warrior, Mage, Ranger, Priest, Bard — editable in Admin → RPG Config. Legacy titles editable in Admin → Legacy Registry.

## Out of scope this pass

- Per-class skill trees content (just the class field + existing trees).
- Historical work assignments (only `start_date` on current record; full job history is a later phase).
- Ownership equity %, contracts, payouts.

## Deliverables

1. One migration: create `work_identity`, `rpg_identity`, `legacy_holdings`; backfill from `staff`; drop moved columns.
2. Updated `config.functions.ts` + new `legacy.functions.ts`.
3. Admin staff editor with 3 tabs + Legacy Registry tab.
4. Profile/Manager/Fleet dashboards rewired to the new sources.
