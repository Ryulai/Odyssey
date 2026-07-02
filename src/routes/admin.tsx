import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRole, can, ROLE_META, PERMISSIONS, type Capability } from "@/lib/roles";
import { AuthGate } from "@/components/auth-gate";
import { GRADE_META } from "@/lib/employee-data";
import {
  listStaff, listUserAccounts, upsertStaff, linkStaffAccount, deleteStaff, transferStaff,
  getGradeConfig, updateGradeWeights, updateGradeRule,
  listAchievements, upsertAchievement, deleteAchievement,
  listRanks, updateRank, reorderRanks,
  getLegacy, updateLegacyConfig, upsertLegacyTitle, deleteLegacyTitle,
  listLocations, upsertLocation, deleteLocation,
} from "@/lib/config.functions";
import {
  listLegacyHoldings, upsertLegacyHolding, deleteLegacyHolding,
} from "@/lib/legacy.functions";
import { PRIMARY_CLASSES, CLASS_ROLES, TEMPORARY_ROLES, RANKS, STAFF_STATUSES, classLabel, roleLabel, rankLabel, statusLabel, type PrimaryClass } from "@/lib/rpg";


export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — The Odyssey Guide" },
      { name: "description", content: "Configure staff, grades, achievements, ranks and legacy economy." },
    ],
  }),
  component: () => <AuthGate><AdminPage /></AuthGate>,
});

type AdminTab = "staff" | "locations" | "holdings" | "grades" | "achievements" | "ranks" | "legacy";

const TABS: { key: AdminTab; label: string; hint: string; cap: Capability }[] = [
  { key: "staff",        label: "Staff",            hint: "Work Identity — fleet, department, position, manager", cap: "admin.staff" },
  { key: "locations",    label: "Fleets",           hint: "Manage locations / venues and their captain",         cap: "admin.staff" },
  { key: "holdings",     label: "Legacy Registry",  hint: "Founders, Partners, Investors — independent of current workplace", cap: "admin.legacy" },
  { key: "grades",       label: "Grades",           hint: "Define A/B/C/D rules and weights",          cap: "admin.grades" },
  { key: "achievements", label: "Achievements",     hint: "Define achievements & star rewards",        cap: "admin.achievements" },
  { key: "ranks",        label: "Ranks",            hint: "Configure Hunter ranks & promotion rules",  cap: "admin.ranks" },
  { key: "legacy",       label: "Legacy Economy",   hint: "Star/Moon/Sun conversion ratios & flavor titles", cap: "admin.legacy" },
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
            Configuration only. Persisted to The Odyssey Guide database.
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
        {tab === "locations"    && <LocationsModule />}
        {tab === "holdings"     && can(role, "admin.legacy")       && <HoldingsModule />}
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
        <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">Harbor Admin</div>
        <div className="text-xs text-muted-foreground">Charts & manifests for The Odyssey Guide</div>
      </div>
      <Link to="/" className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">
        ← Voyage
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
  location_id?: string | null;
  employee_code?: string | null; join_date?: string | null;
  phone?: string | null; branch?: string | null;
  career_path?: string | null; shipbuilder_path?: string | null;
  // Sprint 1 — RPG hierarchy
  primary_class?: string | null; primary_role?: string | null;
  secondary_class?: string | null; secondary_role?: string | null;
  secondary_unlocked?: boolean;
  rank_key?: string | null;
  total_stars?: number; latest_grade?: string | null;
  promotion_ready?: boolean; promotion_next_rank_name?: string | null;
};


function StaffModule() {
  const qc = useQueryClient();
  const { role } = useRole();
  const { data: staff = [], isLoading } = useQuery({ queryKey: ["staff"], queryFn: () => listStaff() });
  const { data: accounts = [] } = useQuery({ queryKey: ["user-accounts"], queryFn: () => listUserAccounts(), enabled: role === "director" });
  const { data: locations = [] } = useQuery({ queryKey: ["locations"], queryFn: () => listLocations() });
  const invalidate = () => { qc.invalidateQueries({ queryKey: ["staff"] }); qc.invalidateQueries({ queryKey: ["fleet-overview"] }); qc.invalidateQueries({ queryKey: ["manager-dashboard"] }); };
  const save = useMutation({ mutationFn: (d: any) => upsertStaff({ data: d }), onSuccess: invalidate });
  const link = useMutation({ mutationFn: (d: any) => linkStaffAccount({ data: d }), onSuccess: invalidate });
  const del  = useMutation({ mutationFn: (id: string) => deleteStaff({ data: { id } }), onSuccess: invalidate });
  const transfer = useMutation({ mutationFn: (d: any) => transferStaff({ data: d }), onSuccess: invalidate });
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [transferring, setTransferring] = useState<StaffRow | null>(null);

  const blank: StaffRow = {
    id: "", name: "", email: "", role: "", role_family: "hunter", department: "Sales",
    manager_id: null, status: "active", user_id: null, app_role: "staff", location_id: null,
    employee_code: "", join_date: "", phone: "", branch: "", career_path: "", shipbuilder_path: "",
    primary_class: "ranger", primary_role: "hunter",
    secondary_class: null, secondary_role: null, secondary_unlocked: false,
    rank_key: "bronze",
  };

  return (
    <Section title="Staff Management" action={<Btn onClick={() => setEditing(blank)}>+ Add Staff</Btn>}>
      {isLoading ? <div className="py-6 text-center text-xs text-muted-foreground">Loading…</div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Emp ID</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Class · Role</th>
                <th className="py-2 pr-3">Rank</th>
                <th className="py-2 pr-3">Fleet</th>
                <th className="py-2 pr-3">Manager</th>
                <th className="py-2 pr-3">Joined</th>
                <th className="py-2 pr-3">Grade</th>
                <th className="py-2 pr-3">Stars</th>
                <th className="py-2 pr-3">Promotion</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s: any) => (
                <tr key={s.id} className={`border-b border-border/40 ${s.status === "inactive" ? "opacity-50" : ""}`}>
                  <td className="py-2 pr-3">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-[10px] text-muted-foreground">{s.email ?? "—"}</div>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{s.employee_code ?? "—"}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{s.role}</td>
                  <td className="py-2 pr-3 text-muted-foreground capitalize">
                    {s.primary_class ? (
                      <div>
                        <span className="text-foreground">{s.primary_class}</span>
                        {s.primary_role && <span className="text-muted-foreground"> · {s.primary_role}</span>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/70">— unassigned —</span>
                    )}
                    {(s.career_path || s.shipbuilder_path) && (
                      <div className="text-[10px] text-muted-foreground/80">
                        {s.career_path && <span>C: {s.career_path}</span>}
                        {s.career_path && s.shipbuilder_path && " · "}
                        {s.shipbuilder_path && <span>S: {s.shipbuilder_path}</span>}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground capitalize">{s.current_rank_key ?? s.rank_key ?? "bronze"}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{locations.find((l: any) => l.id === s.location_id)?.name ?? <span className="text-amber-300/80">— Unassigned —</span>}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{staff.find((x: any) => x.id === s.manager_id)?.name ?? "—"}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{s.join_date ?? "—"}</td>
                  <td className="py-2 pr-3">{s.latest_grade ? <span className="font-display text-gold">{s.latest_grade}</span> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="py-2 pr-3 text-gold">{s.role_family === "hunter" ? (s.total_stars ?? 0) : "—"}</td>
                  <td className="py-2 pr-3">
                    {s.role_family !== "hunter"
                      ? <span className="text-muted-foreground">—</span>
                      : s.promotion_ready
                        ? <span className="text-emerald-400">Ready → {s.promotion_next_rank_name}</span>
                        : s.promotion_next_rank_name
                          ? <span className="text-muted-foreground">Building</span>
                          : <span className="text-muted-foreground">Max</span>}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground capitalize">{s.status ?? "active"}</td>
                  <td className="py-2 pr-3 text-right">
                    <div className="inline-flex flex-wrap justify-end gap-2">
                      <Btn variant="ghost" onClick={() => setEditing(s)}>Edit</Btn>
                      {role === "director" && <Btn variant="ghost" onClick={() => setTransferring(s)}>Transfer</Btn>}
                      {role === "director" && s.status !== "inactive" && (
                        <Btn variant="ghost" onClick={() => transfer.mutate({ id: s.id, status: "inactive" })}>Deactivate</Btn>
                      )}
                      {role === "director" && s.status === "inactive" && (
                        <Btn variant="ghost" onClick={() => transfer.mutate({ id: s.id, status: "active" })}>Reactivate</Btn>
                      )}
                      {role === "director" && !s.user_id && emailMatchesAccount(s.email, accounts) && (
                        <Btn variant="ghost" onClick={() => link.mutate({ staff_id: s.id, user_id: emailMatchesAccount(s.email, accounts)?.id, app_role: roleToAppRole(s.role) })}>Link</Btn>
                      )}
                      {role === "director" && <Btn variant="danger" onClick={() => { if (confirm(`Delete ${s.name}?`)) del.mutate(s.id); }}>Delete</Btn>}
                    </div>
                  </td>
                </tr>
              ))}
              {!staff.length && (<tr><td colSpan={13} className="py-6 text-center text-xs text-muted-foreground">No staff yet. Click "Add Staff" to log your first crew member.</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <StaffForm
          row={editing}
          managers={staff.filter((s: any) => s.id !== editing.id && s.status !== "inactive")}
          accounts={accounts}
          locations={locations}
          isDirector={role === "director"}
          onCancel={() => setEditing(null)}
          onSave={(d) => save.mutate(d, { onSuccess: () => setEditing(null) })}
          busy={save.isPending}
        />
      )}
      {transferring && (
        <TransferForm
          row={transferring}
          managers={staff.filter((s: any) => s.id !== transferring.id && s.status !== "inactive")}
          locations={locations}
          onCancel={() => setTransferring(null)}
          onSave={(d) => transfer.mutate({ id: transferring.id, ...d }, { onSuccess: () => setTransferring(null) })}
          busy={transfer.isPending}
        />
      )}
    </Section>
  );
}

function TransferForm({ row, managers, locations, onSave, onCancel, busy }: {
  row: StaffRow; managers: any[]; locations: any[]; onSave: (d: { manager_id: string | null; location_id: string | null }) => void; onCancel: () => void; busy: boolean;
}) {
  const [managerId, setManagerId] = useState<string | null>(row.manager_id);
  const [locationId, setLocationId] = useState<string | null>(row.location_id ?? null);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ manager_id: managerId, location_id: locationId }); }}
      className="mt-5 grid gap-3 rounded-md border border-gold/30 bg-ink/50 p-4 sm:grid-cols-2">
      <div className="sm:col-span-2 font-display text-xs uppercase tracking-widest text-gold">Transfer · {row.name}</div>
      <Field label="New Manager (Captain)">
        <select className={inputCls} value={managerId ?? ""} onChange={e => setManagerId(e.target.value || null)}>
          <option value="">— None —</option>
          {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </Field>
      <Field label="New Fleet / Location">
        <select className={inputCls} value={locationId ?? ""} onChange={e => setLocationId(e.target.value || null)}>
          <option value="">— Unassigned —</option>
          {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}{l.code ? ` · ${l.code}` : ""}</option>)}
        </select>
      </Field>
      <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Transferring…" : "Transfer"}</Btn>
      </div>
    </form>
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

function StaffForm({ row, managers, accounts, locations, isDirector, onSave, onCancel, busy }: {
  row: StaffRow; managers: any[]; accounts: any[]; locations: any[]; isDirector: boolean; onSave: (r: any) => void; onCancel: () => void; busy: boolean;
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

      {/* Identity */}
      <div className="sm:col-span-2 -mb-1 mt-2 border-b border-border/60 pb-1 text-[10px] font-display uppercase tracking-[0.25em] text-muted-foreground">Identity</div>
      <Field label="Name"><input className={inputCls} value={d.name} onChange={e => set("name", e.target.value)} required /></Field>
      <Field label="Employee ID"><input className={inputCls} value={d.employee_code ?? ""} onChange={e => set("employee_code", e.target.value)} placeholder="e.g. NAV-0042" /></Field>
      <Field label="Email"><input type="email" className={inputCls} value={d.email ?? ""} onChange={e => set("email", e.target.value)} /></Field>
      <Field label="Phone"><input className={inputCls} value={d.phone ?? ""} onChange={e => set("phone", e.target.value)} placeholder="e.g. +60 12 345 6789" /></Field>
      <Field label="Branch"><input className={inputCls} value={d.branch ?? ""} onChange={e => set("branch", e.target.value)} placeholder="e.g. KL · Ting Livehouse" /></Field>
      <Field label="Join Date"><input type="date" className={inputCls} value={d.join_date ?? ""} onChange={e => set("join_date", e.target.value)} /></Field>

      {/* Work Identity */}
      <div className="sm:col-span-2 -mb-1 mt-3 border-b border-border/60 pb-1 text-[10px] font-display uppercase tracking-[0.25em] text-muted-foreground">Work Identity — where they report today</div>
      <Field label="Position"><input className={inputCls} value={d.role} onChange={e => { set("role", e.target.value); set("app_role", roleToAppRole(e.target.value)); }} placeholder="e.g. Finance Manager" /></Field>
      <Field label="Department">
        <select className={inputCls} value={d.department} onChange={e => set("department", e.target.value)}>
          {DEPARTMENTS.map(x => <option key={x} value={x}>{x}</option>)}
        </select>
      </Field>
      {isDirector && <Field label="Manager (Captain)">
        <select className={inputCls} value={d.manager_id ?? ""} onChange={e => set("manager_id", e.target.value || null)}>
          <option value="">— None —</option>
          {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </Field>}
      <Field label="Assigned Fleet / Location">
        <select className={inputCls} value={d.location_id ?? ""} onChange={e => set("location_id", e.target.value || null)}>
          <option value="">— Unassigned —</option>
          {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}{l.code ? ` · ${l.code}` : ""}</option>)}
        </select>
      </Field>

      {/* RPG Identity */}
      <div className="sm:col-span-2 -mb-1 mt-3 border-b border-border/60 pb-1 text-[10px] font-display uppercase tracking-[0.25em] text-muted-foreground">RPG Identity — character class & progression</div>
      <Field label="Primary Class">
        <select className={inputCls} value={d.primary_class ?? "ranger"} onChange={e => {
          const cls = e.target.value as any;
          set("primary_class", cls);
          // Reset role to first valid option for the newly chosen class.
          set("primary_role", CLASS_ROLES[cls as PrimaryClass]?.[0] ?? null);
        }}>
          {PRIMARY_CLASSES.map(c => <option key={c} value={c}>{titleCase(c)}</option>)}
        </select>
      </Field>
      <Field label="Primary Role">
        <select className={inputCls} value={d.primary_role ?? ""} onChange={e => set("primary_role", e.target.value || null)} required>
          <option value="">— Select role —</option>
          {(CLASS_ROLES[(d.primary_class ?? "ranger") as PrimaryClass] ?? []).map(r => (
            <option key={r} value={r}>
              {titleCase(r)}{TEMPORARY_ROLES.has(r) ? " (Temporary)" : ""}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Rank">
        <select className={inputCls} value={d.rank_key ?? "bronze"} onChange={e => set("rank_key", e.target.value)}>
          {RANKS.map(r => (
            <option key={r.key} value={r.key} disabled={!r.unlocked}>
              {r.label}{r.unlocked ? "" : " — locked"}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Career Tree Path"><input className={inputCls} value={d.career_path ?? ""} onChange={e => set("career_path", e.target.value)} placeholder="e.g. Master Ambassador" /></Field>
      <Field label="Shipbuilder Tree Path"><input className={inputCls} value={d.shipbuilder_path ?? ""} onChange={e => set("shipbuilder_path", e.target.value)} placeholder="e.g. Venue Partner" /></Field>

      {/* Secondary Career — stored but LOCKED until Gold rank in the future */}
      <div className="sm:col-span-2 -mb-1 mt-3 border-b border-border/60 pb-1 text-[10px] font-display uppercase tracking-[0.25em] text-muted-foreground">
        Secondary Career — 🔒 locked (unlocks at Gold rank)
      </div>
      <Field label="Secondary Class">
        <select className={inputCls} value={d.secondary_class ?? ""} disabled title="Locked until Gold rank">
          <option value="">— locked —</option>
        </select>
      </Field>
      <Field label="Secondary Role">
        <select className={inputCls} value={d.secondary_role ?? ""} disabled title="Locked until Gold rank">
          <option value="">— locked —</option>
        </select>
      </Field>
      <div className="sm:col-span-2 rounded border border-border/60 bg-ink/40 px-3 py-2 text-[11px] italic text-muted-foreground">
        Secondary career is reserved for a future sprint. The fields exist in the database but are not editable or displayed on the dashboard until the crew member reaches Gold rank.
      </div>

      <div className="sm:col-span-2 -mb-1 mt-3 border-b border-border/60 pb-1 text-[10px] font-display uppercase tracking-[0.25em] text-muted-foreground">Account</div>


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

const FACTOR_FIELDS: { key: "sales_w" | "attendance_w" | "achievements_w" | "review_w" | "discipline_w" | "kpi_w"; label: string }[] = [
  { key: "sales_w",        label: "Sales" },
  { key: "attendance_w",   label: "Attendance" },
  { key: "achievements_w", label: "Achievements" },
  { key: "review_w",       label: "Reviews" },
  { key: "discipline_w",   label: "Discipline" },
  { key: "kpi_w",          label: "KPI Completion" },
];

function GradesModule() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["grades"], queryFn: () => getGradeConfig() });
  const wMut = useMutation({ mutationFn: (d: any) => updateGradeWeights({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["grades"] }) });
  const rMut = useMutation({ mutationFn: (d: any) => updateGradeRule({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["grades"] }) });

  const [w, setW] = useState({ sales_w: 30, attendance_w: 15, achievements_w: 15, review_w: 15, discipline_w: 10, kpi_w: 15 });
  useEffect(() => {
    if (data?.weights) {
      setW({
        sales_w: data.weights.sales_w ?? 30,
        attendance_w: data.weights.attendance_w ?? 15,
        achievements_w: data.weights.achievements_w ?? 15,
        review_w: data.weights.review_w ?? 15,
        discipline_w: data.weights.discipline_w ?? 10,
        kpi_w: data.weights.kpi_w ?? 15,
      });
    }
  }, [data]);
  const total = FACTOR_FIELDS.reduce((a, f) => a + (w[f.key] || 0), 0);

  if (isLoading || !data) return <div className="py-6 text-center text-xs text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <Section
        title="Grade Engine — Factor Weights"
        action={<Btn onClick={() => wMut.mutate(w)} disabled={wMut.isPending}>Save Weights</Btn>}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FACTOR_FIELDS.map(f => (
            <Field key={f.key} label={`${f.label} — ${w[f.key]}`}>
              <input type="range" min={0} max={50} step={1} value={w[f.key]}
                onChange={e => setW({ ...w, [f.key]: Number(e.target.value) })}
                className="w-full accent-[var(--color-gold,gold)]" />
            </Field>
          ))}
        </div>
        <p className="mt-3 text-[11px] italic text-muted-foreground">
          Composite = Σ (factor × weight) / Σ weights. Current weight total: <span className="text-gold">{total}</span> (weights are normalized at compute time, so any total works).
        </p>
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

/* ============ Locations / Fleets ============ */
function LocationsModule() {
  const qc = useQueryClient();
  const { data: locations = [], isLoading } = useQuery({ queryKey: ["locations"], queryFn: () => listLocations() });
  const { data: staff = [] } = useQuery({ queryKey: ["staff"], queryFn: () => listStaff() });
  const save = useMutation({ mutationFn: (d: any) => upsertLocation({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }) });
  const del = useMutation({ mutationFn: (id: string) => deleteLocation({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }) });
  const [editing, setEditing] = useState<any | null>(null);

  return (
    <Section title="Fleet Locations" action={
      <Btn onClick={() => setEditing({ id: "", name: "", code: "", kind: "venue", manager_id: null, notes: "", status: "active" })}>+ New Fleet</Btn>
    }>
      {isLoading ? <div className="py-6 text-center text-xs text-muted-foreground">Loading…</div> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {locations.map((loc: any) => {
            const captain = staff.find((s: any) => s.id === loc.manager_id);
            const crew = staff.filter((s: any) => s.location_id === loc.id);
            return (
              <div key={loc.id} className="rounded-md border border-gold/30 bg-ink/40 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display text-lg text-gold">{loc.name}</div>
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      {loc.kind ?? "venue"}{loc.code ? ` · ${loc.code}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Btn variant="ghost" onClick={() => setEditing(loc)}>Edit</Btn>
                    <Btn variant="danger" onClick={() => del.mutate(loc.id)}>Delete</Btn>
                  </div>
                </div>
                <div className="mt-3 text-sm">
                  <div><span className="text-muted-foreground">Captain:</span> {captain?.name ?? "— Unassigned —"}</div>
                  <div className="mt-1"><span className="text-muted-foreground">Crew ({crew.length}):</span> {crew.map((c: any) => c.name).join(", ") || "—"}</div>
                </div>
              </div>
            );
          })}
          {!locations.length && <div className="sm:col-span-2 py-6 text-center text-xs text-muted-foreground">No fleets yet.</div>}
        </div>
      )}
      {editing && (
        <LocationForm row={editing} managers={staff}
          onCancel={() => setEditing(null)}
          onSave={(d) => save.mutate(d, { onSuccess: () => setEditing(null) })}
          busy={save.isPending} />
      )}
    </Section>
  );
}

function LocationForm({ row, managers, onSave, onCancel, busy }: {
  row: any; managers: any[]; onSave: (r: any) => void; onCancel: () => void; busy: boolean;
}) {
  const [d, setD] = useState(row);
  return (
    <form onSubmit={(e) => { e.preventDefault(); const p = { ...d }; if (!p.id) delete p.id; onSave(p); }}
      className="mt-5 grid gap-3 rounded-md border border-gold/30 bg-ink/50 p-4 sm:grid-cols-2">
      <div className="sm:col-span-2 font-display text-xs uppercase tracking-widest text-gold">
        {row.id ? "Edit Fleet" : "Create Fleet"}
      </div>
      <Field label="Name"><input className={inputCls} value={d.name} onChange={e => setD({ ...d, name: e.target.value })} required /></Field>
      <Field label="Code"><input className={inputCls} value={d.code ?? ""} onChange={e => setD({ ...d, code: e.target.value })} placeholder="e.g. TING" /></Field>
      <Field label="Kind">
        <select className={inputCls} value={d.kind ?? "venue"} onChange={e => setD({ ...d, kind: e.target.value })}>
          <option value="venue">Venue</option>
          <option value="livehouse">Livehouse</option>
          <option value="ktv">KTV</option>
          <option value="reserve">Reserve</option>
          <option value="hq">HQ</option>
        </select>
      </Field>
      <Field label="Captain (Manager)">
        <select className={inputCls} value={d.manager_id ?? ""} onChange={e => setD({ ...d, manager_id: e.target.value || null })}>
          <option value="">— None —</option>
          {managers.map((m: any) => <option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}
        </select>
      </Field>
      <Field label="Status">
        <select className={inputCls} value={d.status ?? "active"} onChange={e => setD({ ...d, status: e.target.value })}>
          <option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
      </Field>
      <Field label="Notes"><input className={inputCls} value={d.notes ?? ""} onChange={e => setD({ ...d, notes: e.target.value })} /></Field>
      <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Btn>
      </div>
    </form>
  );
}

/* ============ Legacy Registry (Holdings) ============ */

const HOLDING_TITLES = ["Founder", "Co-Founder", "Partner", "Shareholder", "Investor", "Builder", "Pioneer", "Mentor"];

function HoldingsModule() {
  const qc = useQueryClient();
  const { data: holdings = [], isLoading } = useQuery({ queryKey: ["legacy-holdings"], queryFn: () => listLegacyHoldings() });
  const { data: staff = [] } = useQuery({ queryKey: ["staff"], queryFn: () => listStaff() });
  const { data: locations = [] } = useQuery({ queryKey: ["locations"], queryFn: () => listLocations() });
  const save = useMutation({ mutationFn: (d: any) => upsertLegacyHolding({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["legacy-holdings"] }) });
  const del  = useMutation({ mutationFn: (id: string) => deleteLegacyHolding({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["legacy-holdings"] }) });
  const [editing, setEditing] = useState<any | null>(null);

  const blank = { id: "", staff_id: "", title: "Founder", location_id: null, note: "", granted_at: "", ended_at: "" };

  return (
    <Section title="Legacy Registry — Founders, Partners, Investors"
      action={<Btn onClick={() => setEditing(blank)}>+ New Holding</Btn>}>
      <p className="mb-4 text-[11px] italic text-muted-foreground">
        Legendary titles independent of current Work Identity. A person may hold many — e.g. Founder of one fleet while working at another.
      </p>
      {isLoading ? <div className="py-6 text-center text-xs text-muted-foreground">Loading…</div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3">Holder</th>
                <th className="py-2 pr-3">Title</th>
                <th className="py-2 pr-3">Fleet</th>
                <th className="py-2 pr-3">Granted</th>
                <th className="py-2 pr-3">Ended</th>
                <th className="py-2 pr-3">Note</th>
                <th className="py-2 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h: any) => (
                <tr key={h.id} className="border-b border-border/40">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{h.staff?.name ?? "—"}</div>
                    <div className="text-[10px] text-muted-foreground">{h.staff?.email ?? ""}</div>
                  </td>
                  <td className="py-2 pr-3">
                    <span className="rounded border border-gold/40 bg-gold/5 px-2 py-0.5 text-[11px] font-display uppercase tracking-widest text-gold">{h.title}</span>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{h.location?.name ?? <span className="italic text-muted-foreground/70">Company-wide</span>}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{h.granted_at ?? "—"}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{h.ended_at ?? <span className="text-emerald-300">Active</span>}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{h.note || "—"}</td>
                  <td className="py-2 pr-3 text-right">
                    <div className="inline-flex gap-2">
                      <Btn variant="ghost" onClick={() => setEditing({ ...h, location_id: h.location_id ?? null, granted_at: h.granted_at ?? "", ended_at: h.ended_at ?? "" })}>Edit</Btn>
                      <Btn variant="danger" onClick={() => { if (confirm(`Remove ${h.title} holding?`)) del.mutate(h.id); }}>Remove</Btn>
                    </div>
                  </td>
                </tr>
              ))}
              {!holdings.length && (<tr><td colSpan={7} className="py-6 text-center text-xs text-muted-foreground">No legacy holdings recorded yet.</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <HoldingForm row={editing} staff={staff} locations={locations}
          onCancel={() => setEditing(null)}
          onSave={(d) => save.mutate(d, { onSuccess: () => setEditing(null) })}
          busy={save.isPending} />
      )}
    </Section>
  );
}

function HoldingForm({ row, staff, locations, onSave, onCancel, busy }: {
  row: any; staff: any[]; locations: any[]; onSave: (d: any) => void; onCancel: () => void; busy: boolean;
}) {
  const [d, setD] = useState<any>(row);
  return (
    <form onSubmit={(e) => { e.preventDefault();
      if (!d.staff_id || !d.title?.trim()) return;
      const payload: any = {
        staff_id: d.staff_id, title: d.title.trim(), location_id: d.location_id || null,
        note: d.note ?? "", granted_at: d.granted_at || null, ended_at: d.ended_at || null,
      };
      if (d.id) payload.id = d.id;
      onSave(payload);
    }} className="mt-5 grid gap-3 rounded-md border border-gold/30 bg-ink/50 p-4 sm:grid-cols-2">
      <div className="sm:col-span-2 font-display text-xs uppercase tracking-widest text-gold">
        {row.id ? "Edit Holding" : "Grant Legacy Title"}
      </div>
      <Field label="Holder">
        <select className={inputCls} value={d.staff_id ?? ""} onChange={e => setD({ ...d, staff_id: e.target.value })} required>
          <option value="">— Select person —</option>
          {staff.map((s: any) => <option key={s.id} value={s.id}>{s.name}{s.email ? ` · ${s.email}` : ""}</option>)}
        </select>
      </Field>
      <Field label="Title">
        <input className={inputCls} list="holding-titles" value={d.title ?? ""} onChange={e => setD({ ...d, title: e.target.value })} required />
        <datalist id="holding-titles">{HOLDING_TITLES.map(t => <option key={t} value={t} />)}</datalist>
      </Field>
      <Field label="Fleet (optional — leave blank for company-wide)">
        <select className={inputCls} value={d.location_id ?? ""} onChange={e => setD({ ...d, location_id: e.target.value || null })}>
          <option value="">— Company-wide —</option>
          {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}{l.code ? ` · ${l.code}` : ""}</option>)}
        </select>
      </Field>
      <Field label="Note"><input className={inputCls} value={d.note ?? ""} onChange={e => setD({ ...d, note: e.target.value })} placeholder="e.g. Founding partner, 30% stake" /></Field>
      <Field label="Granted"><input type="date" className={inputCls} value={d.granted_at ?? ""} onChange={e => setD({ ...d, granted_at: e.target.value })} /></Field>
      <Field label="Ended (leave blank if active)"><input type="date" className={inputCls} value={d.ended_at ?? ""} onChange={e => setD({ ...d, ended_at: e.target.value })} /></Field>
      <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Btn>
      </div>
    </form>
  );
}
