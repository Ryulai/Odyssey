Plan: Rename page titles and labels only

Background
- `/professional-performance` currently displays as "Monthly Review".
- `/evaluations` currently displays as "Performance Review".
- The dashboard quick-nav lists both links with their current names.

Changes
1. `/professional-performance.tsx` (currently "Monthly Review") → display as "Performance Review"
   - Route head title
   - Meta description
   - Page H1 heading
   - Permission helper text
   - Submit/Resubmit button labels

2. `/evaluations.tsx` (currently "Performance Review") → display as "1111"
   - Route head title
   - Page H1 heading
   - Section/sub-section headings
   - Submit button label
   - Success/failure message text
   - Permission helper text

3. `/index.tsx` dashboard quick-nav
   - Change `Performance Review` link label to `1111` (still links to `/evaluations`)
   - Change `Monthly Review` link label to `Performance Review` (still links to `/professional-performance`)

Scope
- Only visible text labels change.
- Route paths, file names, data models, and business logic remain unchanged.
- After edits, run a typecheck/build to confirm no broken imports.