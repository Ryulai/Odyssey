import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { getStaffDashboard } from "@/lib/workflow.functions";
import { upsertStaff } from "@/lib/config.functions";
import { useDirectorMode } from "@/lib/director-mode";
import { CLASS_ROLES, PRIMARY_CLASSES, RANKS, TEMPORARY_ROLES, classLabel, rankLabel, roleLabel, type PrimaryClass } from "@/lib/rpg";

export const Route = createFileRoute("/career")({
  head: () => ({
    meta: [
      { title: "Identities — The Odyssey Guide" },
      { name: "description", content: "Every employee Identity with independent class, role, rank, promotion, reviews, achievements and statistics." },
    ],
  }),
  component: () => <AuthGate><CareerPage /></AuthGate>,
});

type IdentityCardState = {
  id?: string | null;
  class_key: string | null;
  role_key: string | null;
  rank_key: string;
  promotion_progress: number;
  monthly_review: any;
  achievement_progress: any;
  statistics: any;
};

const emptyIdentity = (): IdentityCardState => ({
  class_key: null,
  role_key: null,
  rank_key: "bronze",
  promotion_progress: 0,
  monthly_review: {},
  achievement_progress: {},
  statistics: {},
});

function CareerPage() {
  const qc = useQueryClient();
  const { enabled: directorMode } = useDirectorMode();
  const { data, isLoading } = useQuery({ queryKey: ["dashboard", "me", "career"], queryFn: () => getStaffDashboard({ data: {} }) });
  const staff = data?.staff ?? null;

  const savedIdentities = useMemo<IdentityCardState[]>(() => {
    const rows = staff?.identities ?? [];
    if (rows.length) {
      return rows.map((idn: any) => ({
        id: idn.id,
        class_key: idn.class_key ?? null,
        role_key: idn.role_key ?? null,
        rank_key: idn.rank_key ?? "bronze",
        promotion_progress: Number(idn.promotion_progress ?? 0),
        monthly_review: idn.monthly_review ?? {},
        achievement_progress: idn.achievement_progress ?? {},
        statistics: idn.statistics ?? {},
      }));
    }
    if (staff?.rpg?.primary_class) {
      return [{
        class_key: staff.rpg.primary_class,
        role_key: staff.rpg.primary_role ?? null,
        rank_key: staff.current_rank_key ?? "bronze",
        promotion_progress: 0,
        monthly_review: data?.grades?.[0] ? { latest_grade: data.grades[0].grade, latest_month: data.grades[0].month, composite_score: data.grades[0].composite_score } : {},
        achievement_progress: { stars: data?.totals?.stars ?? 0 },
        statistics: {},
      }];
    }
    return [emptyIdentity()];
  }, [data, staff]);

  const [identities, setIdentities] = useState<IdentityCardState[]>(savedIdentities);
  const [reason, setReason] = useState("");

  useEffect(() => setIdentities(savedIdentities.length ? savedIdentities : [emptyIdentity()]), [savedIdentities]);

  const save = useMutation({
    mutationFn: (payload: any) => upsertStaff({ data: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setReason("");
    },
  });

  const updateIdentity = (index: number, patch: Partial<IdentityCardState>) => {
    setIdentities((list) => list.map((idn, i) => i === index ? { ...idn, ...patch } : idn));
  };

  const submitDirectorChanges = () => {
    if (!staff || !directorMode || !reason.trim()) return;
    const filled = identities.filter((idn) => !!idn.class_key);
    if (!filled.length) return;
    save.mutate({
      id: staff.id,
      name: staff.name,
      email: staff.email ?? null,
      role: staff.role ?? "",
      role_family: staff.role_family ?? "hunter",
      business_unit: staff.business_unit ?? "Sales",
      manager_id: staff.manager_id ?? null,
      status: staff.status ?? "active",
      user_id: staff.user_id ?? null,
      app_role: staff.system_role ?? null,
      location_id: staff.location_id ?? null,
      employee_code: staff.employee_code ?? null,
      join_date: staff.join_date ?? null,
      phone: staff.phone ?? null,
      branch: staff.branch ?? null,
      career_path: staff.career_path ?? null,
      shipbuilder_path: staff.shipbuilder_path ?? null,
      identities: filled,
      is_director_override: true,
      override_reason: reason.trim(),
    });
  };

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-semibold uppercase tracking-widest text-gold">Identities</h1>
            <div className="text-xs text-muted-foreground">Class records are rendered from identities[]</div>
          </div>
          <Link to="/" className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">← Dashboard</Link>
        </header>

        {isLoading ? (
          <section className="rounded-xl border border-border bg-ink/30 p-10 text-center text-xs uppercase tracking-widest text-muted-foreground">Loading identities…</section>
        ) : !staff ? (
          <section className="rounded-xl border border-border bg-ink/30 p-10 text-center text-sm text-muted-foreground">No staff record is linked to this account yet.</section>
        ) : (
          <div className="space-y-6">
            <section className="rounded-xl border border-gold/25 bg-ink/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-display text-2xl text-foreground">{staff.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{staff.role || "—"} · {staff.business_unit || "—"}</div>
                </div>
                {directorMode && (
                  <button type="button" onClick={() => setIdentities((list) => [...list, emptyIdentity()])} className="rounded-md border border-red-400/50 bg-red-500/10 px-3 py-2 text-xs uppercase tracking-widest text-red-200 hover:bg-red-500/20">+ Add Identity</button>
                )}
              </div>
            </section>

            {identities.map((identity, index) => (
              <IdentityCard
                key={identity.id ?? index}
                identity={identity}
                index={index}
                editable={directorMode}
                canRemove={directorMode && index > 0}
                onChange={(patch) => updateIdentity(index, patch)}
                onRemove={() => setIdentities((list) => list.filter((_, i) => i !== index))}
              />
            ))}

            {directorMode && (
              <section className="rounded-xl border border-red-400/40 bg-red-500/10 p-5">
                <label className="block">
                  <span className="mb-1 block text-[10px] uppercase tracking-widest text-red-100">Director Override Reason</span>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-md border border-red-300/40 bg-ink/70 px-3 py-2 text-sm text-foreground focus:border-red-200 focus:outline-none" placeholder="Required for audit log" />
                </label>
                <div className="mt-3 flex justify-end">
                  <button type="button" onClick={submitDirectorChanges} disabled={save.isPending || !reason.trim()} className="rounded-md border border-red-300/60 bg-red-500/20 px-4 py-2 text-xs uppercase tracking-widest text-red-100 disabled:opacity-50">
                    {save.isPending ? "Saving…" : "Save Identity Overrides"}
                  </button>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function IdentityCard({ identity, index, editable, canRemove, onChange, onRemove }: {
  identity: IdentityCardState;
  index: number;
  editable: boolean;
  canRemove: boolean;
  onChange: (patch: Partial<IdentityCardState>) => void;
  onRemove: () => void;
}) {
  const roleOptions = identity.class_key ? CLASS_ROLES[identity.class_key as PrimaryClass] ?? [] : [];
  const label = identity.class_key ? classLabel(identity.class_key) : "Unassigned";
  const role = identity.role_key ? roleLabel(identity.role_key) : "No role selected";
  const rank = rankLabel(identity.rank_key);
  const review = identity.monthly_review ?? {};
  const achievements = identity.achievement_progress ?? {};
  const statistics = identity.statistics ?? {};

  return (
    <section className="rounded-xl border border-border bg-ink/30 p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-display text-[11px] uppercase tracking-[0.3em] text-gold">
            Identity #{index + 1}{index === 0 && <span className="ml-2 text-muted-foreground normal-case tracking-normal">is_primary=true</span>}
          </div>
          <div className="mt-2 font-display text-2xl text-foreground">{label}</div>
          <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{role}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-gold/30 bg-gold/5 px-3 py-1.5 text-[10px] uppercase tracking-widest text-gold">{rank}</div>
          {canRemove && <button type="button" onClick={onRemove} className="rounded-md border border-red-400/50 px-3 py-1.5 text-[10px] uppercase tracking-widest text-red-200 hover:bg-red-500/10">Remove</button>}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <IdentityField label="Class">
          {editable ? (
            <select className="w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none" value={identity.class_key ?? ""} onChange={(e) => {
              const cls = e.target.value || null;
              onChange({ class_key: cls, role_key: cls ? CLASS_ROLES[cls as PrimaryClass]?.[0]?.key ?? null : null });
            }}>
              <option value="">— Select class —</option>
              {PRIMARY_CLASSES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          ) : <ReadValue>{label}</ReadValue>}
        </IdentityField>

        <IdentityField label="Role">
          {editable ? (
            <select className="w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none" value={identity.role_key ?? ""} onChange={(e) => onChange({ role_key: e.target.value || null })} disabled={!identity.class_key}>
              <option value="">— Select role —</option>
              {roleOptions.map((r) => <option key={r.key} value={r.key}>{r.label}{TEMPORARY_ROLES.has(r.key) ? " (Temporary)" : ""}</option>)}
            </select>
          ) : <ReadValue>{role}</ReadValue>}
        </IdentityField>

        <IdentityField label="Rank">
          {editable ? (
            <select className="w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none" value={identity.rank_key} onChange={(e) => onChange({ rank_key: e.target.value })}>
              {RANKS.map((r) => <option key={r.key} value={r.key}>{r.label} — override</option>)}
            </select>
          ) : <ReadValue accent>{rank}</ReadValue>}
        </IdentityField>

        <IdentityField label="Promotion">
          {editable ? (
            <div className="flex items-center gap-3 rounded-md border border-border bg-ink/60 px-3 py-2">
              <input type="range" min={0} max={100} value={identity.promotion_progress} onChange={(e) => onChange({ promotion_progress: Number(e.target.value) })} className="flex-1" />
              <span className="w-10 text-right font-mono text-xs text-gold">{identity.promotion_progress}%</span>
            </div>
          ) : <ReadValue accent>{identity.promotion_progress}%</ReadValue>}
        </IdentityField>

        <IdentityField label="Monthly Review"><ReadValue>{review.latest_grade ? `${review.latest_grade}${review.latest_month ? ` · ${review.latest_month}` : ""}` : "No review yet"}</ReadValue></IdentityField>
        <IdentityField label="Achievements"><ReadValue>Stars: {achievements.stars ?? 0} · Unique: {achievements.unique_achievements ?? 0}</ReadValue></IdentityField>
        <IdentityField label="Statistics"><ReadValue>Promotions: {statistics.total_promotions ?? 0}</ReadValue></IdentityField>
      </div>
    </section>
  );
}

function IdentityField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="mb-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>{children}</div>;
}

function ReadValue({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return <div className={`rounded-md border border-border/60 bg-ink/40 px-3 py-2 text-sm ${accent ? "text-gold" : "text-foreground"}`}>{children}</div>;
}
