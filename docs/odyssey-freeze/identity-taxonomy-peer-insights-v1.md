# FREEZE RECORD — Odyssey Identity Taxonomy & Peer Insights V1

- **Status:** FROZEN
- **Version:** V1
- **Date frozen:** 2026-08-21
- **Scope:** Identity architecture + Peer Insights visibility for Beta V1
- **Authority:** This document is an authoritative implementation constraint. Future agents and contributors must not contradict it. Changing it requires an explicit new freeze record.

---

## 1. Frozen definitions

### Department
Exactly four major Odyssey career domains / races:

- Warrior
- Mage
- Priest
- Ranger

No other Department exists. "Guardian" is **not** a Department.

### Class
A specific career/class inside a Department. Examples:

- Ranger → Hunter, Sniper, …
- Warrior → Vanguard, Alchemist, …

Class lists come from existing configuration/database only. Never invent a class to populate UI.

### Profession
**Not used in Odyssey.** No separate Profession layer may be created or maintained.

### Role / Authority
Organizational responsibility and access authority, independent of Department/Class:

- Staff
- Manager
- Director

### Canonical identity

```text
Department      = Ranger
Class           = Hunter
Role/Authority  = Staff
```

Do **not** model identity as Department → Class → Profession → Role.

---

## 2. Implementation mapping (compatibility layer, no schema rename)

| Concept | Source of truth in code | Persisted column(s) |
| --- | --- | --- |
| Department | `src/lib/taxonomy.ts` (`DEPARTMENTS`, `toDepartmentKey`) | `staff_identities.class_key`, `rpg_identity.primary_class` |
| Class | `src/lib/taxonomy.ts` (`classesOf`, `odysseyClassLabel`) sourced from `CLASS_ROLES` in `src/lib/rpg.ts` | `staff_identities.role_key`, `rpg_identity.primary_role` |
| Role / Authority | `src/lib/taxonomy.ts` (`Authority`) | `user_roles.role` (`director` / `manager` / `staff`) |

Legacy compatibility: the stored department value `guardian` **is** the Priest Department. It is translated on read (`toDepartmentKey`) and written back unchanged (`departmentDbKey`) so existing rows and validation triggers keep working. Database columns were deliberately **not** renamed.

---

## 3. Peer Insights visibility (frozen)

- **Staff / Hunter:** only peers in the **same Department and same Class**.
- **Manager:** only the Department/Class scope their organizational authority covers (own Department, all its Classes, limited to their business unit). Never unrelated Departments.
- **Director:** organization-wide across all Departments and Classes.
- Unauthorized tabs may be visibly locked, but **unauthorized peer rows must never be returned by the backend.** Locked tabs must not issue a request; the server refuses out-of-scope requests independently.

Enforcement lives in `getPeerInsights` (`src/lib/peers.functions.ts`); the UI in `src/routes/peer-insights.tsx` only renders the server-issued `departments[]` / `classes[]` tabs and their authoritative `unlocked` flags.

---

## 4. Peer Insights public data (frozen)

Allowed:

- Name
- Rank
- Fleet / location
- Overall Score
- Overall Grade (A / B / C / D)
- Trend
- Achievements count

Never exposed in public Peer Insights:

- Behaviour score
- Direction score
- Contribution score
- Result score
- Manager notes
- Private comments
- Salary

---

## 5. Terminology rule

**Overall Grade (A / B / C / D)** is the Hunter's final Performance Grade. It is a different concept from the four **Performance Sections**: Behaviour, Direction, Contribution, Result. The four sections must never be labelled A/B/C/D, and must never appear in public Peer Insights.

---

## 6. Non-change rule

This freeze does not change:

- Performance calculations
- ABCD Grade logic
- Ranking calculation and Rank progression rules
- Monthly Evaluation calculation
- The Five Core Systems
- Authentication architecture

---

## 7. Files owning this freeze

- `src/lib/taxonomy.ts` — Department / Class / Authority definitions and compatibility mapping
- `src/lib/peers.functions.ts` — server-side visibility enforcement
- `src/routes/peer-insights.tsx` — Department tabs (Warrior | Mage | Priest | Ranger) → Class tabs, locked states
