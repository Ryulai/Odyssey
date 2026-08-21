import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Odyssey Beta Password Recovery V1 — FROZEN.
 * Director-issued single-use temporary credentials. No email delivery, no OTP.
 * Plaintext credentials are never stored or logged; only a SHA-256 hash is kept.
 */

const TEMP_TTL_MINUTES = 30;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function generateTempCredential(length = 14) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function assertDirector(context: any) {
  const { data: isDirector, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "director",
  });
  if (error) throw new Error(error.message);
  if (!isDirector) throw new Error("Forbidden: only a Director may reset another account's password.");
}

export const resetHunterPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ staff_id: z.string().uuid(), reason: z.string().trim().max(500).optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertDirector(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: staffRow, error: staffError } = await supabaseAdmin
      .from("staff")
      .select("id, name, email, user_id, status")
      .eq("id", data.staff_id)
      .maybeSingle();
    if (staffError) throw new Error(staffError.message);
    if (!staffRow) throw new Error("Staff account not found.");
    if (!staffRow.user_id) throw new Error("This Staff Identity has no activated Odyssey account yet.");
    if (staffRow.user_id === context.userId) throw new Error("Use your own password change flow instead.");

    // Rate limiting: per Director and per target account.
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: actorCount, error: actorErr } = await supabaseAdmin
      .from("password_resets")
      .select("id", { count: "exact", head: true })
      .eq("initiated_by", context.userId)
      .gte("created_at", hourAgo);
    if (actorErr) throw new Error(actorErr.message);
    if ((actorCount ?? 0) >= 10) throw new Error("Too many password resets in the last hour. Try again later.");

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: targetCount, error: targetErr } = await supabaseAdmin
      .from("password_resets")
      .select("id", { count: "exact", head: true })
      .eq("target_user_id", staffRow.user_id)
      .gte("created_at", fiveMinAgo);
    if (targetErr) throw new Error(targetErr.message);
    if ((targetCount ?? 0) >= 2) throw new Error("A reset for this account was just issued. Wait a few minutes.");

    // Any previously pending credential for this account is revoked.
    const { data: revoked } = await supabaseAdmin
      .from("password_resets")
      .update({ status: "revoked" })
      .eq("target_user_id", staffRow.user_id)
      .eq("status", "pending")
      .select("id");

    for (const row of revoked ?? []) {
      await supabaseAdmin.from("director_audit_log").insert({
        actor_user_id: context.userId,
        staff_id: staffRow.id,
        action: "password_reset_invalidated",
        reason: "Superseded by a newly issued temporary credential",
        before_state: { reset_id: row.id, status: "pending" },
        after_state: { reset_id: row.id, status: "revoked" },
      });
    }


    const temporaryCredential = generateTempCredential();
    const credentialHash = await sha256(temporaryCredential);
    const expiresAt = new Date(Date.now() + TEMP_TTL_MINUTES * 60 * 1000).toISOString();

    const { data: resetRow, error: insertErr } = await supabaseAdmin
      .from("password_resets")
      .insert({
        staff_id: staffRow.id,
        target_user_id: staffRow.user_id,
        target_email: staffRow.email ?? "",
        initiated_by: context.userId,
        credential_hash: credentialHash,
        expires_at: expiresAt,
        status: "pending",
      })
      .select("id")
      .single();
    if (insertErr) throw new Error(insertErr.message);

    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(staffRow.user_id);
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(staffRow.user_id, {
      password: temporaryCredential,
      user_metadata: {
        ...(existingUser?.user?.user_metadata ?? {}),
        must_change_password: true,
        password_reset_id: resetRow.id,
      },
    });
    if (updateErr) {
      await supabaseAdmin.from("password_resets").update({ status: "failed" }).eq("id", resetRow.id);
      throw new Error("Could not issue a temporary credential for this account.");
    }

    await supabaseAdmin.from("director_audit_log").insert({
      actor_user_id: context.userId,
      staff_id: staffRow.id,
      action: "password_reset_issued",
      reason: data.reason?.trim() || "Director-issued temporary access credential (Beta Password Recovery V1).",
      before_state: { reset_id: resetRow.id, status: "none" },
      after_state: { reset_id: resetRow.id, status: "pending", expires_at: expiresAt, used: false },
    });

    return {
      ok: true as const,
      temporaryCredential,
      expiresAt,
      staffName: staffRow.name as string,
      email: staffRow.email as string | null,
    };
  });

/** Called after sign-in to decide whether the Hunter is on a temporary credential. */
export const getPasswordResetState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Record<string, never>) => data)
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const meta = (authUser?.user?.user_metadata ?? {}) as Record<string, unknown>;
    if (!meta["must_change_password"]) return { mustChangePassword: false as const, expired: false };

    const { data: reset } = await supabaseAdmin
      .from("password_resets")
      .select("id, status, expires_at, staff_id")
      .eq("target_user_id", context.userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const expired = !reset || new Date(reset.expires_at).getTime() < Date.now();
    if (expired && reset) {
      await supabaseAdmin.from("password_resets").update({ status: "expired" }).eq("id", reset.id);
      await supabaseAdmin.from("director_audit_log").insert({
        actor_user_id: context.userId,
        staff_id: reset.staff_id,
        action: "password_reset_expired",
        reason: "Temporary credential expired before it was used",
        before_state: { reset_id: reset.id, status: "pending" },
        after_state: { reset_id: reset.id, status: "expired" },
      });
    }
    return { mustChangePassword: true as const, expired };

  });

export const completeTemporaryPasswordChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ new_password: z.string().min(8).max(200) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const meta = (authUser?.user?.user_metadata ?? {}) as Record<string, unknown>;

    const { data: reset } = await supabaseAdmin
      .from("password_resets")
      .select("id, status, expires_at, staff_id")
      .eq("target_user_id", context.userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (meta["must_change_password"] && reset && new Date(reset.expires_at).getTime() < Date.now()) {
      await supabaseAdmin.from("password_resets").update({ status: "expired" }).eq("id", reset.id);
      await supabaseAdmin.from("director_audit_log").insert({
        actor_user_id: context.userId,
        staff_id: reset.staff_id,
        action: "password_reset_expired",
        reason: "Temporary credential expired before it was used",
        before_state: { reset_id: reset.id, status: "pending" },
        after_state: { reset_id: reset.id, status: "expired" },
      });
      throw new Error("This temporary credential has expired. Ask your Director to issue a new one.");

    }

    const nextMeta = { ...meta };
    delete nextMeta["must_change_password"];
    delete nextMeta["password_reset_id"];

    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      password: data.new_password,
      user_metadata: nextMeta,
    });
    if (updateErr) throw new Error("Could not set the new password. Choose a different password and try again.");

    if (reset) {
      await supabaseAdmin
        .from("password_resets")
        .update({ status: "used", used_at: new Date().toISOString() })
        .eq("id", reset.id);

      await supabaseAdmin.from("director_audit_log").insert({
        actor_user_id: context.userId,
        staff_id: reset.staff_id,
        action: "password_reset_completed",
        reason: "Hunter replaced the temporary credential with a permanent password.",
        before_state: { reset_id: reset.id, status: "pending", used: false },
        after_state: { reset_id: reset.id, status: "used", used: true },
      });
    }

    return { ok: true as const };
  });
