## Odyssey Showcase Mode — Premium Demo Experience

A separate, presentation-grade experience layered on top of the existing app. No auth, no database, no employee data — pure demo storytelling for shareholders and investors. Built as a self-contained route tree so it never contaminates production flows.

---

### 1. Entry & Isolation

- New route tree under `/showcase/*` (own `_layout` with its own sidebar, header, background, and typography treatment).
- Landing at `/showcase` — no auth gate. Add a discreet "Enter Showcase" link from `/` for internal use.
- Existing employee routes (`/admin`, `/career`, `/professional-performance`, etc.) untouched.
- Uses existing design tokens; extends `src/styles.css` with a `showcase` scope (deep black, gold `#D4AF37`-family, warm dark gray, ambient glow shadows, serif display + clean sans body).

### 2. Showcase Character Switcher (top-right)

Five demo characters, each with a full fabricated dataset:

| Character | Rank | Tenure | Role hint |
|---|---|---|---|
| Ben | Bronze Hunter | 2 weeks | Newcomer |
| Bull | Silver Hunter | 8 months | Reliable |
| Ryan | Gold Hunter | 2 years | Unlocks Sub Class |
| Ethan | Platinum Hunter | — | Team Leader |
| Alex | Legend Hunter | — | Partner |

- Switching instantly re-renders every showcase page.
- State lives in a `ShowcaseContext` (React context + `useState`), persisted to `localStorage` under `odyssey.showcase.character`.
- All data comes from a static `src/lib/showcase/characters.ts` fixture (portraits, ranks, achievements, timeline, mentees, ownership stage, performance history, sub-class trees).

### 3. Sidebar (showcase-only)

Home · Journey Map · Hunter Profile · Achievements · Performance · Class Rank · Secondary Class · Mentorship · Ownership · Journey Timeline

Vertical, icon + label, active item glows gold, collapsible on mobile.

### 4. Pages

Each page is a full storytelling surface, not a dashboard. All pull from the active character fixture.

- **Home (Hero Profile)** — Full-bleed portrait, rank crest, name, tenure, current mission card, current season banner, performance score orb, current goal.
- **Journey Map** — Interactive vertical spine (Apprentice → Legend) with the current rank glowing center. From Gold, branching paths fan out (Trainer, Leadership, Content Creator, Mixologist, Operations, Business, Ownership, Partner, Shareholder). SVG paths, animated glow on unlocked, dimmed on locked. Feels like a skill tree, not an org chart.
- **Hunter Profile** — Identity card, stats, class lineage, titles, current focus.
- **Achievements** — Steam-style grid. Each tile: icon, name, description, quote, unlock date, progress bar. Locked tiles show silhouette + "???".
- **Performance** — Card layout: Overall, Behaviour, Direction, Contribution, Result, Growth Trend, Current Focus. Visual, no tables.
- **Class Rank** — Vertical progression ladder Apprentice → Legend. Current rank glows. Gold node annotated: "Secondary Class unlocked · Mentorship unlocked · Advanced Missions unlocked".
- **Secondary Class** — Grid of skill trees (Trainer, Mixologist, Content Creator, Leader, Brand Ambassador, Operations). Each: level, progress bar, next unlock, description.
- **Mentorship** — Mentee relationship cards, mentorship score, people helped, growth influence gauge.
- **Ownership** — Horizontal journey ribbon: Explorer → Guardian → Partner Candidate → Partner → Business Partner → Shareholder. Current stage lit.
- **Journey Timeline** — Vertical timeline of milestones with icons and dates, ending with a "Future Goal" node.

### 5. Micro-interactions

- Framer Motion fade/slide on route change.
- Gold glow pulse on active rank/achievement nodes.
- Hover lift + soft shadow on all cards.
- Animated progress fills on mount.
- Achievement unlock shimmer on tile hover.

### 6. Assets

- 5 character portraits (generated, premium quality, consistent art direction — dark fantasy realism).
- Rank crest icons (Apprentice → Legend) — SVG or generated PNG.
- Achievement icons — reuse Lucide + a small generated set for signature achievements.

### 7. Out of scope

- No backend writes, no Supabase queries, no server functions in `/showcase/*`.
- No changes to existing employee routes, admin, or Codex.
- No editing of demo data from the UI (read-only presentation).

---

### Technical notes

- Routes: `src/routes/showcase.tsx` (layout with `<Outlet />` + sidebar + character switcher), `showcase.index.tsx` (Home), `showcase.journey-map.tsx`, `showcase.profile.tsx`, `showcase.achievements.tsx`, `showcase.performance.tsx`, `showcase.rank.tsx`, `showcase.secondary-class.tsx`, `showcase.mentorship.tsx`, `showcase.ownership.tsx`, `showcase.timeline.tsx`.
- Data: `src/lib/showcase/characters.ts` (typed fixture), `src/lib/showcase/context.tsx` (provider + `useShowcaseCharacter()`).
- Components: `src/components/showcase/` — `ShowcaseSidebar`, `CharacterSwitcher`, `RankLadder`, `JourneyMap`, `AchievementTile`, `PerformanceCard`, `SkillTree`, `OwnershipRibbon`, `TimelineNode`, `HeroPortrait`.
- Styling: extend `src/styles.css` with showcase tokens (`--sc-gold`, `--sc-gold-glow`, `--sc-obsidian`, `--sc-ash`, `--sc-shadow-glow`) inside `@theme`.
- `head()` on each route with unique titles.
- Framer Motion already available; if not, add it in the same batch as the first component that needs it.

### Build order

1. Route shell + layout + sidebar + character switcher + context + fixture data (all 5 characters, full data shape).
2. Home hero + Class Rank ladder (establishes visual language).
3. Journey Map (signature page — most attention here).
4. Achievements + Timeline.
5. Performance + Secondary Class + Mentorship + Ownership.
6. Portraits + polish pass (animations, glow, spacing).
