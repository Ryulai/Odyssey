# Showcase IA — "A Hunter's Journey" (v2)

Refinement pass on the frozen 12-Act IA. Same isolation rules: no production
routes, no auth, no DB, no character-fixture rewrites beyond what's listed.

## The 12 Acts (updated order + names)

| #  | Route                          | Question                              | Feel |
|----|--------------------------------|---------------------------------------|------|
| 1  | `/showcase`                    | "What is Odyssey?"                    | Cinematic cold-open. |
| 2  | `/showcase/choose-hunter`      | "Whose journey?"                      | Full-screen character select. |
| 3  | `/showcase/journey-map`        | "What worlds are open to me?"         | **World map / skill tree** (see §1). |
| 4  | `/showcase/hunter-card`        | "Who is this Hunter?"                 | **NEW cinematic character page** (see §5). |
| 5  | `/showcase/profile`            | "Who am I, in full?"                  | Bio + titles + season detail. |
| 6  | `/showcase/performance`        | "How am I doing right now?"           | Behaviour · Direction · Contribution · Result. |
| 7  | `/showcase/achievements`       | "What have I earned?"                 | Steam-style gallery. |
| 8  | `/showcase/rank`               | "How far have I walked?"              | Vertical rank ladder. |
| 9  | `/showcase/secondary-class`    | "What else am I becoming?"            | Sub-identity cards. |
| 10 | `/showcase/mentorship`         | "Who have I helped grow?"             | Mentees + influence. |
| 11 | `/showcase/ownership`          | "What can I become?"                  | Explorer → Shareholder. |
| 12 | `/showcase/timeline`           | "What is my story so far?"            | Milestone scroll. |
| 13 | `/showcase/horizon`            | "Where does the journey lead?"        | **Beyond The Horizon** — closing act (see §3, §4). |

> Emotional sequence: **Performance → Achievements → Class Rank** is preserved
> (acts 6 → 7 → 8): *I improve → I unlock → I grow into a higher class.*

## §1 — Journey Map becomes the heart

Journey Map is no longer just a rank ladder. It is the **world of Odyssey**.

Structure:

```text
                Apprentice
                    │
                  Bronze
                    │
                  Silver
                    │
                  ┌─Gold─┐        ← branching begins here
                  │      │
     ┌────────────┼──────┼────────────┐
     │      │     │      │     │      │
 Leadership Trainer Content Mixologist Ops
     │      │   Creator    │      │
     └──────┴──────┬───────┴──────┘
                   │
              Ownership
                   │
                Partner
                   │
              Shareholder
```

Rules:
- Locked branches render as ghost silhouettes with a faint icon and no label detail — **mysterious, not empty.**
- Unlocked branches glow in their rank's colour and animate softly on hover.
- Current rank pulses gold; walked path is a dim gold trail.
- Feel target: **Diablo IV skill tree / Marvel timeline**, never an org chart.
- No new fixture fields required — reuse `unlockedBranches` and expand the
  `BRANCHES` constant in `src/lib/showcase/characters.ts` to include
  `Leadership`, `Trainer`, `Content Creator`, `Mixologist`, `Operations`,
  `Ownership`, `Partner`, `Shareholder` (drop `Business`).

## §3 — Rename final act

- Route: `/showcase/future-vision` → `/showcase/horizon`
- Sidebar / progress ribbon label: **Beyond The Horizon**
- Head title: *Beyond The Horizon — Odyssey Showcase*

## §4 — Remove company-specific wording

Strip everything that only reads as one company. Applies primarily to the
Horizon page and any copy that leaked "guild"-flavoured phrasing.

| Replace                        | With                                    |
|--------------------------------|-----------------------------------------|
| The Guild                      | The Team / The Journey                  |
| The Guild Today                | The Team Today                          |
| The Guild at 100 Hunters       | The Journey at Scale                    |
| The Guild as an Economy        | The Journey as an Ecosystem             |
| "40+ Hunters", "100 Hunters"   | "Every Hunter", "At Any Scale"          |
| Fleets                         | Chapters                                |

Universal language so Showcase can be reused across businesses. Fantasy
identity words (Hunter, Rank, Class, Journey) stay — those are Odyssey, not
one company.

## §5 — Hunter Card (new act 4)

New page immediately after Journey Map: `/showcase/hunter-card`.
Feels like the moment you open a playable RPG character.

Layout (single full-height card, no dashboard density):

```text
┌─────────────────────────────────────────────┐
│  [Large Portrait]     HUNTER NAME           │
│                       Current Rank badge    │
│                       Journey Duration      │
│                                             │
│  ─── Current Mission ───                    │
│  ─── Current Season  ───                    │
│  ─── Current Title   ───                    │
│  ─── Current Goal    ───                    │
│  ─── Current Stars   ───                    │
└─────────────────────────────────────────────┘
```

Data mapping (all already in `ShowcaseCharacter`, no new fields needed):
- Portrait → `portraitGradient` + `portraitInitial`
- Name → `name`
- Current Rank → `rank`
- Journey Duration → `tenure`
- Current Mission → `currentMission`
- Current Season → `season`
- Current Title → `titles[0]`
- Current Goal → `currentGoal`
- Current Stars → count of unlocked achievements (rare = gold star, common = silver)

`/showcase/profile` (act 5) stays as the deeper identity view (bio, all
titles, performance snapshot).

## Files touched this pass

- `src/lib/showcase/acts.ts` — reorder, rename Future Vision → Beyond The
  Horizon, insert Hunter Card at position 4, shift Profile to 5.
- `src/lib/showcase/characters.ts` — update `BRANCHES` list per §1.
- `src/routes/showcase.journey-map.tsx` — expand branch grid, ghost-lock
  styling, add Ownership → Partner → Shareholder tail.
- `src/routes/showcase.hunter-card.tsx` — **new**.
- `src/routes/showcase.horizon.tsx` — **new** (replaces future-vision file).
- `rm src/routes/showcase.future-vision.tsx`.
- `src/components/showcase/sidebar.tsx` — reflects new labels/order via
  `ACTS` (no manual edits needed if driven by the array).

## Not touched

- Production routes, auth, DB, `src/lib/showcase/context.tsx`, character
  fixture data beyond the branch list.
- Interior redesigns of Performance / Achievements / Rank / Secondary /
  Mentorship / Ownership / Timeline.

Approve and I ship in one pass.
