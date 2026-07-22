## Journey Map — Split Secondary Class from Ownership

Refinement to the frozen v2 plan. Journey Map's post-Gold section becomes **three distinct branches**, not one flat fan.

### New post-Gold structure

```text
                    Gold
                     │
      ┌──────────────┼──────────────┐
      │              │              │
  Secondary       Mentorship     Ownership
   Class            (single       (progression
      │              node)           tree)
  ┌───┼───┬───────┐                  │
  │   │   │       │            ┌─────┼─────┐
Trainer Leader  Content    Partner  Partner  Share-
        (ship)  Creator    Candidate         holder
        │
     Mixologist
```

Rules:
- **Secondary Class branch** — professions/identities. Contains: Trainer, Leader, Content Creator, Mixologist. (Drop Operations from the earlier v2 list; keep only these four to match this spec.)
- **Mentorship branch** — a single node under Gold, no children. Represents "who you help grow", not a profession.
- **Ownership branch** — a linear progression tree: Partner Candidate → Partner → Shareholder. Rendered vertically to signal it's a *path*, not a set of parallel choices.
- Locked nodes still render as ghost silhouettes with a faint icon; unlocked nodes glow in rank colour; current pulses gold.
- Feel target unchanged: Diablo IV skill tree, not org chart.

### Data model

`src/lib/showcase/characters.ts`:
- Replace the flat `BRANCHES` / `JOURNEY_BRANCHES` list with a grouped constant:
  ```ts
  export const JOURNEY_TREE = {
    secondaryClass: ["Trainer", "Leader", "Content Creator", "Mixologist"],
    mentorship: ["Mentorship"],
    ownership: ["Partner Candidate", "Partner", "Shareholder"],
  } as const;
  ```
- `unlockedBranches: string[]` on each character stays as-is (flat list of node labels); the tree constant just describes *where* each label renders.
- Update each character's `unlockedBranches` so any legacy values ("Business", "Operations", "Ownership", "Partner") map onto the new node names (e.g. "Ownership" → "Partner Candidate" or "Partner" depending on the character's stage). No new fields.

### UI

`src/routes/showcase.journey-map.tsx`:
- Replace the current single `BranchFan` under Gold with a three-column layout:
  - Column 1: **Secondary Class** header + 4 profession chips (grid).
  - Column 2: **Mentorship** header + single chip.
  - Column 3: **Ownership** header + vertical stack of 3 chips with connecting line, so it reads as a ladder.
- Each column gets its own small section title so the split is obvious.
- Legend card (right sidebar) gains a short line: "After Gold, the path splits into three: Secondary Class, Mentorship, Ownership."
- Keep the current rank spine (Apprentice → Bronze → Silver → Gold) and the walked/current/future styling exactly as-is.

### Not touched

- Act order, act names, `acts.ts`.
- Hunter Card (act 4), Beyond The Horizon rename, universal-wording sweep — all still in the v2 plan and land in the same build pass.
- `/showcase/secondary-class`, `/showcase/mentorship`, `/showcase/ownership` pages — unchanged.
- Production routes, auth, DB, character fixtures beyond the branch-name remap.

### Files this pass

- `src/lib/showcase/characters.ts` — swap `BRANCHES` for grouped `JOURNEY_TREE`; remap character `unlockedBranches` values.
- `src/routes/showcase.journey-map.tsx` — render the three-branch post-Gold layout.
- `.lovable/plan.md` — update §1 to reflect the split.

Approve and I ship this together with the rest of the v2 pass.
