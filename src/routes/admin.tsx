import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRole, can, ROLE_META, PERMISSIONS, type Capability } from "@/lib/roles";
import { AuthGate } from "@/components/auth-gate";
import { GRADE_META } from "@/lib/employee-data";
import {
  listStaff, listUserAccounts, upsertStaff, linkStaffAccount, deleteStaff,
  getGradeConfig, updateGradeWeights, updateGradeRule,
  listAchievements, upsertAchievement, deleteAchievement,
  listRanks, updateRank, reorderRanks,
  getLegacy, updateLegacyConfig, upsertLegacyTitle, deleteLegacyTitle,
} from "@/lib/config.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — The Odyssey Guide" },
      { name: "description", content: "Configure staff, grades, achievements, ranks and legacy economy." },
    ],
  }),
  component: () => <AuthGate><AdminPage /></AuthGate>,
});

type AdminTab = "staff" | "grades" | "achievements" | "ranks" | "legacy";

const TABS: { key: AdminTab; label: string; hint: string; cap: Capability }[] = [
  { key: "staff",        label: "Staff",        hint: "Create, edit, assign department & manager", cap: "admin.staff" },
  { key: "grades",       label: "Grades",       hint: "Define A/B/C/D rules and weights",          cap: "admin.grades" },
  { key: "achievements", label: "Achievements", hint: "Define achievements & star rewards",        cap: "admin.achievements" },
  { key: "ranks",        label: "Ranks",        hint: "Configure Hunter ranks & promotion rules",  cap: "admin.ranks" },
  { key: "legacy",       label: "Legacy",       hint: "Conversion ratios & legacy titles",         cap: "admin.legacy" },
];

function AdminPage() {
  const { role } = useRole();
  const displayRole = role ?? "staff";
  const visibleTabs = useMemo(() => TABS.filter(t => can(role, t.cap)), [role]);
  const [tab, setTab] = useState<AdminTab>(visibleTabs[0]?.key ?? "staff");
  useEffect(() => {
    if (!visibleTabs.find(t => t.key === tab)) setTab(visibleTabs[0]?.key ?? "staff");
  }, [visibleTabs, tab]);

  if (!can(role, "admin.access")) {
    return (
      <div className="min-h-screen text-foreground">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <AdminHeader />
          <section className="card-ornate p-8 text-center">
            <div className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">Restricted</div>
            <h1 className="mt-2 font-display text-2xl text-gold">Admin Console is sealed</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              You are signed in as <span className="text-foreground">{ROLE_META[displayRole].label}</span>.
              The Admin Console is reserved for Directors and Managers.
            </p>
            <ul className="mx-auto mt-4 max-w-sm space-y-1 text-left text-xs text-muted-foreground">
              {PERMISSIONS[displayRole].map(p => <li key={p}>· {p}</li>)}
            </ul>
            <Link to="/" className="mt-6 inline-block rounded-md border border-gold/50 bg-gold/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-gold hover:bg-gold/20">
              ← Back to the Ledger
            </Link>
          </section>
        </div>
      </div>
    );
  }

  const active = visibleTabs.find(t => t.key === tab) ?? visibleTabs[0];

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminHeader />
        <div className="mb-6 rounded-md border border-border bg-ink/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-display text-xs uppercase tracking-[0.25em] text-gold">Admin Console</div>
            <div className="rounded border border-gold/30 bg-gold/5 px-2 py-0.5 font-display text-[10px] uppercase tracking-widest text-gold">
              {ROLE_META[displayRole].label} access
            </div>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Configuration only. Persisted to the Guild Ledger database.
          </div>
        </div>

        <nav role="tablist" className="mb-4 flex flex-wrap gap-2">
          {visibleTabs.map(t => (
            <button key={t.key} role="tab" aria-selected={t.key === tab}
              onClick={() => setTab(t.key)}
              className={`rounded-md border px-3 py-2 text-xs font-medium uppercase tracking-widest transition ${
                t.key === tab ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-gold/40"
              }`}>
              {t.label}
            </button>
          ))}
        </nav>
        {active && <div className="mb-4 text-xs italic text-muted-foreground">{active.hint}</div>}

        {tab === "staff"        && <StaffModule />}
        {tab === "grades"       && can(role, "admin.grades")       && <GradesModule />}
        {tab === "achievements" && <AchievementsModule />}
        {tab === "ranks"        && can(role, "admin.ranks")        && <RanksModule />}
        {tab === "legacy"       && can(role, "admin.legacy")       && <LegacyModule />}
      </div>
    </div>
  );
}

function AdminHeader() {
  return (
    <header className="mb-8 flex items-center justify-between">
      <div>
        <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">Guild Admin</div>
        <div className="text-xs text-muted-foreground">Data configuration for the Guild Ledger</div>
      </div>
      <Link to="/" className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">
        ← Ledger
      </Link>
    </header>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-ink/30 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none";

function Btn({ children, onClick, variant = "primary", type = "button", disabled }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit"; disabled?: boolean;
}) {
  const styles =
    variant === "primary" ? "border-gold bg-gold/10 text-gold hover:bg-gold/20"
    : variant === "danger" ? "border-red-500/50 text-red-400 hover:bg-red-500/10"
    : "border-border text-muted-foreground hover:border-gold/40 hover:text-gold";
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`rounded-md border px-3 py-1.5 text-xs uppercase tracking-widest transition disabled:opacity-50 ${styles}`}>
      {children}
    </button>
  );
}

const DEPARTMENTS = ["Management", "Sales", "Operations", "Marketing", "Service", "Leadership"];

/* ============ Staff ============ */

type StaffRow = {
  id: string; name: string; email: string | null; role: string;
  role_family: "hunter" | "operational"; department: string; manager_id: string | null;
  status: "active" | "inactive"; user_id: string | null; app_role?: "director" | "manager" | "staff" | null;
};

function StaffModule() {
  const qc = useQueryClient();
  const { role } = useRole();
  const { data: staff = [], isLoading } = useQuery({ queryKey: ["staff"], queryFn: () => listStaff() });
  const { data: accounts = [] } = useQuery({ queryKey: ["user-accounts"], queryFn: () => listUserAccounts(), enabled: role === "director" });
  const save = useMutation({ mutationFn: (d: any) => upsertStaff({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }) });
  const link = useMutation({ mutationFn: (d: any) => linkStaffAccount({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }) });
  const del  = useMutation({ mutationFn: (id: string) => deleteStaff({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }) });
  const [editing, setEditing] = useState<StaffRow | null>(null);

  return (
    <Section title="Staff Management" action={
      <Btn onClick={() => setEditing({ id: "", name: "", email: "", role: "", role_family: "hunter", department: "Sales", manager_id: null, status: "active", user_id: null, app_role: "staff" })}>
        + New Staff
      </Btn>
    }>
      {isLoading ? <div className="py-6 text-center text-xs text-muted-foreground">Loading…</div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Path</th><th className="py-2 pr-3">Department</th>
                <th className="py-2 pr-3">Manager</th><th className="py-2 pr-3">Account</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s: any) => (
                <tr key={s.id} className="border-b border-border/40">
                  <td className="py-2 pr-3">{s.name}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{s.role}</td>
                  <td className="py-2 pr-3 text-muted-foreground capitalize">{s.role_family}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{s.department}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{staff.find((x: any) => x.id === s.manager_id)?.name ?? "—"}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{s.user_id ? "Linked" : emailMatchesAccount(s.email, accounts) ? "Match ready" : "—"}</td>
                  <td className="py-2 pr-3 text-muted-foreground capitalize">{s.status ?? "active"}</td>
                  <td className="py-2 pr-3 text-right">
                    <div className="inline-flex gap-2">
                      <Btn variant="ghost" onClick={() => setEditing(s)}>Edit</Btn>
                      {role === "director" && !s.user_id && emailMatchesAccount(s.email, accounts) && (
                        <Btn variant="ghost" onClick={() => link.mutate({ staff_id: s.id, user_id: emailMatchesAccount(s.email, accounts)?.id, app_role: roleToAppRole(s.role) })}>Link</Btn>
                      )}
                      {role === "director" && <Btn variant="danger" onClick={() => del.mutate(s.id)}>Delete</Btn>}
                    </div>
                  </td>
                </tr>
              ))}
              {!staff.length && (<tr><td colSpan={8} className="py-6 text-center text-xs text-muted-foreground">No staff yet.</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <StaffForm
          row={editing}
          managers={staff.filter((s: any) => s.id !== editing.id)}
          accounts={accounts}
          isDirector={role === "director"}
          onCancel={() => setEditing(null)}
          onSave={(d) => save.mutate(d, { onSuccess: () => setEditing(null) })}
          busy={save.isPending}
        />
      )}
    </Section>
  );
}

function emailMatchesAccount(email: string | null | undefined, accounts: any[]) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;
  return accounts.find((a: any) => a.email?.trim().toLowerCase() === normalized) ?? null;
}

function roleToAppRole(role: string): "director" | "manager" | "staff" {
  const normalized = role.toLowerCase();
  if (normalized.includes("director")) return "director";
  if (normalized.includes("manager")) return "manager";
  return "staff";
}

function StaffForm({ row, managers, accounts, isDirector, onSave, onCancel, busy }: {
  row: StaffRow; managers: any[]; accounts: any[]; isDirector: boolean; onSave: (r: any) => void; onCancel: () => void; busy: boolean;
}) {
  const [d, setD] = useState<StaffRow>({ ...row, status: row.status ?? "active", user_id: row.user_id ?? null, app_role: row.app_role ?? roleToAppRole(row.role) });
  const set = <K extends keyof StaffRow>(k: K, v: StaffRow[K]) => setD(x => ({ ...x, [k]: v }));
  const matched = emailMatchesAccount(d.email, accounts);
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (d.name.trim()) {
      const payload: any = { ...d };
      if (!payload.id) delete payload.id;
      onSave(payload);
    } }}
      className="mt-5 grid gap-3 rounded-md border border-gold/30 bg-ink/50 p-4 sm:grid-cols-2">
      <div className="sm:col-span-2 font-display text-xs uppercase tracking-widest text-gold">
        {row.id ? "Edit Staff" : "Create Staff"}
      </div>
      <Field label="Name"><input className={inputCls} value={d.name} onChange={e => set("name", e.target.value)} required /></Field>
      <Field label="Email"><input type="email" className={inputCls} value={d.email ?? ""} onChange={e => set("email", e.target.value)} /></Field>
      <Field label="Position"><input className={inputCls} value={d.role} onChange={e => { set("role", e.target.value); set("app_role", roleToAppRole(e.target.value)); }} placeholder="e.g. Senior Ambassador" /></Field>
      <Field label="Path">
        <select className={inputCls} value={d.role_family} onChange={e => set("role_family", e.target.value as any)}>
          <option value="hunter">Hunter</option><option value="operational">Operational</option>
        </select>
      </Field>
      <Field label="Department">
        <select className={inputCls} value={d.department} onChange={e => set("department", e.target.value)}>
          {DEPARTMENTS.map(x => <option key={x} value={x}>{x}</option>)}
        </select>
      </Field>
      {isDirector && <Field label="Manager">
        <select className={inputCls} value={d.manager_id ?? ""} onChange={e => set("manager_id", e.target.value || null)}>
          <option value="">— None —</option>
          {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </Field>}
      <Field label="Status">
        <select className={inputCls} value={d.status} onChange={e => set("status", e.target.value as any)}>
          <option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
      </Field>
      {isDirector && <Field label="Linked User Account">
          <select className={inputCls} value={d.user_id ?? matched?.id ?? ""} onChange={e => set("user_id", e.target.value || null)}>
            <option value="">{matched ? `Auto-match: ${matched.email}` : "— No account yet —"}</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.email} · {a.full_name ?? "Unnamed"}</option>)}
          </select>
        </Field>}
      {isDirector && <Field label="Account Permission">
          <select className={inputCls} value={d.app_role ?? roleToAppRole(d.role)} onChange={e => set("app_role", e.target.value as any)}>
            <option value="director">Director</option><option value="manager">Manager</option><option value="staff">Staff</option>
          </select>
        </Field>}
      {isDirector && matched && !d.user_id && (
        <div className="sm:col-span-2 rounded border border-gold/30 bg-gold/5 px-3 py-2 text-xs text-gold">
          Matching account found: {matched.email}. Saving will link it automatically.
        </div>
      )}
      <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Btn>
      </div>
    </form>
  );
}

/* ============ Grades ============ */

function GradesModule() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["grades"], queryFn: () => getGradeConfig() });
  const wMut = useMutation({ mutationFn: (d: any) => updateGradeWeights({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["grades"] }) });
  const rMut = useMutation({ mutationFn: (d: any) => updateGradeRule({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["grades"] }) });

  const [sales, setSales] = useState(60);
  useEffect(() => { if (data) setSales(data.weights.sales_weight); }, [data]);
  const review = 100 - sales;

  if (isLoading || !data) return <div className="py-6 text-center text-xs text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <Section title="Grade Weights" action={<Btn onClick={() => wMut.mutate({ sales_weight: sales, review_weight: review })} disabled={wMut.isPending}>Save Weights</Btn>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Sales Weight — ${sales}%`}>
            <input type="range" min={0} max={100} step={5} value={sales} onChange={e => setSales(Number(e.target.value))}
              className="w-full accent-[var(--color-gold,gold)]" />
          </Field>
          <Field label={`Review Weight — ${review}%`}>
            <div className="rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-muted-foreground">{review}% (auto)</div>
          </Field>
        </div>
        <p className="mt-3 text-[11px] italic text-muted-foreground">Composite = Sales × {sales}% + Reviews × {review}%.</p>
      </Section>

      <Section title="Grade Rules (A / B / C / D)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3">Grade</th><th className="py-2 pr-3">Label</th>
                <th className="py-2 pr-3">Min Score</th><th className="py-2 pr-3">Bonus %</th>
                <th className="py-2 pr-3">Note</th><th></th>
              </tr>
            </thead>
            <tbody>
              {data.rules.map((r: any) => <GradeRuleRow key={r.grade} rule={r} onSave={(p) => rMut.mutate(p)} />)}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function GradeRuleRow({ rule, onSave }: { rule: any; onSave: (p: any) => void }) {
  const [d, setD] = useState(rule);
  useEffect(() => setD(rule), [rule]);
  const g = rule.grade as "A" | "B" | "C" | "D";
  return (
    <tr className="border-b border-border/40">
      <td className="py-2 pr-3">
        <span className="rounded px-2 py-0.5 text-xs font-bold" style={{ color: GRADE_META[g].color, borderColor: GRADE_META[g].color, borderWidth: 1 }}>{g}</span>
      </td>
      <td className="py-2 pr-3 text-muted-foreground">{GRADE_META[g].label}</td>
      <td className="py-2 pr-3"><input type="number" min={0} max={100} className={inputCls + " w-24"} value={d.min_score} onChange={e => setD({ ...d, min_score: Number(e.target.value) })} /></td>
      <td className="py-2 pr-3"><input type="number" min={0} max={100} className={inputCls + " w-24"} value={d.bonus_pct} onChange={e => setD({ ...d, bonus_pct: Number(e.target.value) })} /></td>
      <td className="py-2 pr-3"><input className={inputCls} value={d.note} onChange={e => setD({ ...d, note: e.target.value })} /></td>
      <td className="py-2 pr-3 text-right"><Btn onClick={() => onSave({ grade: g, min_score: d.min_score, bonus_pct: d.bonus_pct, note: d.note })}>Save</Btn></td>
    </tr>
  );
}

/* ============ Achievements ============ */

const ACH_TYPES = ["Monthly", "Season", "Annual", "One-Time", "Milestone"];
const DIFFS = ["Easy", "Standard", "Hard", "Epic", "Legendary"];
const RESETS = ["Monthly", "Seasonal", "Yearly", "Never"];

function AchievementsModule() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({ queryKey: ["achievements"], queryFn: () => listAchievements() });
  const save = useMutation({ mutationFn: (d: any) => upsertAchievement({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["achievements"] }) });
  const del  = useMutation({ mutationFn: (id: string) => deleteAchievement({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["achievements"] }) });
  const [editing, setEditing] = useState<any>(null);

  return (
    <Section title="Achievement Management" action={
      <Btn onClick={() => setEditing({ name: "", description: "", type: "Monthly", difficulty: "Standard", reset_cycle: "Monthly", star_reward: 1, requirement: "", seasonal: true })}>
        + New Achievement
      </Btn>
    }>
      {isLoading ? <div className="py-6 text-center text-xs text-muted-foreground">Loading…</div> : (
        <div className="grid gap-3">
          {items.map((a: any) => (
            <div key={a.id} className="rounded-md border border-border bg-ink/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{a.name} <span className="ml-2 text-[10px] uppercase tracking-widest text-muted-foreground">{a.difficulty}</span></div>
                  <div className="text-xs text-muted-foreground">{a.description}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span className="rounded border border-border px-2 py-0.5">Type: {a.type}</span>
                    <span className="rounded border border-border px-2 py-0.5">Reset: {a.reset_cycle}</span>
                    <span className="rounded border border-border px-2 py-0.5 text-gold">★ {a.star_reward}</span>
                    <span className="rounded border border-border px-2 py-0.5">{a.seasonal ? "Seasonal" : "Lifetime"}</span>
                  </div>
                  {a.requirement && <div className="mt-2 text-[11px] italic text-muted-foreground">Requirement: {a.requirement}</div>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Btn variant="ghost" onClick={() => setEditing(a)}>Edit</Btn>
                  <Btn variant="danger" onClick={() => del.mutate(a.id)}>Delete</Btn>
                </div>
              </div>
            </div>
          ))}
          {!items.length && <div className="py-6 text-center text-xs text-muted-foreground">No achievements yet.</div>}
        </div>
      )}

      {editing && <AchievementForm row={editing} onCancel={() => setEditing(null)} busy={save.isPending}
        onSave={(d) => save.mutate(d, { onSuccess: () => setEditing(null) })} />}
    </Section>
  );
}

function AchievementForm({ row, onSave, onCancel, busy }: { row: any; onSave: (a: any) => void; onCancel: () => void; busy: boolean }) {
  const [d, setD] = useState<any>(row);
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (d.name.trim()) {
      const payload = { ...d }; if (!payload.id) delete payload.id; onSave(payload);
    } }} className="mt-5 grid gap-3 rounded-md border border-gold/30 bg-ink/50 p-4 sm:grid-cols-2">
      <div className="sm:col-span-2 font-display text-xs uppercase tracking-widest text-gold">{row.id ? "Edit Achievement" : "Create Achievement"}</div>
      <Field label="Name"><input className={inputCls} value={d.name} onChange={e => setD({ ...d, name: e.target.value })} required /></Field>
      <Field label="Star Reward"><input type="number" min={0} max={50} className={inputCls} value={d.star_reward} onChange={e => setD({ ...d, star_reward: Number(e.target.value) })} /></Field>
      <Field label="Description"><textarea rows={2} className={inputCls} value={d.description} onChange={e => setD({ ...d, description: e.target.value })} /></Field>
      <Field label="Requirement"><textarea rows={2} className={inputCls} value={d.requirement} onChange={e => setD({ ...d, requirement: e.target.value })} placeholder="e.g. Close 5 deals in one month" /></Field>
      <Field label="Type"><select className={inputCls} value={d.type} onChange={e => setD({ ...d, type: e.target.value })}>{ACH_TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Difficulty"><select className={inputCls} value={d.difficulty} onChange={e => setD({ ...d, difficulty: e.target.value })}>{DIFFS.map(t => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Reset Cycle"><select className={inputCls} value={d.reset_cycle} onChange={e => setD({ ...d, reset_cycle: e.target.value })}>{RESETS.map(t => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Scope">
        <select className={inputCls} value={d.seasonal ? "seasonal" : "lifetime"} onChange={e => setD({ ...d, seasonal: e.target.value === "seasonal" })}>
          <option value="seasonal">Seasonal</option><option value="lifetime">Lifetime</option>
        </select>
      </Field>
      <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Btn>
      </div>
    </form>
  );
}

/* ============ Ranks ============ */

function RanksModule() {
  const qc = useQueryClient();
  const { data: ranks = [], isLoading } = useQuery({ queryKey: ["ranks"], queryFn: () => listRanks() });
  const upd = useMutation({ mutationFn: (d: any) => updateRank({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["ranks"] }) });
  const reord = useMutation({ mutationFn: (items: any[]) => reorderRanks({ data: { items } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["ranks"] }) });

  function move(i: number, dir: -1 | 1) {
    const j = i + dir; if (j < 0 || j >= ranks.length) return;
    const next = [...ranks]; [next[i], next[j]] = [next[j], next[i]];
    reord.mutate(next.map((r, idx) => ({ key: r.key, position: idx + 1 })));
  }

  if (isLoading) return <div className="py-6 text-center text-xs text-muted-foreground">Loading…</div>;

  return (
    <Section title="Rank Management">
      <div className="space-y-3">
        {ranks.map((r: any, i: number) => <RankRow key={r.key} rank={r} index={i} onSave={(p) => upd.mutate(p)} onMove={(d) => move(i, d)} />)}
      </div>
    </Section>
  );
}

function RankRow({ rank, index, onSave, onMove }: { rank: any; index: number; onSave: (r: any) => void; onMove: (d: -1 | 1) => void }) {
  const [d, setD] = useState(rank);
  useEffect(() => setD(rank), [rank]);
  return (
    <div className="rounded-md border border-border bg-ink/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-xs uppercase tracking-widest text-muted-foreground">#{index + 1}</span>
          <span className="font-medium">{d.name}</span>
          {d.locked && <span className="rounded border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">Locked</span>}
        </div>
        <div className="flex gap-1">
          <Btn variant="ghost" onClick={() => onMove(-1)}>↑</Btn>
          <Btn variant="ghost" onClick={() => onMove(1)}>↓</Btn>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name"><input className={inputCls} value={d.name} onChange={e => setD({ ...d, name: e.target.value })} /></Field>
        <Field label="Subtitle"><input className={inputCls} value={d.subtitle} onChange={e => setD({ ...d, subtitle: e.target.value })} /></Field>
        <Field label="Description"><textarea rows={2} className={inputCls} value={d.description} onChange={e => setD({ ...d, description: e.target.value })} /></Field>
        <Field label="Promotion Requirement (notes)"><textarea rows={2} className={inputCls} value={d.requirement} onChange={e => setD({ ...d, requirement: e.target.value })} /></Field>
        <Field label="Status">
          <select className={inputCls} value={d.locked ? "locked" : "open"} onChange={e => setD({ ...d, locked: e.target.value === "locked" })}>
            <option value="open">Open</option><option value="locked">Locked</option>
          </select>
        </Field>
        <Field label="Min Total Stars"><input type="number" min={0} className={inputCls} value={d.min_total_stars ?? 0} onChange={e => setD({ ...d, min_total_stars: Number(e.target.value) })} /></Field>
        <Field label="Min A-Grades"><input type="number" min={0} className={inputCls} value={d.min_a_grades ?? 0} onChange={e => setD({ ...d, min_a_grades: Number(e.target.value) })} /></Field>
        <Field label="Min B-Grades"><input type="number" min={0} className={inputCls} value={d.min_b_grades ?? 0} onChange={e => setD({ ...d, min_b_grades: Number(e.target.value) })} /></Field>
        <Field label="Min Unique Achievements"><input type="number" min={0} className={inputCls} value={d.min_achievements ?? 0} onChange={e => setD({ ...d, min_achievements: Number(e.target.value) })} /></Field>
      </div>
      <div className="mt-2 flex justify-end"><Btn onClick={() => onSave(d)}>Save</Btn></div>
    </div>
  );
}

/* ============ Legacy ============ */

function LegacyModule() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["legacy"], queryFn: () => getLegacy() });
  const cfgMut = useMutation({ mutationFn: (d: any) => updateLegacyConfig({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["legacy"] }) });
  const titleMut = useMutation({ mutationFn: (d: any) => upsertLegacyTitle({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["legacy"] }) });
  const titleDel = useMutation({ mutationFn: (id: string) => deleteLegacyTitle({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["legacy"] }) });

  const [spm, setSpm] = useState(10);
  const [mps, setMps] = useState(5);
  useEffect(() => { if (data) { setSpm(data.config.stars_per_moon); setMps(data.config.moons_per_sun); } }, [data]);

  if (isLoading || !data) return <div className="py-6 text-center text-xs text-muted-foreground">Loading…</div>;
  const starsPerSun = spm * mps;

  return (
    <div className="space-y-6">
      <Section title="Conversion Ratios" action={<Btn onClick={() => cfgMut.mutate({ stars_per_moon: spm, moons_per_sun: mps })} disabled={cfgMut.isPending}>Save Ratios</Btn>}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Stars → Moon"><input type="number" min={1} className={inputCls} value={spm} onChange={e => setSpm(Math.max(1, Number(e.target.value)))} /></Field>
          <Field label="Moons → Sun"><input type="number" min={1} className={inputCls} value={mps} onChange={e => setMps(Math.max(1, Number(e.target.value)))} /></Field>
          <Field label="Stars per Sun"><div className="rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-gold">{starsPerSun} ★</div></Field>
        </div>
      </Section>

      <Section title="Legacy Titles" action={<Btn onClick={() => titleMut.mutate({ name: "New Title", min_stars: 0, flavor: "", position: (data.titles.length + 1) })}>+ New Title</Btn>}>
        <div className="space-y-2">
          {data.titles.map((t: any) => <LegacyTitleRow key={t.id} title={t} onSave={(d) => titleMut.mutate(d)} onDelete={() => titleDel.mutate(t.id)} />)}
          {!data.titles.length && <div className="py-6 text-center text-xs text-muted-foreground">No titles defined.</div>}
        </div>
      </Section>
    </div>
  );
}

function LegacyTitleRow({ title, onSave, onDelete }: { title: any; onSave: (d: any) => void; onDelete: () => void }) {
  const [d, setD] = useState(title);
  useEffect(() => setD(title), [title]);
  return (
    <div className="grid items-end gap-2 rounded-md border border-border bg-ink/40 p-3 sm:grid-cols-[1fr_120px_2fr_auto_auto]">
      <Field label="Title"><input className={inputCls} value={d.name} onChange={e => setD({ ...d, name: e.target.value })} /></Field>
      <Field label="Min ★"><input type="number" min={0} className={inputCls} value={d.min_stars} onChange={e => setD({ ...d, min_stars: Number(e.target.value) })} /></Field>
      <Field label="Flavor"><input className={inputCls} value={d.flavor} onChange={e => setD({ ...d, flavor: e.target.value })} /></Field>
      <Btn onClick={() => onSave({ id: d.id, name: d.name, min_stars: d.min_stars, flavor: d.flavor, position: d.position })}>Save</Btn>
      <Btn variant="danger" onClick={onDelete}>Remove</Btn>
    </div>
  );
}
