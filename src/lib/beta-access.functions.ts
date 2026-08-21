import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const activationSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

/**
 * Minimal secure Beta activation.
 * An account can only be created when a Director has already created the
 * Staff Identity with this email. There is no public signup.
 */
export const activateBetaAccount = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => activationSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();

    const { data: staffRow, error: staffError } = await supabaseAdmin
      .from("staff")
      .select("id, name, email, user_id, status")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();
    if (staffError) throw new Error(staffError.message);

    const { data: bootstrapAllowed } = await supabaseAdmin.rpc("is_director_bootstrap_email", {
      _email: email,
    });

    if (!staffRow && !bootstrapAllowed) {
      return {
        ok: false as const,
        message:
          "This email has not been approved for the Odyssey Beta. Ask your Director to create your Staff Identity first.",
      };
    }

    if (staffRow && staffRow.status && staffRow.status !== "active") {
      return { ok: false as const, message: "This Staff Identity is not active. Contact your Director." };
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: staffRow?.name ?? email.split("@")[0] },
    });

    if (createError) {
      const msg = createError.message ?? "";
      if (/already|registered|exists/i.test(msg)) {
        return { ok: false as const, message: "This account is already activated. Please sign in instead." };
      }
      throw new Error(msg);
    }

    if (staffRow && created.user) {
      const { error: linkError } = await supabaseAdmin
        .from("staff")
        .update({ user_id: created.user.id, updated_at: new Date().toISOString() })
        .eq("id", staffRow.id);
      if (linkError) throw new Error(linkError.message);
    }

    return { ok: true as const, message: "Account activated. You can now sign in." };
  });
