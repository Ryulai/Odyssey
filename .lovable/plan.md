# Showcase IA Redesign — "A Hunter's Journey"

Reframe `/showcase/*` from a sidebar app into a **linear, cinematic journey** through 12 acts. Production system, auth, and DB stay untouched.

## Guiding principle

The Showcase is not navigation — it is a **guided story**. Each page answers one question in the Hunter's arc, and each page hands the visitor to the next. Sidebar remains available for jumping around, but the primary flow is forward.

## The 12 Acts

| # | Route | Question it answers | Feel |
|---|---|---|---|
| 1 | `/showcase` (Welcome) | "What is Odyssey?" | Cinematic cold-open. Logo, one line of philosophy, single CTA: *Begin*. No character yet. |
| 2 | `/showcase/choose-hunter` | "Whose journey?" | Full-screen character select. 5 portraits as tarot-style cards. Pick one → journey begins. |
| 3 | `/showcase/journey-map` | "Where am I in the world?" | The world map. Current rank glows; branching paths revealed at Gold. |
| 4 | `/showcase/profile` | "Who am I?" | Hunter identity card: bio, titles, current season. |
| 5 | `/showcase/performance` | "How am I doing right now?" | This month's Behaviour / Direction / Contribution / Result. |
| 6 | `/showcase/achievements` | "What have I earned?" | Steam-style gallery of unlocked + locked stars. |
| 7 | `/showcase/rank` | "How far have I walked?" | Vertical rank ladder Apprentice → Legend. |
| 8 | `/showcase/secondary-class` | "What else am I becoming?" | Sub-identity cards, unlocked at Gold. |
| 9 | `/showcase/mentorship` | "Who have I helped grow?" | Mentees + influence score. |
| 10 | `/showcase/ownership` | "What can I become?" | Explorer → Shareholder ribbon. |
| 11 | `/showcase/timeline` | "What is my story so far?" | Vertical milestone scroll. |
| 12 | `/showcase/future-vision` (new) | "Where is Odyssey going?" | Closing act. The vision pitch for shareholders/investors — what Odyssey becomes at scale. Ends with *Restart Journey* / *Choose Another Hunter*. |

## Flow mechanics

- **Every page gets a footer nav**: `← Previous Act` · `Act N of 12` · `Next Act →`. This is the primary path.
- **Sidebar stays** for random access, but visually recedes (thinner, secondary).
- **Progress ribbon** at top shows all 12 acts as dots; current one glows gold.
- **Act 1 & 2 are full-bleed** (no sidebar, no header) — pure cinematic intros.
- **Act 12 (Future Vision)** is the only new page. Content: three panels — *The Guild Today*, *The Guild at 100 Hunters*, *The Guild as an Economy* — pitched at investors.

## Route changes

- Rename: `/showcase/journey-map` stays; `/showcase/timeline` → keep slug, relabel as "Journey Timeline" in nav.
- New: `/showcase/welcome` becomes the new `/showcase` index; current `showcase.index.tsx` (Hero Profile) is absorbed into Act 4 Profile.
- New: `/showcase/choose-hunter` (extracted from top-right `CharacterSwitcher` — switcher stays for power users but the choose step becomes the canonical entry).
- New: `/showcase/future-vision`.

## Sidebar reorder

Match the 12-act order exactly. Group visually:
- **Prologue**: Welcome, Choose Hunter
- **The Hunter**: Journey Map, Profile, Performance, Achievements
- **The Path**: Rank, Secondary Class, Mentorship, Ownership
- **The Story**: Timeline, Future Vision

## What does NOT change this pass

- No visual redesign of individual page interiors yet (that comes next, per act).
- No changes to `/`, `/auth`, `/admin`, `/career`, `/codex`, or any production route.
- No DB, no auth, no server functions touched.
- Character data (`src/lib/showcase/characters.ts`) unchanged — only new `futureVision` fixture added.

## Technical notes

- New files: `src/routes/showcase.welcome.tsx` (or reuse index), `src/routes/showcase.choose-hunter.tsx`, `src/routes/showcase.future-vision.tsx`, `src/components/showcase/act-nav.tsx` (prev/next footer), `src/components/showcase/act-progress.tsx` (top dots ribbon).
- `src/routes/showcase.tsx` layout gains a conditional: full-bleed for acts 1–2, standard shell for 3–12.
- `ACT_ORDER` array in `src/lib/showcase/acts.ts` drives sidebar, progress ribbon, and prev/next nav — single source of truth.

## Deliverable of this plan

Approve the IA. After approval, implementation happens in one pass: new routes + nav components + sidebar reorder, no interior redesigns.
