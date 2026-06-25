import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useRole, can, ROLE_META, PERMISSIONS, type Capability } from "@/lib/roles";

import {
  SAMPLE_EMPLOYEE,
  SAMPLE_OPERATIONAL_EMPLOYEE,
  HUNTER_RANKS,
  LEGACY_TITLES,
  GRADE_META,
  type RankInfo,
  type RankKey,
  type Grade,
  type LegacyTitle,
  type AchievementType,
  type Difficulty,
  type ResetCycle,
} from "@/lib/employee-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — Guild Ledger" },
      { name: "description", content: "Configure staff, grades, achievements, ranks and legacy economy." },
    ],
  }),
  component: AdminPage,
});

/* =============================== Types =============================== */

type Department = "Sales" | "Operations" | "Marketing" | "Service" | "Leadership";
const DEPARTMENTS: Department[] = ["Sales", "Operations", "Marketing", "Service", "Leadership"];

interface StaffRow {
  id: string;
  name: string;
  role: string;
  roleFamily: "hunter" | "operational";
  department: Department;
  managerId: string | null;
  email: string;
}

interface GradeRule {
  grade: Grade;
  minScore: number;     // 0..100 composite cutoff
  bonusPct: number;     // monthly bonus multiplier
  note: string;
}

interface AchievementConfig {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  difficulty: Difficulty;
  resetCycle: ResetCycle;
  starReward: number;
  requirement: string;
  seasonal: boolean;     // true = seasonal, false = lifetime
}

interface RankConfig {
  key: RankKey;
  name: string;
  subtitle: string;
  description: string;
  requirement: string;
  locked: boolean;
}

interface LegacyConfig {
  starsPerMoon: number;
  moonsPerSun: number;
  titles: LegacyTitle[];
}

/* ========================== Initial seed data ========================== */

const INITIAL_STAFF: StaffRow[] = [
  {
    id: SAMPLE_EMPLOYEE.id, name: SAMPLE_EMPLOYEE.name, role: String(SAMPLE_EMPLOYEE.role),
    roleFamily: "hunter", department: "Sales", managerId: null, email: "ariane@guild.io",
  },
  {
    id: SAMPLE_OPERATIONAL_EMPLOYEE.id, name: SAMPLE_OPERATIONAL_EMPLOYEE.name,
    role: String(SAMPLE_OPERATIONAL_EMPLOYEE.role), roleFamily: "operational",
    department: "Operations", managerId: SAMPLE_EMPLOYEE.id, email: "marco@guild.io",
  },
];

const INITIAL_GRADES: GradeRule[] = [
  { grade: "A", minScore: 90, bonusPct: 25, note: "Full Sail — exceeds all targets." },
  { grade: "B", minScore: 75, bonusPct: 15, note: "Steady Voyage — above expectations." },
  { grade: "C", minScore: 60, bonusPct: 5,  note: "On Course — meets baseline." },
  { grade: "D", minScore: 0,  bonusPct: 0,  note: "Adrift — needs improvement." },
];

const INITIAL_ACHIEVEMENTS: AchievementConfig[] = [
  { id: "ach-1", name: "First Blood", description: "Close your first deal of the month.",
    type: "Monthly", difficulty: "Easy", resetCycle: "Monthly", starReward: 1,
    requirement: "1 closed deal", seasonal: true },
  { id: "ach-2", name: "Whale Hunter", description: "Close a deal over $50K.",
    type: "One-Time", difficulty: "Epic", resetCycle: "Never", starReward: 5,
    requirement: "Deal value ≥ $50,000", seasonal: false },
];

const INITIAL_RANKS: RankConfig[] = HUNTER_RANKS.map((r: RankInfo) => ({
  key: r.key, name: r.name, subtitle: r.subtitle, description: r.description,
  requirement: "Define requirement…", locked: !!r.locked,
}));

const INITIAL_LEGACY: LegacyConfig = {
  starsPerMoon: 10,
  moonsPerSun: 5,
  titles: [...LEGACY_TITLES],
};

/* =============================== Layout =============================== */

type AdminTab = "staff" | "grades" | "achievements" | "ranks" | "legacy";

const TABS: { key: AdminTab; label: string; hint: string }[] = [
  { key: "staff",        label: "Staff",        hint: "Create, edit, assign department & manager" },
  { key: "grades",       label: "Grades",       hint: "Define A/B/C/D rules and weights" },
  { key: "achievements", label: "Achievements", hint: "Define achievements & star rewards" },
  { key: "ranks",        label: "Ranks",        hint: "Configure Hunter ranks & promotion rules" },
  { key: "legacy",       label: "Legacy",       hint: "Conversion ratios & legacy titles" },
];

function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("staff");
  const active = TABS.find(t => t.key === tab)!;
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminHeader />
        <div className="mb-6 rounded-md border border-border bg-ink/40 p-4">
          <div className="font-display text-xs uppercase tracking-[0.25em] text-gold">Admin Console</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Configuration only. No analytics, no charts. Everything here defines the rules of the Guild Ledger.
          </div>
        </div>

        <nav role="tablist" className="mb-4 flex flex-wrap gap-2">
          {TABS.map(t => {
            const isActive = t.key === tab;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(t.key)}
                className={`rounded-md border px-3 py-2 text-xs font-medium uppercase tracking-widest transition ${
                  isActive ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-gold/40"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
        <div className="mb-4 text-xs italic text-muted-foreground">{active.hint}</div>

        {tab === "staff"        && <StaffModule />}
        {tab === "grades"       && <GradesModule />}
        {tab === "achievements" && <AchievementsModule />}
        {tab === "ranks"        && <RanksModule />}
        {tab === "legacy"       && <LegacyModule />}

        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          Admin Console · Configuration prototype · changes are in-memory only
        </footer>
      </div>
    </div>
  );
}

function AdminHeader() {
  return (
    <header className="mb-8 flex items-center justify-between">
      <div>
        <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">
          Guild Admin
        </div>
        <div className="text-xs text-muted-foreground">Data configuration for the Guild Ledger</div>
      </div>
      <Link
        to="/"
        className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
      >
        ← Ledger
      </Link>
    </header>
  );
}

/* =============================== Shared UI =============================== */

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

const inputCls =
  "w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none";

function Btn({
  children, onClick, variant = "primary", type = "button",
}: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger"; type?: "button" | "submit" }) {
  const styles =
    variant === "primary" ? "border-gold bg-gold/10 text-gold hover:bg-gold/20"
    : variant === "danger" ? "border-red-500/50 text-red-400 hover:bg-red-500/10"
    : "border-border text-muted-foreground hover:border-gold/40 hover:text-gold";
  return (
    <button type={type} onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-xs uppercase tracking-widest transition ${styles}`}>
      {children}
    </button>
  );
}

/* =============================== 1. Staff =============================== */

function StaffModule() {
  const [staff, setStaff] = useState<StaffRow[]>(INITIAL_STAFF);
  const [editing, setEditing] = useState<StaffRow | null>(null);

  function save(row: StaffRow) {
    setStaff(s => s.some(x => x.id === row.id) ? s.map(x => x.id === row.id ? row : x) : [...s, row]);
    setEditing(null);
  }
  function remove(id: string) {
    setStaff(s => s.filter(x => x.id !== id).map(x => x.managerId === id ? { ...x, managerId: null } : x));
  }
  function startNew() {
    setEditing({
      id: `emp-${Date.now()}`, name: "", role: "", roleFamily: "hunter",
      department: "Sales", managerId: null, email: "",
    });
  }

  return (
    <Section title="Staff Management" action={<Btn onClick={startNew}>+ New Staff</Btn>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2 pr-3">Path</th>
              <th className="py-2 pr-3">Department</th>
              <th className="py-2 pr-3">Manager</th>
              <th className="py-2 pr-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.id} className="border-b border-border/40">
                <td className="py-2 pr-3">{s.name}</td>
                <td className="py-2 pr-3 text-muted-foreground">{s.role}</td>
                <td className="py-2 pr-3 text-muted-foreground capitalize">{s.roleFamily}</td>
                <td className="py-2 pr-3 text-muted-foreground">{s.department}</td>
                <td className="py-2 pr-3 text-muted-foreground">
                  {staff.find(x => x.id === s.managerId)?.name ?? "—"}
                </td>
                <td className="py-2 pr-3 text-right">
                  <div className="inline-flex gap-2">
                    <Btn variant="ghost" onClick={() => setEditing(s)}>Edit</Btn>
                    <Btn variant="danger" onClick={() => remove(s.id)}>Delete</Btn>
                  </div>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-xs text-muted-foreground">No staff yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <StaffForm
          row={editing}
          managers={staff.filter(s => s.id !== editing.id)}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}
    </Section>
  );
}

function StaffForm({
  row, managers, onSave, onCancel,
}: { row: StaffRow; managers: StaffRow[]; onSave: (r: StaffRow) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<StaffRow>(row);
  const set = <K extends keyof StaffRow>(k: K, v: StaffRow[K]) => setDraft(d => ({ ...d, [k]: v }));
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (draft.name.trim()) onSave(draft); }}
      className="mt-5 grid gap-3 rounded-md border border-gold/30 bg-ink/50 p-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2 font-display text-xs uppercase tracking-widest text-gold">
        {row.name ? "Edit Staff" : "Create Staff"}
      </div>
      <Field label="Name"><input className={inputCls} value={draft.name} onChange={e => set("name", e.target.value)} required /></Field>
      <Field label="Email"><input type="email" className={inputCls} value={draft.email} onChange={e => set("email", e.target.value)} /></Field>
      <Field label="Role"><input className={inputCls} value={draft.role} onChange={e => set("role", e.target.value)} placeholder="e.g. Senior Ambassador" /></Field>
      <Field label="Path">
        <select className={inputCls} value={draft.roleFamily} onChange={e => set("roleFamily", e.target.value as StaffRow["roleFamily"])}>
          <option value="hunter">Hunter</option>
          <option value="operational">Operational</option>
        </select>
      </Field>
      <Field label="Department">
        <select className={inputCls} value={draft.department} onChange={e => set("department", e.target.value as Department)}>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </Field>
      <Field label="Manager">
        <select className={inputCls} value={draft.managerId ?? ""} onChange={e => set("managerId", e.target.value || null)}>
          <option value="">— None —</option>
          {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </Field>
      <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn type="submit">Save</Btn>
      </div>
    </form>
  );
}

/* =============================== 2. Grades =============================== */

function GradesModule() {
  const [rules, setRules] = useState<GradeRule[]>(INITIAL_GRADES);
  const [salesWeight, setSalesWeight] = useState<number>(60);
  const reviewWeight = 100 - salesWeight;

  function update(i: number, patch: Partial<GradeRule>) {
    setRules(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  }

  return (
    <div className="space-y-6">
      <Section title="Grade Weights">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Sales Weight — ${salesWeight}%`}>
            <input
              type="range" min={0} max={100} step={5}
              value={salesWeight} onChange={e => setSalesWeight(Number(e.target.value))}
              className="w-full accent-[var(--color-gold,gold)]"
            />
          </Field>
          <Field label={`Review Weight — ${reviewWeight}%`}>
            <div className="rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-muted-foreground">
              {reviewWeight}% (auto: 100 − sales)
            </div>
          </Field>
        </div>
        <p className="mt-3 text-[11px] italic text-muted-foreground">
          Composite Score = Sales × {salesWeight}% + Reviews × {reviewWeight}%. Grade is assigned by cutoffs below.
        </p>
      </Section>

      <Section title="Grade Rules (A / B / C / D)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3">Grade</th>
                <th className="py-2 pr-3">Label</th>
                <th className="py-2 pr-3">Min Composite Score</th>
                <th className="py-2 pr-3">Monthly Bonus %</th>
                <th className="py-2 pr-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r, i) => (
                <tr key={r.grade} className="border-b border-border/40">
                  <td className="py-2 pr-3">
                    <span className="rounded px-2 py-0.5 text-xs font-bold" style={{ color: GRADE_META[r.grade].color, borderColor: GRADE_META[r.grade].color, borderWidth: 1 }}>
                      {r.grade}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{GRADE_META[r.grade].label}</td>
                  <td className="py-2 pr-3">
                    <input type="number" min={0} max={100} className={inputCls + " w-24"} value={r.minScore}
                      onChange={e => update(i, { minScore: Number(e.target.value) })} />
                  </td>
                  <td className="py-2 pr-3">
                    <input type="number" min={0} max={100} className={inputCls + " w-24"} value={r.bonusPct}
                      onChange={e => update(i, { bonusPct: Number(e.target.value) })} />
                  </td>
                  <td className="py-2 pr-3">
                    <input className={inputCls} value={r.note} onChange={e => update(i, { note: e.target.value })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

/* =============================== 3. Achievements =============================== */

const ACH_TYPES: AchievementType[] = ["Monthly", "Season", "Annual", "One-Time", "Milestone"];
const DIFFICULTIES: Difficulty[] = ["Easy", "Standard", "Hard", "Epic", "Legendary"];
const RESETS: ResetCycle[] = ["Monthly", "Seasonal", "Yearly", "Never"];

function AchievementsModule() {
  const [items, setItems] = useState<AchievementConfig[]>(INITIAL_ACHIEVEMENTS);
  const [editing, setEditing] = useState<AchievementConfig | null>(null);

  function save(a: AchievementConfig) {
    setItems(xs => xs.some(x => x.id === a.id) ? xs.map(x => x.id === a.id ? a : x) : [...xs, a]);
    setEditing(null);
  }
  function remove(id: string) { setItems(xs => xs.filter(x => x.id !== id)); }
  function startNew() {
    setEditing({
      id: `ach-${Date.now()}`, name: "", description: "",
      type: "Monthly", difficulty: "Standard", resetCycle: "Monthly",
      starReward: 1, requirement: "", seasonal: true,
    });
  }

  return (
    <Section title="Achievement Management" action={<Btn onClick={startNew}>+ New Achievement</Btn>}>
      <div className="grid gap-3">
        {items.map(a => (
          <div key={a.id} className="rounded-md border border-border bg-ink/40 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-foreground">
                  {a.name} <span className="ml-2 text-[10px] uppercase tracking-widest text-muted-foreground">{a.difficulty}</span>
                </div>
                <div className="text-xs text-muted-foreground">{a.description}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span className="rounded border border-border px-2 py-0.5">Type: {a.type}</span>
                  <span className="rounded border border-border px-2 py-0.5">Reset: {a.resetCycle}</span>
                  <span className="rounded border border-border px-2 py-0.5 text-gold">★ {a.starReward}</span>
                  <span className="rounded border border-border px-2 py-0.5">{a.seasonal ? "Seasonal" : "Lifetime"}</span>
                </div>
                {a.requirement && <div className="mt-2 text-[11px] italic text-muted-foreground">Requirement: {a.requirement}</div>}
              </div>
              <div className="flex shrink-0 gap-2">
                <Btn variant="ghost" onClick={() => setEditing(a)}>Edit</Btn>
                <Btn variant="danger" onClick={() => remove(a.id)}>Delete</Btn>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">No achievements yet.</div>}
      </div>

      {editing && (
        <AchievementForm row={editing} onSave={save} onCancel={() => setEditing(null)} />
      )}
    </Section>
  );
}

function AchievementForm({
  row, onSave, onCancel,
}: { row: AchievementConfig; onSave: (a: AchievementConfig) => void; onCancel: () => void }) {
  const [d, setD] = useState<AchievementConfig>(row);
  const set = <K extends keyof AchievementConfig>(k: K, v: AchievementConfig[K]) => setD(x => ({ ...x, [k]: v }));
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (d.name.trim()) onSave(d); }}
      className="mt-5 grid gap-3 rounded-md border border-gold/30 bg-ink/50 p-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2 font-display text-xs uppercase tracking-widest text-gold">
        {row.name ? "Edit Achievement" : "Create Achievement"}
      </div>
      <Field label="Name"><input className={inputCls} value={d.name} onChange={e => set("name", e.target.value)} required /></Field>
      <Field label="Star Reward">
        <input type="number" min={0} max={50} className={inputCls} value={d.starReward}
          onChange={e => set("starReward", Number(e.target.value))} />
      </Field>
      <Field label="Description">
        <textarea rows={2} className={inputCls} value={d.description} onChange={e => set("description", e.target.value)} />
      </Field>
      <Field label="Requirement">
        <textarea rows={2} className={inputCls} value={d.requirement} onChange={e => set("requirement", e.target.value)} placeholder="e.g. Close 5 deals in one month" />
      </Field>
      <Field label="Type">
        <select className={inputCls} value={d.type} onChange={e => set("type", e.target.value as AchievementType)}>
          {ACH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Difficulty">
        <select className={inputCls} value={d.difficulty} onChange={e => set("difficulty", e.target.value as Difficulty)}>
          {DIFFICULTIES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Reset Cycle">
        <select className={inputCls} value={d.resetCycle} onChange={e => set("resetCycle", e.target.value as ResetCycle)}>
          {RESETS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Scope">
        <select className={inputCls} value={d.seasonal ? "seasonal" : "lifetime"}
          onChange={e => set("seasonal", e.target.value === "seasonal")}>
          <option value="seasonal">Seasonal</option>
          <option value="lifetime">Lifetime</option>
        </select>
      </Field>
      <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn type="submit">Save</Btn>
      </div>
    </form>
  );
}

/* =============================== 4. Ranks =============================== */

function RanksModule() {
  const [ranks, setRanks] = useState<RankConfig[]>(INITIAL_RANKS);

  function update(i: number, patch: Partial<RankConfig>) {
    setRanks(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  }
  function move(i: number, dir: -1 | 1) {
    setRanks(rs => {
      const j = i + dir;
      if (j < 0 || j >= rs.length) return rs;
      const next = [...rs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return (
    <Section title="Rank Management">
      <p className="mb-4 text-xs text-muted-foreground">
        Ranks are ordered from lowest to highest. Each rank defines its promotion requirement and description.
      </p>
      <div className="space-y-3">
        {ranks.map((r, i) => (
          <div key={r.key} className="rounded-md border border-border bg-ink/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-display text-xs uppercase tracking-widest text-muted-foreground">#{i + 1}</span>
                <span className="font-medium" style={{ color: HUNTER_RANKS[i]?.color }}>{r.name}</span>
                {r.locked && <span className="rounded border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">Locked</span>}
              </div>
              <div className="flex gap-1">
                <Btn variant="ghost" onClick={() => move(i, -1)}>↑</Btn>
                <Btn variant="ghost" onClick={() => move(i, 1)}>↓</Btn>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name"><input className={inputCls} value={r.name} onChange={e => update(i, { name: e.target.value })} /></Field>
              <Field label="Subtitle"><input className={inputCls} value={r.subtitle} onChange={e => update(i, { subtitle: e.target.value })} /></Field>
              <Field label="Description">
                <textarea rows={2} className={inputCls} value={r.description} onChange={e => update(i, { description: e.target.value })} />
              </Field>
              <Field label="Promotion Requirement">
                <textarea rows={2} className={inputCls} value={r.requirement} onChange={e => update(i, { requirement: e.target.value })} placeholder="e.g. 12 A-grades + Black Diamond mentor signoff" />
              </Field>
              <Field label="Status">
                <select className={inputCls} value={r.locked ? "locked" : "open"} onChange={e => update(i, { locked: e.target.value === "locked" })}>
                  <option value="open">Open</option>
                  <option value="locked">Locked</option>
                </select>
              </Field>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* =============================== 5. Legacy =============================== */

function LegacyModule() {
  const [cfg, setCfg] = useState<LegacyConfig>(INITIAL_LEGACY);
  const starsPerSun = useMemo(() => cfg.starsPerMoon * cfg.moonsPerSun, [cfg]);

  function patch(p: Partial<LegacyConfig>) { setCfg(c => ({ ...c, ...p })); }
  function updateTitle(i: number, t: Partial<LegacyTitle>) {
    setCfg(c => ({ ...c, titles: c.titles.map((x, idx) => idx === i ? { ...x, ...t } : x) }));
  }
  function addTitle() {
    setCfg(c => ({ ...c, titles: [...c.titles, { name: "New Title", minStars: 0, flavor: "" }] }));
  }
  function removeTitle(i: number) {
    setCfg(c => ({ ...c, titles: c.titles.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="space-y-6">
      <Section title="Conversion Ratios">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Stars → Moon">
            <input type="number" min={1} className={inputCls} value={cfg.starsPerMoon}
              onChange={e => patch({ starsPerMoon: Math.max(1, Number(e.target.value)) })} />
          </Field>
          <Field label="Moons → Sun">
            <input type="number" min={1} className={inputCls} value={cfg.moonsPerSun}
              onChange={e => patch({ moonsPerSun: Math.max(1, Number(e.target.value)) })} />
          </Field>
          <Field label="Stars per Sun (computed)">
            <div className="rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-gold">
              {starsPerSun} ★
            </div>
          </Field>
        </div>
        <p className="mt-3 text-[11px] italic text-muted-foreground">
          Current rule: {cfg.starsPerMoon} ★ = 1 🌙 · {cfg.moonsPerSun} 🌙 = 1 ☀ · so 1 ☀ = {starsPerSun} ★.
        </p>
      </Section>

      <Section title="Legacy Titles" action={<Btn onClick={addTitle}>+ New Title</Btn>}>
        <div className="space-y-2">
          {cfg.titles.map((t, i) => (
            <div key={i} className="grid items-end gap-2 rounded-md border border-border bg-ink/40 p-3 sm:grid-cols-[1fr_120px_2fr_auto]">
              <Field label="Title">
                <input className={inputCls} value={t.name} onChange={e => updateTitle(i, { name: e.target.value })} />
              </Field>
              <Field label="Min ★">
                <input type="number" min={0} className={inputCls} value={t.minStars}
                  onChange={e => updateTitle(i, { minStars: Number(e.target.value) })} />
              </Field>
              <Field label="Flavor">
                <input className={inputCls} value={t.flavor} onChange={e => updateTitle(i, { flavor: e.target.value })} />
              </Field>
              <Btn variant="danger" onClick={() => removeTitle(i)}>Remove</Btn>
            </div>
          ))}
          {cfg.titles.length === 0 && (
            <div className="py-6 text-center text-xs text-muted-foreground">No titles defined.</div>
          )}
        </div>
      </Section>
    </div>
  );
}
