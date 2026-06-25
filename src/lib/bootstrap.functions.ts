import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BOOTSTRAP_DIRECTOR_EMAIL = "ryu.lai@hotmail.com";

function initials(nameOrEmail: string) {
  const source = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail;
  return source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "GL";
}

export const ensureBootstrapDirector = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Record<string, never>) => data)
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (authError) throw new Error(authError.message);

    const email = (authUser.user?.email ?? (context.claims as any)?.email ?? "").trim().toLowerCase();
    if (!email) return { bootstrapped: false, redirectTo: null as string | null };

    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "director");
    if (countError) throw new Error(countError.message);

    const directorsCount = count ?? 0;
    const isBootstrapEmail = email === BOOTSTRAP_DIRECTOR_EMAIL;
    const mayBootstrap = directorsCount === 0 || isBootstrapEmail;
    if (!mayBootstrap) return { bootstrapped: false, redirectTo: null as string | null };

    const displayName = isBootstrapEmail
      ? "Ryu Lai"
      : (authUser.user?.user_metadata?.full_name as string | undefined)?.trim() || email.split("@")[0];

    const { data: currentRoles, error: currentRolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (currentRolesError) throw new Error(currentRolesError.message);
    const hadDirectorRole = (currentRoles ?? []).some((row: any) => row.role === "director");

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: context.userId,
        full_name: displayName,
        email,
        avatar: initials(displayName),
        updated_at: new Date().toISOString(),
      });
    if (profileError) throw new Error(profileError.message);

    const [linkedStaff, emailStaff] = await Promise.all([
      supabaseAdmin
        .from("staff")
        .select("id, name, email, user_id")
        .eq("user_id", context.userId)
        .order("updated_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("staff")
        .select("id, name, email, user_id")
        .eq("email", email)
        .order("updated_at", { ascending: false })
        .limit(20),
    ]);
    if (linkedStaff.error) throw new Error(linkedStaff.error.message);
    if (emailStaff.error) throw new Error(emailStaff.error.message);

    const candidates = [...(linkedStaff.data ?? []), ...(emailStaff.data ?? [])];
    const seen = new Set<string>();
    const uniqueCandidates = candidates.filter((staff: any) => {
      if (seen.has(staff.id)) return false;
      seen.add(staff.id);
      return true;
    });
    const canonical = isBootstrapEmail
      ? uniqueCandidates.find((staff: any) => staff.name === "Ryu Lai") ?? uniqueCandidates[0]
      : uniqueCandidates[0];
    const alreadyLinkedDirector = Boolean(
      canonical?.user_id === context.userId
      && canonical?.name === displayName
      && canonical?.email === email,
    );
    const needsBootstrapRedirect = directorsCount === 0 || !hadDirectorRole || !alreadyLinkedDirector;

    let staffId = canonical?.id as string | undefined;
    const staffPayload = {
      user_id: context.userId,
      name: displayName,
      email,
      role: "Director",
      role_family: "hunter",
      department: "Management",
      status: "active",
      system_role: "director" as const,
      updated_at: new Date().toISOString(),
    };

    if (staffId) {
      const { error: updateStaffError } = await supabaseAdmin
        .from("staff")
        .update(staffPayload)
        .eq("id", staffId);
      if (updateStaffError) throw new Error(updateStaffError.message);
    } else {
      const { data: insertedStaff, error: insertStaffError } = await supabaseAdmin
        .from("staff")
        .insert(staffPayload)
        .select("id")
        .single();
      if (insertStaffError) throw new Error(insertStaffError.message);
      staffId = insertedStaff.id;
    }

    if (staffId) {
      const { error: unlinkDuplicatesError } = await supabaseAdmin
        .from("staff")
        .update({ user_id: null, system_role: "staff", updated_at: new Date().toISOString() })
        .eq("user_id", context.userId)
        .neq("id", staffId);
      if (unlinkDuplicatesError) throw new Error(unlinkDuplicatesError.message);
    }

    const { error: grantError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "director" }, { onConflict: "user_id,role" });
    if (grantError) throw new Error(grantError.message);

    const { error: removeOtherRolesError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", context.userId)
      .neq("role", "director");
    if (removeOtherRolesError) throw new Error(removeOtherRolesError.message);

    return { bootstrapped: true, redirectTo: needsBootstrapRedirect ? "/admin" : null };
  });