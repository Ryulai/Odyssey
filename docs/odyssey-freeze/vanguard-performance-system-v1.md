# Vanguard Performance System V1 — FROZEN

Status: **FROZEN — V1**
Date: 2026-09-24
Class: **Vanguard (Waiter)** · Department: **Warrior**
Source of truth: the user-supplied document *"ODYSSEY — VANGUARD PERFORMANCE SYSTEM V1 / STATUS: FROZEN V1"*.
V1 is immutable. Any future change must be labelled **V2 Proposal** and must never silently modify V1.

## 1. Purpose

- Measures how well a Vanguard performs during a month, focusing on **quality of work** rather than
  mere completion.
- Used as reference for: Monthly Performance, Performance Recognition, Performance Ranking,
  Bonus/Incentive, Year-End Reward.
- Performance stays **separate** from Promotion, Capability, and Ownership.

## 2. Core Formula — FROZEN

    Vanguard Monthly Performance = 70% Guild Performance + 30% Class Performance = 100%

The 70/30 structure is frozen.

## 3. Guild Performance — 70%

Four dimensions, each **17.5%**:

| Dimension                  | Weight |
| -------------------------- | ------ |
| Professionalism            | 17.5%  |
| Culture                    | 17.5%  |
| Service Excellence         | 17.5%  |
| Teamwork / Communication   | 17.5%  |

Each dimension is reviewed monthly by the Leader using **1–5 Stars**.

## 4. Star System

- 1 Star = Critical
- 2 Stars = Developing
- 3 Stars = Certified / meets standard
- 4 Stars = Above Standard
- 5 Stars = Exceptional

Frozen interpretation: **3 Stars is normal/acceptable standard, not a negative score.**
**5 Stars should be rare** and reserved for clearly exceptional performance.

## 5. Monthly Leader Review

Monthly managerial judgment; fast, fair, consistent, low management burden. No requirement for
daily logging, extensive evidence collection, long reports, or item-by-item deductions.

## 6. Evidence Principle

Evidence supports judgment; evidence is **NOT** an automatic score. Evidence is suggested
particularly for: 1–2 Stars, 5 Stars, major changes, major events, serious complaints, special
praise, major violations, or clear impact on team/customers.

## 7. Class Performance — 30%

Three directions, each **10%**:

| Direction                | Weight | Calculation Formula                              |
| ------------------------ | ------ | ------------------------------------------------ |
| Attendance & Reliability | 10%    | **Not Yet Frozen / V2 discussion required**      |
| Work Compliance          | 10%    | **Not Yet Frozen / V2 discussion required**      |
| Reliability & Execution  | 10%    | **Not Yet Frozen / V2 discussion required**      |

Their internal calculation formulas are **NOT YET FROZEN**. They must not be invented.

## 8. Guild vs Class Performance

- **Guild Performance** = quality of contribution / work quality.
- **Class Performance** = whether objective/basic occupational requirements are met.

The distinction is preserved; the two must not be collapsed into one concept.

## 9. Performance ≠ Capability

- Performance = current work performance quality.
- Capability = what the person is capable of doing.
- Ranking = capability/growth level.
- Ownership = responsibility scope/participation.
- Position = combined outcome of relevant Odyssey systems such as Ranking + Secondary Class + Ownership.

High Performance does **not** automatically mean Promotion.

## 10. Performance ≠ Achievement

Achievement is independent. **Full Attendance is an Achievement/Recognition item** and must NOT
directly add Performance Score.

## 11. Performance Grade

| Grade       | Range    |
| ----------- | -------- |
| A / Alpha   | 90–100   |
| B / Beta    | 80–89    |
| C / Certified | 60–79  |
| D / Delta   | below 60 |

C is **Certified** — it must not be renamed Gamma.

## 12. Management Principle

**Minimum Management Burden.** The system must remain practical for Leaders managing 20–30
employees alongside operations, sales, scheduling, training, customer issues, team management,
cost control and business growth.

## 13. Core Performance Principle

*"Performance measures quality of contribution, not merely completion of duty."*

The four distinctions:

- **Capability** = what a person can do.
- **Performance** = how well they currently perform.
- **Achievement** = milestones specially recognized.
- **Ranking** = current capability level and growth stage.

## 14. V1 Frozen List

1. 70% Guild Performance + 30% Class Performance = 100%.
2. Guild Performance: Professionalism, Culture, Service Excellence, Teamwork / Communication —
   17.5% each.
3. Each Guild dimension reviewed monthly by the Leader, 1–5 Stars.
4. Star meanings: 1 Critical · 2 Developing · 3 Certified (meets standard) · 4 Above Standard ·
   5 Exceptional.
5. 3 Stars is normal/acceptable, not negative; 5 Stars is rare.
6. Monthly Leader Review: fast, fair, consistent; no daily logging, no long reports, no
   item-by-item deductions.
7. Evidence supports judgment; evidence is not an automatic score.
8. Class Performance directions: Attendance & Reliability, Work Compliance, Reliability &
   Execution — 10% each.
9. Guild = quality of contribution; Class = basic occupational requirements. Kept distinct.
10. Performance ≠ Capability; high Performance does not automatically mean Promotion.
11. Performance ≠ Achievement; Full Attendance never adds Performance Score.
12. Grades: A/Alpha 90–100, B/Beta 80–89, C/Certified 60–79, D/Delta below 60.
13. Minimum Management Burden (Leaders with 20–30 employees).
14. Core principle: quality of contribution, not mere completion.
15. Design direction: Simple, Fast, Fair, Useful, Sustainable.

## 15. Not Yet Frozen — placeholders only, NO formulas

- Attendance detailed deduction formula
- Work Compliance calculation
- Reliability & Execution calculation
- Class Performance evidence details
- Detailed 1–5 Star anchor examples
- Leader Calibration process
- Year-End Reward calculation

These items remain unresolved and are marked for **V2 discussion**. No formula may be assigned to
them in V1.

## 16. Design Direction

**Simple, Fast, Fair, Useful, Sustainable.** Long-term Performance History without excessive
management burden.

---

## Prototype representation status (2026-09-24)

- `src/routes/professional-performance.tsx` — the Vanguard template already displays the frozen
  structure: 70/30, four Guild dimensions at 17.5 pts with 1–5 star selectors, the three Class
  Performance directions at 10 pts each marked **"Calculation Formula: Not Yet Frozen / V2
  discussion required"** (no scoring UI), and the A/B/C/D grade mapping.
- `src/lib/reviews.functions.ts` — computes total/100 and A/B/C/D from Guild + Class raw values;
  no invented Class formulas.
- This document is the authoritative V1 compilation. Nothing in section 15 is implemented.
