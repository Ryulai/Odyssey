# Two Progression Tracks

Split the Guild Ledger into two separate progression systems based on role family. Both are equally prestigious but use different mechanics.

## 1. Role Taxonomy (data layer)

Add to `src/lib/employee-data.ts`:

- `RoleFamily = "hunter" | "operational"`
- `HunterRole = "Ambassador" | "Senior Ambassador" | "Sales Leader"`
- `OperationalRole = "Bartender" | "Waiter" | "Cashier" | "DJ" | "Designer" | "Manager"` (extensible string)
- Extend `Employee` with `roleFamily` and `role`.
- Keep all existing achievement/legacy fields, but they are only *rendered* for hunters.

For operational staff, add:
- `SkillNode` — skill tree entries (e.g. Bartender: Classic Cocktails → Flair → Menu Design).
- `Certification` — name, issuer, date earned, expires.
- `TrainingLevel` — track (e.g. Service, Safety, Leadership) with level 1–5 and progress to next level.
- `CareerMilestone` — date + label (e.g. "Promoted to Head Bartender", "1 year of service").

Add a second sample employee, e.g. `SAMPLE_OPERATIONAL_EMPLOYEE` (a Senior Bartender), with skill tree, certifications, training levels, milestones, ABCD history, and rank — but **no** achievements/stars/moons/suns.

## 2. Route / View Switching

`src/routes/index.tsx`:

- Read employee `roleFamily`.
- Add a small role-family switcher at the top (toggle between sample hunter and sample operational profile) so the prototype demos both.
- If `hunter`: render the existing Character Sheet (Rank, Grade, Quests, Achievements, Legacy Hall, Career, Partner Path, Reviews).
- If `operational`: render a new Operational Character Sheet (see below). Hide Achievements, Legacy Hall, Quest Board (achievement-style), and Partner Path entirely.

## 3. Operational Character Sheet

Same dark navy + gold styling, same "guild ledger" tone (so it feels equally respected), but with these sections:

1. **Identity card** — Avatar, Name, Role (e.g. "Senior Bartender"), Department, Monthly Grade (ABCD).
2. **Rank** — Operational ranks tuned to capability (Apprentice → Journeyman → Specialist → Expert → Master). Reuse `RankInfo` shape but with an operational rank list.
3. **Skill Tree** — Branches per discipline (e.g. Craft, Service, Leadership) with tier nodes (mastered/active/available/locked). Reuses the existing career-tree visual.
4. **Training Levels** — Progress bars per training track, 1–5.
5. **Certifications** — Card grid, with expiry status (Active / Expiring Soon / Expired).
6. **Career Milestones** — Vertical timeline ("The Journey").
7. **Monthly Voyage Log** — ABCD history (shared with hunters).
8. **Reviews** — shared monthly review panel.

No stars, moons, suns, achievement ledger, or partner path.

## 4. Copy / Framing

- Hunter view tagline: "Measured by achievements and influence."
- Operational view tagline: "Measured by capability and mastery."
- Both screens explicitly state the path name so staff understand the system is intentional, not a downgrade.

## Technical Notes

- All changes are frontend-only (data + components in `src/routes/index.tsx` and `src/lib/employee-data.ts`).
- No new routes, no backend, no new dependencies.
- Existing hunter logic stays intact; this is additive plus a top-level branch.
