# Odyssey Beta Password Recovery V1 — FROZEN

Status: **FROZEN — V1**
Date: 2026-08-21
Scope: Internal Beta only. No email/OTP delivery exists in this environment.

## Approved flow

1. Hunter clicks **Forgot your password?** on `/auth`.
2. App shows: *"Please contact your Director to reset your Odyssey account."* No email lookup, no
   confirmation of whether an address belongs to a staff account.
3. A Director (authority = `director` only) opens Admin → Staff and uses **Reset Hunter Password**
   on an activated staff row.
4. The server generates a 14-character random temporary credential, sets it as the account password,
   and stores only a SHA-256 hash in `public.password_resets` with a 15-minute expiry.
5. The Director sees the credential **once** in a modal and passes it through a secure internal channel.
6. The Hunter signs in with their existing email + temporary credential.
7. `AuthGate` blocks the app and shows *"You're using a temporary password. Create a new password to
   continue."* until a new permanent password is set.
8. On completion the reset row becomes `used` and the temporary credential no longer works (the
   password itself is replaced). Unused credentials expire after 15 minutes and are marked `expired`.
9. Audit events are written to `director_audit_log`: `password_reset_issued` and
   `password_reset_completed` (actor, staff account, timestamp, reset id, used flag). No plaintext.
10. Rate limits: max 10 resets per Director per hour; max 2 resets per target account per 5 minutes;
    issuing a new credential revokes any pending one.

## Authority rules (frozen)

- Only `director` may reset another account. Managers are **not** granted this capability in V1.
- A Hunter cannot reset another Hunter; the server re-checks the role via `has_role`, never the client.
- Directors cannot reset their own account through this path.
- Password reset never touches Department, Class, Rank or Authority — Staff Identity remains the
  single source of identity truth.

## Storage / logging guarantees

- `public.password_resets` stores `credential_hash` (SHA-256) only — never the plaintext credential
  and never the permanent password.
- Nothing plaintext is written to logs, audit rows, URLs, or query parameters.
- Reset records are readable only by Directors (RLS `has_role(auth.uid(),'director')`).

## Implementation

- `src/lib/password-reset.functions.ts` — `resetHunterPassword`, `getPasswordResetState`,
  `completeTemporaryPasswordChange`.
- `src/components/force-password-change.tsx` — forced new-password screen.
- `src/components/auth-gate.tsx` — gate that blocks the app while a temporary credential is in use.
- `src/routes/auth.tsx` — Forgot-password message.
- `src/routes/admin.tsx` — Director **Reset Hunter Password** action + one-time credential modal.

## Platform limitations

- Supabase Auth has no native "temporary password" concept. The temporary credential is a real
  password; the `must_change_password` user-metadata flag plus the reset record enforce the forced
  change. Enforcement is at the app gate: a signed-in user on a temporary credential is blocked from
  Odyssey UI, but the underlying session is a valid Supabase session, so table-level RLS still applies
  as that user. Full API-level lockout would require a JWT claim/hook not enabled in this environment.
- Expiry is enforced on use (login/gate check), not by an automatic background job.
- Email-based self-service reset stays out of scope until email delivery is configured (V2).
