# FREEZE RECORD — Odyssey Environment Separation V1

Status: **FROZEN (code/release layer)** · Version: V1 · Date: 2026-08-21

Authoritative constraint document. Future agents must not weaken these rules.

---

## 1. Environments

| Channel | Purpose | Changes how | Sandbox tools |
|---|---|---|---|
| PROTOTYPE | Director + Lovable development | Every edit, instantly | Prototype Mode enabled |
| ODYSSEY BETA · V1 | Real Hunter testing | Only via explicit Publish/Update | Prototype Mode hidden |
| PRODUCTION | Reserved | Not implemented | — |

Resolution lives in `src/lib/environment.ts` (hostname based). The badge in
`src/components/environment-badge.tsx` is mounted in `src/routes/__root.tsx`
and is visible on every screen (bottom-left), so the channel never has to be
inferred from the URL.

## 2. URLs

- **Prototype (development/preview):**
  `https://id-preview--6451517a-2659-4495-b214-acf46e0f2711.lovable.app`
  — also every local/dev host.
- **Beta V1 (published release):** `https://star-rank-craft.lovable.app`

Beta only changes when someone clicks Publish → Update. Prototype edits do not
reach Beta automatically. That is the release/promotion boundary.

## 3. Database / Auth — CURRENT TRUTH

> **Prototype and Beta still share ONE Lovable Cloud backend project.**
> Same database, same Auth user pool, same storage.

Therefore the following are **NOT** isolated today:
`staff`, `staff_identities`, `rpg_identity`, `user_roles`,
`monthly_evaluations`, `ranks`, `achievement_records`, `achievement_claims`,
Peer Insights / Leaderboard source data, and Auth users.

Lovable cannot provision a second backend project for the same app from inside
this project, so no fake isolation was implemented. The remaining manual step
is documented in §5.

Mitigations already in place:
- Prototype Mode sandbox (test profiles/overlays) is **client-side only** and is
  now hidden entirely outside the Prototype channel, so it cannot be driven
  against the Beta release.
- Beta account creation is gated: `activateBetaAccount` only accepts emails that
  a Director pre-created on an active `staff` row. No public sign-up.

## 4. Auth flow (unchanged, frozen)

1. Director creates the Staff Identity with the Hunter's email.
2. Hunter opens `/auth` → Activate account → same email + own password.
3. Department, Class, Rank and Authority come from the Staff Identity. The
   Hunter can never choose them.

## 5. Required manual step for true data isolation

To give Beta its own database and Auth pool:

1. Create a **second Lovable project** (the Beta project) from the current
   frozen Prototype code, and enable Lovable Cloud on it.
2. Apply the schema reproducibly: run every file in `supabase/migrations/`
   in filename order against the new project. Do not hand-edit SQL.
3. Seed only reference data (ranks, achievements, review templates). Do **not**
   copy Prototype staff, evaluations, claims or Auth users.
4. Publish that project → that URL becomes Beta V1; add its hostname to
   `BETA_HOSTS` in `src/lib/environment.ts`.
5. Keep the current project as Prototype. Never delete its data.

Until step 1–4 are done, Beta and Prototype share data. Do not tell Hunters
otherwise.

## 6. Promoting a future freeze to Beta V2

1. Stabilise Prototype; confirm typecheck/build clean.
2. Bump the label in `src/lib/environment.ts`
   (`BETA_VERSION_LABEL = "ODYSSEY BETA · V2"`).
3. Write any new migrations into `supabase/migrations/` and apply them to the
   Beta backend **through migrations only**.
4. Publish/Update the Beta deployment.
5. Append a section to this document recording date, scope and migrations.

## 7. Never do this in Beta

- Never edit Beta data by hand to "fix" a Hunter's score; use Director Override
  so it is audit-logged.
- Never run Prototype seed/test-profile data against Beta.
- Never change performance calculation, ABCD grade logic, ranking rules, the
  Five Core Systems, the frozen Identity Taxonomy, or Peer Insights visibility
  as part of an environment/release change.
- Never apply schema changes to Beta outside `supabase/migrations/`.
