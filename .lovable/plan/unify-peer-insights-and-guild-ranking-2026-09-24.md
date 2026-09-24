# Unify Peer Insights and Guild Ranking

## Goal
Make `/peer-insights` the single competitive performance view, using its existing visual language while combining Rank, Score, Grade, Trend, identity, and achievement count on each employee card.

## Experience
- Rename the page to **Peer Insights / Guild Ranking**.
- Keep Year and Month selectors; every result updates to the selected month.
- Each employee card/list row shows:
  - Department ranking position
  - Employee name, Department, and Class
  - selected-month Performance Score and Performance Grade
  - existing month-to-month Trend indicator and numeric change versus the immediately previous month
  - existing achievement count as the only secondary statistic
- Preserve the current highlighted “You” state, empty states, and private-data notice.
- Remove duplicated promotion details, score breakdowns, and public-profile presentation from the old Leaderboard.

## Filters and ranking isolation
- Normal employees remain restricted to their existing Department/Class peer scope.
- Managers and Directors retain the broader supervisor groups: **All, Warrior, Mage, Priest, Ranger, Manager**.
- **All** renders separate ranking sections; it never combines people into one ranking.
- Department sections contain Staff-level employees only. Manager-level people appear only in the Manager ranking. Directors are excluded.
- Keep Class filtering within a selected Department. Filtering the visible cards by Class will not recalculate positions: displayed positions remain the employee’s rank within their full Department, matching the existing Leaderboard rule.
- Locked or manipulated group/Class requests return no unauthorized data because scope is resolved and checked on the server.

## Data reuse
- Consolidate the existing Peer Insights trend and achievement data with the Leaderboard’s group isolation and ranking position in the Peer Insights server response.
- Continue reading stored monthly Performance scores and Grades; compare against the immediately previous stored month using the existing trend thresholds.
- Do not modify Performance scoring, Grade calculation, promotion/ranking calculations, monthly evaluation records, Achievement rules, or database structure.
- Do not select or expose manager notes, Behaviour details, salary, or private comments.

## Navigation cleanup
- Keep `/peer-insights` as the canonical page.
- Preserve the old `/leaderboard` URL by redirecting it to `/peer-insights`.
- Replace the two dashboard links with one **Peer Insights / Guild Ranking** link.
- Leave Team Review Preview, Team Grades, and unrelated systems unchanged.

## Verification
- Run the project’s automated type and production checks.
- Verify the unified page at desktop and mobile sizes when an authenticated preview session is available.
- Verify normal employee scope, Manager/Director group access, Department/Manager isolation, All-group separation, Class filtering without rank recalculation, selected-month Score/Grade, previous-month Trend, and rejected unauthorized group/Class requests.
- Do not publish.

## Expected files
- `src/lib/peers.functions.ts` — unified authorized query and grouped ranking payload.
- `src/routes/peer-insights.tsx` — unified filters and enriched Peer Insights cards/list.
- `src/routes/leaderboard.tsx` — compatibility redirect only.
- `src/routes/index.tsx` — replace duplicate links with one entry.
