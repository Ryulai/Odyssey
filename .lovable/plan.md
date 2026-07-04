# Prototype Mode

Client-only demo layer. Zero changes to server functions, database, RLS, or progression logic. Everything lives in `localStorage` and is read by UI components through a single hook. When Prototype Mode is off, the app behaves exactly as today.

## Scope

In:
- A Prototype Mode toggle + editor UI.
- Multiple demo employee profiles the user can switch between.
- Per-profile: Rank, Primary Class, multiple Secondary Classes (each with independent rank/progress), Monthly Performance, Legacy, Collections, Business Unit, Fleet, Manager.
- Unlock all ranks (incl. Apprentice, Master) and the Secondary Class system while Prototype Mode is on.

Out (untouched):
- `evaluate_rank`, promotion RPCs, DB schemas, RLS, server functions.
- Real user's staff row, real progression, real claims.

## Architecture

```text
src/lib/prototype/
  types.ts         demo profile + prototype-state types
  ranks.ts         PROTOTYPE_RANKS (Apprentice…Legend, all unlocked)
  seed.ts          3-4 seeded demo profiles
  store.ts         localStorage-backed store + subscribe()
  use-prototype.ts React hook: state, setEnabled, setActiveProfile, updateProfile
src/components/prototype/
  prototype-toggle.tsx     header/menu switch
  prototype-panel.tsx      floating drawer: profile picker + editors
  profile-editor.tsx       edit rank/class/secondaries/perf/legacy/collections
src/routes/system.prototype.tsx  full-page editor (linked from System menu)
```

- `store.ts` exposes `getState`, `setState`, `subscribe`. Persist key: `odyssey.prototype.v1`.
- `use-prototype()` returns `{ enabled, profiles, activeProfileId, active, actions }` and re-renders on store changes.
- No context provider needed; the hook subscribes directly.

## Integration points (read-only overlay)

Each of these already reads real data. Add a small adapter: if `prototype.enabled && prototype.active`, merge the demo profile over the real payload before render. No writes.

- `src/routes/profile.tsx` — name, rank, primary class, guild, motto, secondary classes list.
- `src/routes/index.tsx` — homepage portrait/rank chip.
- `src/routes/secondary-class.tsx` — replace the hard-coded `SECONDARY.unlocked = false` block with prototype's `active.secondaries[]`, rendered as independent cards (rank, progress, role).
- `src/lib/rpg.ts` — extend `RANKS` with `apprentice` and `master` entries (label/glyph/identity, `unlocked: false`). Progression code already treats `unlocked` as advisory; Prototype Mode ignores it in UI.
- `src/components/portrait.tsx` — accept optional override for initials/rank color from active demo profile.

## UI

- **Toggle**: small "Prototype" pill in the top-right of `__root.tsx` header (dev-only styling, amber). Off by default.
- **Panel** (opens from toggle):
  - Profile switcher (seeded: "Apprentice Ranger", "Gold Mage + Scholar", "Legend Guardian + 3 secondaries", plus "New blank").
  - Inline editors: Rank (select all 9), Primary Class (select), Secondary Classes (add/remove chips, each with its own Rank + progress slider), Monthly Performance grade, Legacy stars, Collections toggles, Business Unit / Fleet / Manager text fields.
  - "Reset to seed" and "Clear all" buttons.
- **Full editor route** `/system/prototype` for larger screens, same controls.

## Safety

- Prototype state is scoped to `localStorage` on the device — never sent to the server.
- All server functions continue to run untouched; if Prototype Mode is on, we simply overlay their results in the render layer.
- A visible amber "PROTOTYPE" badge appears in the header whenever the mode is on, so it can't be confused with real data.

## Deliverables

New files listed above + edits to `profile.tsx`, `index.tsx`, `secondary-class.tsx`, `rpg.ts`, `portrait.tsx`, `__root.tsx`, `system.index.tsx` (add "Prototype Mode" entry).
