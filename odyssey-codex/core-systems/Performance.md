---
Status: 🧊 Partially Frozen
Version: 1.0
Category: Core Systems
Priority: Critical
Last Updated: 2026-07-09
Freeze: Partial
---

# Performance System

## Definition

The Performance System measures a member's current contribution during a specific evaluation period.

It evaluates both responsibility and contribution using standardized criteria.

Performance reflects today's value.

It does not represent permanent growth.

---

# Purpose

The Performance System exists to:

- Create objective evaluations.
- Encourage continuous improvement.
- Recognize contribution.
- Support the Ranking System.

Performance measures current performance.

Ranking measures historical growth.

---

# Why

Organizations often evaluate only sales or results.

Odyssey evaluates contribution.

Results matter.

Behaviour matters.

Responsibility matters.

Growth matters.

Performance combines these elements into one evaluation.

---

# What is NOT

Performance is NOT:

- Personality
- Rank
- Salary
- Promotion
- Achievement
- Punishment

Performance only represents the current evaluation cycle.

---

# Current Architecture

Performance

↓

Direction

↓

Behaviour

↓

Review

↓

Score

↓

Grade

↓

Ranking Input

---

# Performance Structure

```text
Total Performance (100%)

├── Class Performance (50%)
│   Professional performance within a member's own Class.
│
└── Guild Performance (50%)
    Contribution beyond a member's Class responsibilities.
```


Performance Structure is shared across all professions.

Only the evaluation criteria inside Class Performance change between professions.

Guild Performance remains standardized across frontline professions unless explicitly stated otherwise.

Status:

🧊 Frozen

---

# Grade System

Current grading:

A

Outstanding

---

B

Above Standard

---

C

Certified

Completed expected responsibility.

This is NOT failure.

Certified represents reliable completion of expected work.

---

D

Below Expected Standard

Improvement required.

---

There is currently:

NO E

NO F

Status:

🧊 Frozen

---

# Current Principles

Performance evaluates:

- Responsibility
- Behaviour
- Contribution
- Professionalism

Performance does NOT evaluate:

- Personality
- Emotion
- Popularity

Status:

🧊 Frozen

---

# Hunter (Current Design)

Current Hunter design:

Sales

50%

Current target:

RM50,000

Future versions:

Customer Growth

Execution

Professional Behaviour

will gradually replace simple sales-only evaluation.

Status:

🟡 In Progress

---

# Relationship

Performance

↓

Ranking

↓

Secondary Class

↓

Mentorship

↓

Ownership

---

# Current Discussion

Different professions will have different KPI structures.

However,

all professions should inherit the same Performance Framework.

Only calculations change.

The Framework remains consistent.

---

# Design History

Originally,

Performance focused mainly on sales.

During discussion,

Odyssey shifted towards evaluating contribution rather than results alone.

"C = Certified"

became one of the defining characteristics of the grading philosophy.

---

# Parking Slot

- Waiter Formula
- Bartender Formula
- Cashier Formula
- Customer Growth Formula
- Direction Weight
- Behaviour Question Library

---

# Recovery Note

Performance is the foundation of Ranking.

When rebuilding Odyssey,

restore the Framework first,

then profession-specific calculations.

Never rebuild formulas before rebuilding the Performance Framework.
