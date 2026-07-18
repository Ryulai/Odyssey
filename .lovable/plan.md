## Goal

Update the Performance Review system to (1) rename the "Tanker" specialization to "Vanguard" in all display text, (2) add a dedicated Warrior review template so Warrior-class employees can be reviewed, and (3) keep Vanguard on the placeholder page with an updated message. Preserve the "one template per Class" architecture.

## Changes

### 1. Rename Tanker → Vanguard (display only)

`src/lib/rpg.ts`
- In `CLASS_ROLES.warrior`, change the entry `{ key: "tanker", label: "Tanker" }` to `{ key: "tanker", label: "Vanguard" }`.
- Keep the stable database key `tanker` untouched (staff rows and identity rows already reference it; changing the key would require a data migration and break IDs, which the user explicitly asked to avoid).

`src/routes/professional-performance.tsx`
- In `KNOWN_CLASSES_WITHOUT_TEMPLATE`, the `vanguard` entry already exists — keep it. Ensure the `tanker` key also maps to the display name "Vanguard" so employees whose stored role is `tanker` see "Vanguard" in the placeholder header and message.

Any other user-facing "Tanker" strings surfaced by the rename get the "Vanguard" label automatically through the `roleLabel()` helper in `rpg.ts`.

### 2. Add Warrior Performance Review template

`src/routes/professional-performance.tsx`
- Add a new `WARRIOR_TEMPLATE: ReviewTemplate` with:
  - `id: "warrior_review_v1"`, `classKey: "warrior"`, `className: "Warrior"`.
  - `behaviourWeight: 0.5`, same 50/50 split as Hunter (matches frozen framework).
  - `objective`: `sales_vs_target`, monthly target `RM50,000`, target note `"fixed for all Warriors"` (temporary placeholder objective — noted as such in a code comment; can be replaced once the Warrior-specific KPI is designed).
  - `categories`: 4 temporary behaviour categories with clearly labelled placeholder copy (Customer Focus, Team Collaboration, Execution & Discipline, Growth & Learning). Marked in a header comment as "temporary placeholder categories — replace when the Warrior template is finalised".
  - `referenceNote`: same "pick the ONE description that best represents…" wording.
- Register in `TEMPLATES`: `{ hunter: HUNTER_TEMPLATE, warrior: WARRIOR_TEMPLATE }`.
- The template is fully independent from Hunter (its own object, its own `id`, its own categories) — future edits to Hunter never touch Warrior.

This unlocks the Warrior review form for any staff whose `primary_role` equals `warrior`. Warrior-guild employees with a specialization (`tanker`/vanguard, `alchemist`, `blacksmith`, `tinker`) still resolve by their specialization key and continue to show the placeholder until each has its own template — matches the frozen "one template per Class, never substitute" principle.

### 3. Keep Vanguard locked, refresh placeholder copy

`src/routes/professional-performance.tsx` (placeholder rendering for `status === "pending"`)
- Update the copy to the exact message requested:
  ```
  Vanguard Review Template is under development.
  This employee's Class is {className}.
  They cannot be reviewed until the {className} template is completed.
  Every Class in Odyssey has its own unique Performance Review Template.
  Please do not substitute another Class's review form.
  ```
- The template dynamically inserts the resolved `className`, so Vanguard, Alchemist, Mage, etc. each get correct copy without hard-coding "Vanguard" per class.

### 4. Architecture preserved

- `resolveTemplate()` remains keyed on `staff.primary_role` — no fallback to parent guild, no cross-class substitution.
- `TEMPLATES` stays an append-only registry.
- Adding future Class templates continues to be: create a new `X_TEMPLATE` constant and register it in `TEMPLATES`.

### Verification

- Automatic typecheck/build after edits.
- No DB migration, no schema change, no server function change.

## Non-goals

- Not renaming the DB key `tanker` (would require a data migration and break existing identity/staff rows — the request explicitly says "do not break existing IDs if unnecessary").
- Not designing the final Warrior behaviour categories — using temporary placeholders as the request allows.
- No changes to routing, permissions, or Director Mode.
