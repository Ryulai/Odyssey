import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRole, ROLE_META, can, useAuth } from "@/lib/roles";
import { AuthGate } from "@/components/auth-gate";
import { getStaffDashboard } from "@/lib/workflow.functions";

import {
  SAMPLE_EMPLOYEE,
  SAMPLE_OPERATIONAL_EMPLOYEE,
  GRADE_META,
  HUNTER_RANKS,
  OPERATIONAL_RANKS,
  PARTNER_PATH,
  computeLegacy,
  totalStars,
  type Grade,
  type RankKey,
  type CareerTreeNode,
  type Quest,
  type Attribute,
  type RepeatableAchievement,
  type RankProgress,
  type Employee,
  type OperationalEmployee,
  type OpRankKey,
  type OpSkillNode,
  type Certification,
  type TrainingLevel,
  type CareerMilestone,
} from "@/lib/employee-data";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Odyssey Guide — Chart Your Journey. Forge Your Legacy." },
      { name: "description", content: "A voyage of growth. Navigators chart achievements and legacy stars; Shipbuilders master ranks, skills, certifications, and training. Two routes across the same sea." },
      { property: "og:title", content: "The Odyssey Guide — Chart Your Journey. Forge Your Legacy." },
      { property: "og:description", content: "A maritime growth journey: Navigator Achievement Economy and Shipbuilder Professional Development, sailing side by side." },
    ],
  }),
  component: () => <AuthGate><Dashboard /></AuthGate>,
});

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "me", "home"],
    queryFn: () => getStaffDashboard({ data: {} }),
  });

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <HunterHeader />
        {isLoading ? (
          <div className="rounded-md border border-border bg-ink/30 p-12 text-center text-xs uppercase tracking-widest text-muted-foreground">
            Charting your course…
          </div>
        ) : !data?.staff ? (
          <OnboardingCard />
        ) : (
          <LinkedHome d={data} />
        )}
        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          The Odyssey Guide · Chart Your Journey. Forge Your Legacy.
        </footer>
      </div>
    </div>
  );
}

function OnboardingCard() {
  const { user } = useAuth();
  return (
    <section className="rounded-md border border-gold/40 bg-ink/40 p-8 text-center">
      <div className="font-display text-xs uppercase tracking-[0.25em] text-gold">Welcome Aboard</div>
      <h1 className="mt-2 font-display text-2xl text-foreground">Your account hasn't been added to the ship's manifest yet</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
        Signed in as <span className="text-foreground">{user?.email}</span>. A Director needs to add you to the crew manifest
        with this exact email — once logged, your profile, rank, stars and legacy will chart themselves here automatically.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link to="/admin" className="rounded-md border border-gold bg-gold/10 px-3 py-2 font-display text-[10px] uppercase tracking-widest text-gold hover:bg-gold/20">
          Open Admin → Staff
        </Link>
      </div>
    </section>
  );
}

function LinkedHome({ d }: { d: any }) {
  const { role } = useRole();
  const s = d.staff;
  const isHunter = (s.role_family ?? "hunter") === "hunter";
  const isShipbuilder = role === "director";
  const totals = d.totals ?? { stars: 0, moons: 0, suns: 0 };
  const latestGrade = d.grades?.[0]?.grade ?? "—";
  const rankName = s.rank?.name ?? d.evaluation?.current_rank_name ?? "Unranked";
  const rankSub  = s.rank?.subtitle ?? "";
  const rankColor = isShipbuilder ? "var(--color-gold)" : (s.rank?.color ?? "var(--color-gold)");
  const gradeMeta = GRADE_META[latestGrade as Grade] ?? null;
  const initials = (s.name ?? "")
    .split(/\s+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("") || "—";
  const legacyTitle = isShipbuilder ? "The Shipbuilder" : (d.legacy?.currentTitle?.name ?? "Wanderer");

  return (
    <>
      <section className="card-ornate-gold relative overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            <div
              className="grid h-20 w-20 shrink-0 place-items-center rounded-full font-display text-2xl font-bold"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${rankColor}, oklch(0.2 0.03 250))`,
                color: "oklch(0.15 0.03 250)",
                boxShadow: `0 0 0 2px ${rankColor}, 0 0 24px -4px ${rankColor}`,
              }}
            >
              {isShipbuilder ? "⚓" : initials}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-gold">{legacyTitle}</div>
              <h1 className="font-display text-2xl text-foreground sm:text-3xl">{s.name}</h1>
              <p className="text-sm text-muted-foreground">{s.role} · {s.department ?? "—"} · {isShipbuilder ? "System Builder" : (isHunter ? "Hunter Path" : "Operational Path")}</p>
              {!isShipbuilder ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Manager: <span className="text-foreground">{s.manager?.name ?? "Unassigned"}</span>
                </p>
              ) : (
                <p className="mt-1 text-xs italic text-gold/80">Charts the course. Builds the ship. Beyond rank.</p>
              )}
            </div>
          </div>

          <div className="grid flex-1 grid-cols-3 gap-3 sm:gap-4">
            {isShipbuilder ? (
              <>
                <MiniStat label="Fleet Built" value="—" sub="Systems forged" color="var(--color-gold)" />
                <MiniStat label="Voyagers Guided" value="—" sub="Crew elevated" color="var(--color-gold)" />
                <MiniStat label="Legacy Created" value="Beyond Rank" sub="Shipbuilder" color="var(--color-gold)" />
              </>
            ) : (
              <>
                <MiniStat label="Rank" value={rankName.replace(" Hunter", "")} sub={rankSub} color={rankColor} />
                <MiniStat label="This Month" value={`Grade ${latestGrade}`} sub={gradeMeta?.label ?? "no review yet"} color={gradeMeta?.color ?? "var(--color-muted-foreground)"} />
                {isHunter
                  ? <MiniStat label="Legacy" value={`${totals.stars}★`} sub={`${totals.moons}🌙 · ${totals.suns}☀️`} color="var(--color-gold)" />
                  : <MiniStat label="Discipline" value={s.role} sub={(s.department ?? "").split("·")[0].trim() || "—"} color="var(--color-gold)" />
                }
              </>
            )}
          </div>
        </div>
      </section>


      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/profile" className="rounded-md border border-gold bg-gold/10 px-4 py-2 font-display text-[10px] uppercase tracking-widest text-gold hover:bg-gold/20">
          Open My Profile →
        </Link>
        <Link to="/claims" className="rounded-md border border-border px-4 py-2 font-display text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">
          Submit a Claim
        </Link>
      </div>

      <div className="mt-6">
        <GrowthTrees />
      </div>
    </>
  );
}

function MiniStat({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-md border border-border bg-ink/50 p-3 text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg leading-tight" style={{ color }}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}


/* ----------------------------- Header ----------------------------- */

function HunterHeader() {
  const { role } = useRole();
  const { user, signOut } = useAuth();
  const navLink = "rounded-md border border-border px-3 py-2 font-display text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold";
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <CrestIcon />
        <div>
          <div className="font-display text-lg font-semibold tracking-widest text-gold uppercase">
            The Odyssey Guide
          </div>
          <div className="text-xs text-muted-foreground">Chart Your Journey. Forge Your Legacy.</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/profile" className={navLink}>My Profile</Link>
        <Link to="/claims" className={navLink}>Claims</Link>
        {can(role, "team.recommendPromotion") && <Link to="/promotions" className={navLink}>Promotions</Link>}
        {can(role, "evaluations.write") && <Link to="/evaluations" className={navLink}>Evaluations</Link>}
        {can(role, "admin.access") && (
          <Link to="/admin" className="rounded-md border border-gold/50 bg-gold/10 px-3 py-2 font-display text-[10px] uppercase tracking-widest text-gold hover:bg-gold/20">
            Admin
          </Link>
        )}
        <div className="flex flex-col items-end pl-2">
          <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">{user?.email}</span>
          <span className="font-display text-[10px] uppercase tracking-widest text-gold">{ROLE_META[role].label}</span>
        </div>
        <button onClick={signOut} className={navLink}>Sign out</button>
      </div>
    </header>
  );
}


function CrestIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden="true">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.85 0.16 85)" />
          <stop offset="100%" stopColor="oklch(0.55 0.13 70)" />
        </linearGradient>
      </defs>
      <path
        d="M24 3 L42 11 V25 C42 35 34 42 24 45 C14 42 6 35 6 25 V11 Z"
        fill="url(#g)"
        stroke="oklch(0.3 0.05 80)"
        strokeWidth="1.5"
      />
      <path d="M16 18 L24 30 L32 18 M19 14 L29 14" stroke="oklch(0.2 0.04 80)" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ----------------------------- Profile ----------------------------- */

function ProfileCard({ emp, legacy }: { emp: Employee; legacy: ReturnType<typeof computeLegacy> }) {
  const rank = HUNTER_RANKS.find(r => r.key === emp.currentRank)!;
  const grade = GRADE_META[emp.currentGrade];
  const years = Math.max(1, new Date().getFullYear() - new Date(emp.joinedOn).getFullYear());

  return (
    <section className="card-ornate-gold relative overflow-hidden p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-5">
          <div
            className="grid h-20 w-20 shrink-0 place-items-center rounded-full font-display text-2xl font-bold"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${rank.color}, oklch(0.2 0.03 250))`,
              color: "oklch(0.15 0.03 250)",
              boxShadow: `0 0 0 2px ${rank.color}, 0 0 24px -4px ${rank.color}`,
            }}
          >
            {emp.avatar}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-gold">{legacy.title.name}</div>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">{emp.name}</h1>
            <p className="text-sm text-muted-foreground">{emp.guildTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">Sworn to the fleet for {years} year{years > 1 ? "s" : ""}</p>
            <div className="mt-2 flex items-center gap-2 text-lg leading-none" aria-label={`Legacy: ${legacy.suns} suns, ${legacy.moons} moons, ${legacy.stars} stars`}>
              <LegacyGlyphs suns={legacy.suns} moons={legacy.moons} stars={legacy.stars} compact />
            </div>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-3 gap-3 sm:gap-4">
          <Stat label="Rank" value={rank.name.replace(" Hunter", "")} sub={rank.subtitle} color={rank.color} />
          <Stat label="This Month" value={`Grade ${emp.currentGrade}`} sub={grade.label} color={grade.color} />
          <Stat label="Legacy" value={`${legacy.total}★`} sub="lifetime stars" color="var(--color-gold)" />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-md border border-border bg-ink/50 p-3 text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg leading-tight" style={{ color }}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

/* ----------------------------- Tabs ----------------------------- */

function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { key: T; label: string }[]; value: T; onChange: (k: T) => void }) {
  return (
    <nav className="mt-6 flex flex-wrap gap-1 border-b border-border" role="tablist">
      {tabs.map(t => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              active ? "text-gold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {active && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 bg-gold" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

/* ----------------------------- Current Grade ----------------------------- */

function CurrentGradeCard({ current }: { current: Grade }) {
  const meta = GRADE_META[current];
  return (
    <section className="card-ornate p-6">
      <SectionHeader
        eyebrow="This Month's Wind"
        title="Monthly Grade"
        hint="Resets every month. Affects bonuses and seasonal rewards only. Does not change rank."
      />
      <div className="mt-5 flex items-center gap-5 rounded-md border p-5"
        style={{
          borderColor: meta.color,
          background: `linear-gradient(180deg, color-mix(in oklch, ${meta.color} 18%, transparent), transparent)`,
          boxShadow: `0 0 30px -10px ${meta.color}`,
        }}
      >
        <div className="font-display text-7xl leading-none" style={{ color: meta.color }}>{current}</div>
        <div>
          <div className="font-display text-xl" style={{ color: meta.color }}>{meta.label}</div>
          <div className="text-sm text-muted-foreground">{meta.tagline}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {(["A","B","C","D"] as Grade[]).map(g => {
          const m = GRADE_META[g];
          const on = g === current;
          return (
            <div key={g} className={`rounded border px-2 py-1.5 text-center text-[11px] ${on ? "" : "opacity-50"}`}
              style={{ borderColor: on ? m.color : "var(--color-border)" }}
            >
              <div className="font-display text-sm" style={{ color: m.color }}>{g}</div>
              <div className="text-muted-foreground">{m.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ----------------------------- ABCD Panel (12mo history) ----------------------------- */

function ABCDPanel({ current, history }: { current: Grade; history: { month: string; grade: Grade }[] }) {
  void current;
  return (
    <section className="card-ornate p-6">
      <SectionHeader
        eyebrow="Voyage Log"
        title="Last 12 Months · Grade History"
        hint="A record of consistency. Each month stands on its own."
      />
      <div className="mt-5">
        <div className="flex items-end gap-1.5 sm:gap-2">
          {history.map(h => {
            const meta = GRADE_META[h.grade];
            const heights: Record<Grade, string> = { A: "h-24", B: "h-20", C: "h-12", D: "h-6" };
            return (
              <div key={h.month} className="flex flex-1 flex-col items-center gap-1">
                <div className={`w-full rounded-sm ${heights[h.grade]}`} style={{ background: meta.color, opacity: 0.85 }} />
                <div className="text-[9px] text-muted-foreground">{h.month.slice(5)}</div>
                <div className="font-display text-[11px]" style={{ color: meta.color }}>{h.grade}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["A","B","C","D"] as Grade[]).map(g => {
          const count = history.filter(h => h.grade === g).length;
          const m = GRADE_META[g];
          return (
            <div key={g} className="rounded border border-border bg-ink/40 px-3 py-2">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-base" style={{ color: m.color }}>{g}</span>
                <span className="font-display text-sm">×{count}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">{m.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ----------------------------- Rank Ladder ----------------------------- */

function RankLadder({ current }: { current: RankKey }) {
  const currentIdx = HUNTER_RANKS.findIndex(r => r.key === current);
  return (
    <section className="card-ornate p-6">
      <SectionHeader eyebrow="Permanent Certification" title="Hunter Rank" hint="Rank never decreases. It is a record of proven capability — not a score." />
      <ol className="mt-5 space-y-2">
        {HUNTER_RANKS.map((r, i) => {
          const achieved = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <li
              key={r.key}
              className={`flex items-center gap-3 rounded-md border p-3 transition-all ${
                isCurrent ? "border-gold" : "border-border"
              } ${r.locked && !achieved ? "opacity-50" : ""}`}
              style={isCurrent ? { boxShadow: `0 0 20px -8px ${r.color}` } : undefined}
            >
              <RankPip color={r.color} achieved={achieved} locked={!!r.locked && !achieved} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-display text-sm" style={{ color: achieved ? r.color : undefined }}>
                    {r.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{r.subtitle}</span>
                  {isCurrent && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">You are here</span>}
                  {r.locked && !achieved && <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Sealed</span>}
                </div>
                <div className="text-xs text-muted-foreground">{r.description}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function RankPip({ color, achieved, locked }: { color: string; achieved: boolean; locked: boolean }) {
  return (
    <div
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border"
      style={{
        borderColor: achieved ? color : "var(--color-border)",
        background: achieved ? `radial-gradient(circle at 30% 30%, ${color}, transparent 70%)` : "transparent",
      }}
    >
      {locked ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      ) : achieved ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="oklch(0.15 0.03 250)" strokeWidth="3">
          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </div>
  );
}

/* ----------------------------- Partner Path ----------------------------- */

function PartnerPath({ currentKey, expanded }: { currentKey: string; expanded?: boolean }) {
  const currentIdx = PARTNER_PATH.findIndex(p => p.key === currentKey);
  return (
    <section className="card-ornate p-6">
      <SectionHeader
        eyebrow="The Long Journey"
        title="Partner Tree"
        hint="Ownership mindset and leadership. A path entirely separate from rank or grade."
      />

      <div className="mt-5 space-y-3">
        {PARTNER_PATH.map((node, i) => {
          const reached = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={node.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`grid h-9 w-9 place-items-center rounded-md border font-display text-sm ${
                    isCurrent ? "border-gold bg-gold text-primary-foreground"
                    : reached ? "border-gold/60 text-gold"
                    : "border-border text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                {i < PARTNER_PATH.length - 1 && (
                  <div className={`mt-1 w-px flex-1 ${reached && i < currentIdx ? "bg-gold/60" : "bg-border"}`} style={{ minHeight: 28 }} />
                )}
              </div>
              <div className="flex-1 pb-3">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className={`font-display text-base ${isCurrent ? "text-gold" : reached ? "text-foreground" : "text-muted-foreground"}`}>
                    {node.name}
                  </span>
                  {isCurrent && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">Current Stage</span>}
                  {!reached && <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Sealed</span>}
                </div>
                <p className="text-xs text-muted-foreground">{node.blurb}</p>
                {(expanded || isCurrent) && (
                  <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                    {node.requirements.map((req, j) => (
                      <li key={j} className="flex gap-1.5">
                        <span className="text-gold">◆</span><span>{req}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ----------------------------- Career Tree ----------------------------- */

const BRANCH_META: Record<CareerTreeNode["branch"], { label: string; icon: string; tint: string }> = {
  combat:   { label: "Combat",   icon: "⚔",  tint: "oklch(0.65 0.22 25)" },
  strategy: { label: "Strategy", icon: "♟",  tint: "oklch(0.7 0.18 240)" },
  craft:    { label: "Craft",    icon: "⚒",  tint: "oklch(0.75 0.15 78)" },
  lore:     { label: "Lore",     icon: "✦",  tint: "oklch(0.7 0.2 300)" },
};

function CareerTree({ nodes }: { nodes: CareerTreeNode[] }) {
  const branches = useMemo(() => {
    const out: Record<string, CareerTreeNode[]> = {};
    for (const n of nodes) (out[n.branch] ||= []).push(n);
    for (const k of Object.keys(out)) out[k].sort((a, b) => a.tier - b.tier);
    return out;
  }, [nodes]);

  return (
    <section className="card-ornate p-6">
      <SectionHeader
        eyebrow="What can I do?"
        title="Career Tree"
        hint="Capability, experience, and proven skills. Four branches, four tiers each."
      />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(branches) as CareerTreeNode["branch"][]).map(b => (
          <div key={b} className="rounded-md border border-border bg-ink/40 p-3">
            <div className="mb-3 flex items-center gap-2">
              <span className="font-display text-lg" style={{ color: BRANCH_META[b].tint }}>{BRANCH_META[b].icon}</span>
              <span className="font-display text-sm uppercase tracking-widest" style={{ color: BRANCH_META[b].tint }}>
                {BRANCH_META[b].label}
              </span>
            </div>
            <ol className="space-y-2">
              {branches[b].map((node, i) => (
                <li key={node.id}>
                  <SkillNode node={node} tint={BRANCH_META[b].tint} />
                  {i < branches[b].length - 1 && (
                    <div className="ml-4 h-3 w-px bg-border" />
                  )}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <Legend />
    </section>
  );
}

function SkillNode({ node, tint }: { node: CareerTreeNode; tint: string }) {
  const styleByStatus = {
    mastered:  { border: tint, bg: `color-mix(in oklch, ${tint} 14%, transparent)`, text: "text-foreground", icon: "✓" },
    active:    { border: "var(--color-gold)", bg: "color-mix(in oklch, var(--color-gold) 14%, transparent)", text: "text-gold", icon: "◐" },
    available: { border: "var(--color-border)", bg: "transparent", text: "text-foreground", icon: "○" },
    locked:    { border: "var(--color-border)", bg: "transparent", text: "text-muted-foreground", icon: "🔒" },
  }[node.status];

  return (
    <div className={`rounded-md border p-2.5 ${node.status === "locked" ? "opacity-55" : ""}`}
      style={{ borderColor: styleByStatus.border, background: styleByStatus.bg }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className={`font-display text-sm ${styleByStatus.text}`}>{node.label}</span>
        <span className="text-xs opacity-70">{styleByStatus.icon}</span>
      </div>
      <div className="text-[11px] text-muted-foreground">Tier {node.tier} · {node.desc}</div>
    </div>
  );
}

function Legend() {
  const items: { label: string; mark: string; cls: string }[] = [
    { label: "Mastered",  mark: "✓", cls: "text-foreground" },
    { label: "In Progress", mark: "◐", cls: "text-gold" },
    { label: "Available", mark: "○", cls: "text-foreground" },
    { label: "Locked",    mark: "🔒", cls: "text-muted-foreground" },
  ];
  return (
    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
      {items.map(i => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className={i.cls}>{i.mark}</span>{i.label}
        </span>
      ))}
    </div>
  );
}

/* ----------------------------- Reviews ----------------------------- */

function ReviewsPanel({ reviews }: { reviews: typeof SAMPLE_EMPLOYEE.reviews }) {
  return (
    <section className="card-ornate p-6">
      <SectionHeader eyebrow="Captain's Log" title="Monthly Reviews" hint="Each month, your captain logs the voyage." />
      <div className="mt-5 space-y-4">
        {reviews.map(r => {
          const meta = GRADE_META[r.grade];
          return (
            <article key={r.month} className="rounded-md border border-border bg-ink/40 p-4">
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
                <div>
                  <div className="font-display text-base">{formatMonth(r.month)}</div>
                  <div className="text-xs text-muted-foreground">Reviewed by {r.reviewer}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-3xl leading-none" style={{ color: meta.color }}>{r.grade}</span>
                  <div className="text-right">
                    <div className="font-display text-xs" style={{ color: meta.color }}>{meta.label}</div>
                    <div className="text-[11px] text-muted-foreground">{meta.tagline}</div>
                  </div>
                </div>
              </header>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <ReviewList title="Tailwinds" items={r.highlights} tone="positive" />
                <ReviewList title="Headwinds" items={r.improvements} tone="negative" />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ReviewList({ title, items, tone }: { title: string; items: string[]; tone: "positive" | "negative" }) {
  const color = tone === "positive" ? "var(--color-grade-a)" : "var(--color-grade-d)";
  return (
    <div>
      <div className="mb-1.5 font-display text-xs uppercase tracking-widest" style={{ color }}>{title}</div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-foreground">
            <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatMonth(s: string) {
  const [y, m] = s.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
}

/* ----------------------------- Shared ----------------------------- */

function SectionHeader({ eyebrow, title, hint }: { eyebrow: string; title: string; hint?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-gold">{eyebrow}</div>
      <h2 className="mt-1 font-display text-xl">{title}</h2>
      {hint && <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ----------------------------- Quest Board ----------------------------- */

function QuestBoard({ quests }: { quests: Quest[] }) {
  return (
    <section className="card-ornate p-6">
      <SectionHeader
        eyebrow="The Quest Board"
        title="Active Monthly Quests"
        hint="Complete these contracts before the moon turns to claim your rewards."
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {quests.map(q => <QuestCard key={q.id} quest={q} />)}
      </div>
    </section>
  );
}

function QuestCard({ quest }: { quest: Quest }) {
  const pct = Math.min(100, Math.round((quest.current / quest.target) * 100));
  const complete = pct >= 100;
  const color = complete ? "var(--color-grade-a)" : "var(--color-gold)";
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n);
  return (
    <div className="rounded-md border border-border bg-ink/40 p-4 transition-all hover:border-gold/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-gold/30 bg-ink text-lg">
            {quest.icon}
          </div>
          <div className="min-w-0">
            <div className="font-display text-sm">{quest.name}</div>
            <div className="text-[11px] italic text-muted-foreground">{quest.flavor}</div>
          </div>
        </div>
        {complete && (
          <span className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest" style={{ color: "var(--color-grade-a)", background: "color-mix(in oklch, var(--color-grade-a) 15%, transparent)" }}>
            Cleared
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between text-xs">
        <span className="font-display" style={{ color }}>
          {fmt(quest.current)} <span className="text-muted-foreground">/ {fmt(quest.target)} {quest.unit}</span>
        </span>
        <span className="text-muted-foreground">{pct}%</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full border border-border bg-ink">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, color-mix(in oklch, ${color} 60%, transparent), ${color})`,
            boxShadow: `0 0 12px -2px ${color}`,
          }}
        />
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">
        <span className="text-gold">Reward:</span> {quest.reward}
      </div>
    </div>
  );
}

/* ----------------------------- Next Rank Progress ----------------------------- */

function NextRankProgress({ current, progress }: { current: RankKey; progress: RankProgress }) {
  const curRank = HUNTER_RANKS.find(r => r.key === current)!;
  const nextRank = HUNTER_RANKS.find(r => r.key === progress.nextRank)!;
  const pct = Math.min(100, Math.round((progress.current / progress.needed) * 100));

  return (
    <section className="card-ornate p-6">
      <SectionHeader eyebrow="Ascension Trial" title="Path to Next Rank" hint="Rank only moves upward. The trial is permanent once cleared." />

      <div className="mt-5 flex items-center justify-between gap-4">
        <RankSigil rank={curRank} size={56} />
        <div className="flex-1 text-center">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Trial of</div>
          <div className="font-display text-base text-gold">{nextRank.name}</div>
          <div className="text-[11px] italic text-muted-foreground">{nextRank.subtitle}</div>
        </div>
        <RankSigil rank={nextRank} size={56} dim />
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-display text-sm" style={{ color: nextRank.color }}>
            {progress.current} <span className="text-muted-foreground">/ {progress.needed} {progress.metric}</span>
          </span>
          <span className="text-muted-foreground">{pct}%</span>
        </div>
        <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full border border-border bg-ink">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${curRank.color}, ${nextRank.color})`,
              boxShadow: `0 0 16px -2px ${nextRank.color}`,
            }}
          />
        </div>
      </div>

      <ul className="mt-5 space-y-1.5 text-xs text-muted-foreground">
        {progress.notes.map((n, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-gold">◆</span>
            <span>{n}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RankSigil({ rank, size, dim }: { rank: typeof HUNTER_RANKS[number]; size: number; dim?: boolean }) {
  return (
    <div className="text-center">
      <div
        className="mx-auto grid place-items-center rounded-full border-2"
        style={{
          width: size,
          height: size,
          borderColor: rank.color,
          background: `radial-gradient(circle at 30% 30%, ${rank.color}, oklch(0.18 0.03 250))`,
          boxShadow: dim ? "none" : `0 0 20px -4px ${rank.color}`,
          opacity: dim ? 0.55 : 1,
          filter: dim ? "grayscale(0.3)" : undefined,
        }}
      >
        <span className="font-display text-base" style={{ color: "oklch(0.15 0.03 250)" }}>
          {rank.name.charAt(0)}
        </span>
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-widest" style={{ color: rank.color, opacity: dim ? 0.7 : 1 }}>
        {rank.name.replace(" Hunter", "").replace("Black ", "")}
      </div>
    </div>
  );
}

/* ----------------------------- Hunter Attributes ----------------------------- */

function HunterAttributes({ attributes }: { attributes: Attribute[] }) {
  return (
    <section className="card-ornate p-6">
      <SectionHeader
        eyebrow="Character Attributes"
        title="Hunter Influence"
        hint="The five powers that shape a hunter's reach."
      />
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {attributes.map(a => (
          <li key={a.key} className="flex items-center gap-3 rounded-md border border-border bg-ink/40 p-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-gold/30 bg-ink text-lg">
              {a.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-sm">{a.label}</span>
                <StarRow n={a.stars} />
              </div>
              <div className="text-[11px] italic text-muted-foreground">{a.flavor}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StarRow({ n }: { n: number }) {
  return (
    <span aria-label={`${n} of 5`} className="text-base leading-none tracking-tight text-gold">
      {"★".repeat(n)}<span className="opacity-25">{"★".repeat(5 - n)}</span>
    </span>
  );
}

/* ----------------------------- Achievements Ledger (repeatable) ----------------------------- */

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy:      "oklch(0.78 0.12 150)",
  Standard:  "oklch(0.78 0.02 250)",
  Hard:      "oklch(0.72 0.16 230)",
  Epic:      "oklch(0.7 0.2 300)",
  Legendary: "oklch(0.82 0.16 78)",
};

function AchievementsLedger({ items }: { items: RepeatableAchievement[] }) {
  const totalEarnedStars = items.reduce((s, a) => s + a.history.reduce((x, h) => x + h.stars, 0), 0);
  const totalEarned = items.reduce((s, a) => s + a.history.length, 0);
  const mostEarned = items.slice().sort((a, b) => b.history.length - a.history.length)[0];

  const groups: { key: string; label: string; tint: string; blurb: string; items: RepeatableAchievement[] }[] = [
    { key: "Monthly",  label: "Monthly",  tint: "oklch(0.78 0.12 150)", blurb: "Reset every month.",       items: items.filter(a => a.type === "Monthly") },
    { key: "Season",   label: "Seasonal", tint: "oklch(0.72 0.16 230)", blurb: "Reset every quarter.",     items: items.filter(a => a.type === "Season") },
    { key: "Annual",   label: "Annual",   tint: "oklch(0.82 0.16 78)",  blurb: "Once per year.",           items: items.filter(a => a.type === "Annual") },
    { key: "Other",    label: "Other",    tint: "oklch(0.7 0.2 300)",   blurb: "One-time or milestone.",    items: items.filter(a => !["Monthly","Season","Annual"].includes(a.type)) },
  ].filter(g => g.items.length > 0);

  return (
    <div className="space-y-6">
      <section className="card-ornate p-6">
        <SectionHeader
          eyebrow="Hall of Records"
          title="Achievement Collection"
          hint="Achievements are repeatable. Earning the same achievement again adds another star to your legacy."
        />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat2 label="Stars Generated"      value={`${totalEarnedStars}⭐`} />
          <Stat2 label="Total Times Earned"   value={String(totalEarned)} />
          <Stat2 label="Unique Achievements"  value={`${items.filter(a=>a.history.length>0).length} / ${items.length}`} />
          <Stat2 label="Most Frequent"        value={mostEarned && mostEarned.history.length > 0 ? `${mostEarned.name} ×${mostEarned.history.length}` : "—"} />
        </div>
      </section>

      {groups.map(g => (
        <section key={g.key} className="card-ornate p-6">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: g.tint }}>{g.label} Achievements</div>
              <h2 className="mt-1 font-display text-lg">{g.label}</h2>
            </div>
            <span className="text-xs italic text-muted-foreground">{g.blurb}</span>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {g.items.map(a => <AchievementRow key={a.id} a={a} groupTint={g.tint} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function AchievementRow({ a, groupTint }: { a: RepeatableAchievement; groupTint: string }) {
  const stars = a.history.reduce((s, h) => s + h.stars, 0);
  const times = a.history.length;
  const last = a.history[a.history.length - 1];
  const diffColor = DIFFICULTY_COLOR[a.difficulty] ?? "var(--color-gold)";
  const everEarned = times > 0;

  return (
    <div className="rounded-md border border-border bg-ink/40 p-4">
      <div className="flex items-start gap-3">
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-md border text-xl"
          style={{
            borderColor: everEarned ? diffColor : "var(--color-border)",
            background: everEarned
              ? `radial-gradient(circle at 30% 30%, color-mix(in oklch, ${diffColor} 35%, transparent), oklch(0.2 0.03 250))`
              : "oklch(0.22 0.02 250)",
            boxShadow: everEarned ? `0 0 14px -6px ${diffColor}` : undefined,
            filter: everEarned ? undefined : "grayscale(0.6)",
          }}
        >
          {a.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-display text-sm">
              {a.name} <span className="text-gold">×{times}</span>
            </span>
            <span className="font-display text-sm text-gold">{stars}⭐</span>
          </div>
          <div className="text-[11px] text-muted-foreground">{a.description}</div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] uppercase tracking-widest">
            <Chip color={groupTint}>{a.type}</Chip>
            <Chip color={diffColor}>{a.difficulty}</Chip>
            <Chip>{a.repeatable ? "Repeatable" : "One-Time"}</Chip>
            <Chip>{a.rewardText}</Chip>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 text-[11px] text-muted-foreground">
            <span>Last earned: <span className="text-foreground">{last ? last.period : "never"}</span></span>
            {last && <span>{last.date}</span>}
          </div>
        </div>
      </div>

      {everEarned && (
        <details className="mt-3 text-[11px]">
          <summary className="cursor-pointer text-muted-foreground hover:text-gold">View history ({times})</summary>
          <ol className="mt-2 space-y-1">
            {a.history.slice().reverse().map((h, i) => (
              <li key={i} className="flex items-center justify-between rounded border border-border/70 bg-ink/60 px-2 py-1">
                <span className="text-foreground">{h.period}</span>
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground">{h.date}</span>
                  <span className="text-gold">{"⭐".repeat(h.stars)}</span>
                </span>
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="rounded-full border px-1.5 py-0.5"
      style={{
        borderColor: color ?? "var(--color-border)",
        color: color ?? "var(--color-muted-foreground)",
      }}
    >
      {children}
    </span>
  );
}

function Stat2({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border/70 bg-ink/60 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-sm">{value}</div>
    </div>
  );
}

/* ----------------------------- Legacy ----------------------------- */

function LegacyGlyphs({ suns, moons, stars, compact }: { suns: number; moons: number; stars: number; compact?: boolean }) {
  const size = compact ? "text-base" : "text-3xl";
  return (
    <span className={`inline-flex items-center gap-3 ${size}`}>
      {suns > 0 && (
        <span className="inline-flex items-baseline gap-1" title={`${suns} sun${suns > 1 ? "s" : ""}`}>
          <span style={{ color: "oklch(0.86 0.16 78)" }}>☀</span>
          <span className="font-display text-sm text-foreground">×{suns}</span>
        </span>
      )}
      {moons > 0 && (
        <span className="inline-flex items-baseline gap-1" title={`${moons} moon${moons > 1 ? "s" : ""}`}>
          <span style={{ color: "oklch(0.85 0.05 250)" }}>🌙</span>
          <span className="font-display text-sm text-foreground">×{moons}</span>
        </span>
      )}
      {stars > 0 && (
        <span className="inline-flex items-baseline gap-1 text-gold" title={`${stars} star${stars > 1 ? "s" : ""}`}>
          <span>⭐</span>
          <span className="font-display text-sm text-foreground">×{stars}</span>
        </span>
      )}
      {suns + moons + stars === 0 && <span className="text-xs text-muted-foreground">No legacy yet</span>}
    </span>
  );
}

function LegacyBanner({ legacy }: { legacy: ReturnType<typeof computeLegacy> }) {
  const toNext = legacy.next ? legacy.next.minStars - legacy.total : 0;
  return (
    <section className="card-ornate-gold p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-gold">Lifetime Legacy</div>
          <div className="mt-1 font-display text-2xl">{legacy.title.name}</div>
          <div className="text-xs italic text-muted-foreground">{legacy.title.flavor}</div>
        </div>
        <div className="text-right">
          <LegacyGlyphs suns={legacy.suns} moons={legacy.moons} stars={legacy.stars} />
          <div className="mt-1 text-xs text-muted-foreground">
            Lifetime Stars: <span className="font-display text-foreground">{legacy.total}</span>
          </div>
          {legacy.next && (
            <div className="text-[11px] text-muted-foreground">
              {toNext}★ to <span className="text-gold">{legacy.next.name}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function LegacyHall({ legacy, emp }: { legacy: ReturnType<typeof computeLegacy>; emp: Employee }) {
  const earned = emp.achievements.reduce((s, a) => s + a.history.reduce((x, h) => x + h.stars, 0), 0);
  const totalAchievementsEarned = emp.achievements.reduce((s, a) => s + a.history.length, 0);
  const uniqueEarned = emp.achievements.filter(a => a.history.length > 0).length;
  const yearsOfService = Math.max(1, Math.floor((Date.now() - new Date(emp.joinedOn).getTime()) / (365.25 * 24 * 3600 * 1000)));

  // career milestones derived from history
  const allHistory = emp.achievements.flatMap(a => a.history.map(h => ({ ...h, name: a.name, icon: a.icon })));
  allHistory.sort((a, b) => a.date.localeCompare(b.date));
  const firstEarn = allHistory[0];
  const milestones: { label: string; date?: string; detail: string }[] = [
    { label: "Sworn to the Fleet", date: emp.joinedOn, detail: emp.guildTitle },
    ...(firstEarn ? [{ label: "First Star Earned", date: firstEarn.date, detail: `${firstEarn.icon} ${firstEarn.name}` }] : []),
    { label: "First Moon Forged", date: allHistory[9]?.date, detail: "10 lifetime stars" },
    ...(legacy.suns >= 1 ? [{ label: "First Sun Risen", date: allHistory[49]?.date, detail: "50 lifetime stars" }] : []),
    { label: `Title: ${legacy.title.name}`, detail: legacy.title.flavor },
  ].filter(m => m.label);

  return (
    <div className="space-y-6">
      <section className="card-ornate-gold p-8 text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Lifetime Legacy</div>
        <h2 className="mt-2 font-display text-3xl">{legacy.title.name}</h2>
        <p className="mt-1 text-sm italic text-muted-foreground">{legacy.title.flavor}</p>
        <div className="mt-5 flex justify-center">
          <LegacyGlyphs suns={legacy.suns} moons={legacy.moons} stars={legacy.stars} />
        </div>
        <div className="mt-3 font-display text-xl text-gold">{legacy.total}⭐ <span className="text-sm text-muted-foreground">Lifetime Stars</span></div>
        <p className="mx-auto mt-4 max-w-md text-xs text-muted-foreground">
          10 stars become a moon. 5 moons become a sun. Legacy never resets — it is the record carried across every season.
        </p>
      </section>

      <section className="card-ornate p-6">
        <SectionHeader eyebrow="The Long Tally" title="Legacy Statistics" />
        <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3">
          <Stat2 label="Lifetime Stars"        value={`${legacy.total}⭐`} />
          <Stat2 label="Total Moons"           value={`${Math.floor(legacy.total / 10)}🌙`} />
          <Stat2 label="Total Suns"            value={`${Math.floor(legacy.total / 50)}☀`} />
          <Stat2 label="Achievements Earned"   value={String(totalAchievementsEarned)} />
          <Stat2 label="Unique Achievements"   value={`${uniqueEarned} / ${emp.achievements.length}`} />
          <Stat2 label="Years of Service"      value={`${yearsOfService} yr`} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded border border-border bg-ink/40 p-3 text-xs">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">From this ledger</div>
            <div className="font-display text-base">{earned}⭐ tracked</div>
          </div>
          <div className="rounded border border-border bg-ink/40 p-3 text-xs">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">From earlier seasons</div>
            <div className="font-display text-base">{emp.pastLegacyStars}⭐ archived</div>
          </div>
        </div>
      </section>

      <section className="card-ornate p-6">
        <SectionHeader eyebrow="The Conversion" title="How Legacy is Forged" />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ConversionCard label="Star" glyph="⭐" desc="Earned from a single achievement." count={legacy.stars} />
          <ConversionCard label="Moon" glyph="🌙" desc="10 stars become a moon." count={legacy.moons} />
          <ConversionCard label="Sun"  glyph="☀" desc="5 moons become a sun (50 stars)." count={legacy.suns} />
        </div>
      </section>

      <section className="card-ornate p-6">
        <SectionHeader eyebrow="The Saga" title="Career Milestones" />
        <ol className="mt-4 space-y-2">
          {milestones.map((m, i) => (
            <li key={i} className="flex items-start gap-3 rounded-md border border-border bg-ink/40 p-3">
              <span className="text-gold">◆</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-display text-sm">{m.label}</span>
                  {m.date && <span className="text-[11px] text-muted-foreground">{m.date}</span>}
                </div>
                <div className="text-[11px] text-muted-foreground">{m.detail}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="card-ornate p-6">
        <SectionHeader eyebrow="Titles of the Voyage" title="Legacy Titles" hint="Titles awarded as your lifetime legacy grows." />
        <ol className="mt-4 space-y-2">
          {[
            { name: "Wanderer",           min: 0,   glyph: "·" },
            { name: "Pathfinder",         min: 10,  glyph: "🌙" },
            { name: "Voyager",            min: 30,  glyph: "🌙🌙🌙" },
            { name: "Shipbuilder",        min: 50,  glyph: "☀" },
            { name: "Master Shipbuilder", min: 150, glyph: "☀☀☀" },
            { name: "Fleet Elder",        min: 250, glyph: "☀×5" },
            { name: "Living Legend",      min: 500, glyph: "☀×10" },
          ].map(t => {
            const reached = legacy.total >= t.min;
            const current = legacy.title.name === t.name;
            return (
              <li key={t.name}
                className={`flex items-center justify-between rounded-md border p-3 ${current ? "border-gold" : "border-border"} ${reached ? "" : "opacity-50"}`}
                style={current ? { boxShadow: "0 0 18px -6px var(--color-gold)" } : undefined}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg" style={{ color: reached ? "var(--color-gold)" : undefined }}>{t.glyph}</span>
                  <div>
                    <div className={`font-display text-sm ${current ? "text-gold" : ""}`}>{t.name}</div>
                    <div className="text-[11px] text-muted-foreground">{t.min}⭐ lifetime</div>
                  </div>
                </div>
                {current && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">Bearing now</span>}
                {!reached && <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Sealed</span>}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function ConversionCard({ label, glyph, desc, count }: { label: string; glyph: string; desc: string; count: number }) {
  return (
    <div className="rounded-md border border-border bg-ink/40 p-4 text-center">
      <div className="font-display text-3xl text-gold">{glyph}</div>
      <div className="mt-1 font-display text-sm">{label}</div>
      <div className="text-[11px] text-muted-foreground">{desc}</div>
      <div className="mt-2 text-xs">Currently held: <span className="font-display text-foreground">{count}</span></div>
    </div>
  );
}

/* =====================================================================
 * OPERATIONAL PATH — Professional Development (no achievement stars)
 * ===================================================================== */

type OpTabKey = "overview" | "skills" | "training" | "certifications" | "journey" | "reviews";

const OP_TABS: { key: OpTabKey; label: string }[] = [
  { key: "overview",       label: "Overview" },
  { key: "skills",         label: "Skill Tree" },
  { key: "training",       label: "Training" },
  { key: "certifications", label: "Certifications" },
  { key: "journey",        label: "Career Journey" },
  { key: "reviews",        label: "Reviews" },
];

function OperationalDashboard() {
  const emp = SAMPLE_OPERATIONAL_EMPLOYEE;
  const [tab, setTab] = useState<OpTabKey>("overview");
  return (
    <>
      <OpProfileCard emp={emp} />
      <Tabs tabs={OP_TABS} value={tab} onChange={(k) => setTab(k as OpTabKey)} />
      <div className="mt-6 space-y-6">
        {tab === "overview" && (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              <CurrentGradeCard current={emp.currentGrade} />
              <OpNextRankProgress current={emp.currentRank} notes={emp.nextRankNotes} />
            </div>
            <OpTrainingPanel training={emp.training} />
            <ABCDPanel current={emp.currentGrade} history={emp.abcdHistory} />
          </>
        )}
        {tab === "skills"         && <OpSkillTree skills={emp.skills} />}
        {tab === "training"       && <OpTrainingPanel training={emp.training} expanded />}
        {tab === "certifications" && <OpCertifications items={emp.certifications} />}
        {tab === "journey"        && <OpJourney milestones={emp.milestones} />}
        {tab === "reviews"        && <ReviewsPanel reviews={emp.reviews} />}
      </div>
    </>
  );
}

function OpProfileCard({ emp }: { emp: OperationalEmployee }) {
  const rank = OPERATIONAL_RANKS.find(r => r.key === emp.currentRank)!;
  const grade = GRADE_META[emp.currentGrade];
  const years = Math.max(1, new Date().getFullYear() - new Date(emp.joinedOn).getFullYear());
  return (
    <section className="card-ornate-gold relative overflow-hidden p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-5">
          <div
            className="grid h-20 w-20 shrink-0 place-items-center rounded-full font-display text-2xl font-bold"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${rank.color}, oklch(0.2 0.03 250))`,
              color: "oklch(0.15 0.03 250)",
              boxShadow: `0 0 0 2px ${rank.color}, 0 0 24px -4px ${rank.color}`,
            }}
          >
            {emp.avatar}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-gold">Operational Path</div>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">{emp.name}</h1>
            <p className="text-sm text-muted-foreground">{rank.name} {emp.role} · {emp.department}</p>
            <p className="mt-1 text-xs italic text-muted-foreground">Measured by capability & mastery — {years} year{years > 1 ? "s" : ""} of service</p>
          </div>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-3 sm:gap-4">
          <Stat label="Rank" value={rank.name} sub={rank.subtitle} color={rank.color} />
          <Stat label="This Month" value={`Grade ${emp.currentGrade}`} sub={grade.label} color={grade.color} />
          <Stat label="Discipline" value={emp.role} sub={emp.department.split("·")[0].trim()} color="var(--color-gold)" />
        </div>
      </div>
    </section>
  );
}

function OpNextRankProgress({ current, notes }: { current: OpRankKey; notes: string[] }) {
  const idx = OPERATIONAL_RANKS.findIndex(r => r.key === current);
  const cur = OPERATIONAL_RANKS[idx];
  const next = OPERATIONAL_RANKS[idx + 1];
  return (
    <section className="card-ornate p-6">
      <SectionHeader eyebrow="Ascension Trial" title="Path to Next Rank" hint="Rank never decreases. It is a record of proven mastery." />
      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border-2 font-display text-base"
            style={{ borderColor: cur.color, color: "oklch(0.15 0.03 250)", background: `radial-gradient(circle at 30% 30%, ${cur.color}, oklch(0.18 0.03 250))` }}>
            {cur.name.charAt(0)}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-widest" style={{ color: cur.color }}>{cur.name}</div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Trial of</div>
          <div className="font-display text-base text-gold">{next ? next.name : "Pinnacle Reached"}</div>
          <div className="text-[11px] italic text-muted-foreground">{next ? next.subtitle : "You stand at the summit."}</div>
        </div>
        {next && (
          <div className="text-center opacity-60">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border-2 font-display text-base"
              style={{ borderColor: next.color, color: "oklch(0.15 0.03 250)", background: `radial-gradient(circle at 30% 30%, ${next.color}, oklch(0.18 0.03 250))` }}>
              {next.name.charAt(0)}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-widest" style={{ color: next.color }}>{next.name}</div>
          </div>
        )}
      </div>
      <ul className="mt-5 space-y-1.5 text-xs text-muted-foreground">
        {notes.map((n, i) => (
          <li key={i} className="flex gap-2"><span className="text-gold">◆</span><span>{n}</span></li>
        ))}
      </ul>
    </section>
  );
}

function OpSkillTree({ skills }: { skills: OpSkillNode[] }) {
  const branches = useMemo(() => {
    const out: Record<string, OpSkillNode[]> = {};
    for (const n of skills) (out[n.branch] ||= []).push(n);
    for (const k of Object.keys(out)) out[k].sort((a, b) => a.tier - b.tier);
    return out;
  }, [skills]);
  const tints: Record<string, string> = {
    Craft: "oklch(0.75 0.15 78)",
    Service: "oklch(0.7 0.18 240)",
    Leadership: "oklch(0.7 0.2 300)",
  };
  return (
    <section className="card-ornate p-6">
      <SectionHeader eyebrow="What I Can Do" title="Skill Tree" hint="Proven craft, service, and leadership skills. Built shift by shift." />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.keys(branches).map(b => {
          const tint = tints[b] ?? "var(--color-gold)";
          return (
            <div key={b} className="rounded-md border border-border bg-ink/40 p-3">
              <div className="mb-3 flex items-center gap-2">
                <span className="font-display text-sm uppercase tracking-widest" style={{ color: tint }}>{b}</span>
              </div>
              <ol className="space-y-2">
                {branches[b].map((node, i) => (
                  <li key={node.id}>
                    <OpSkillNodeView node={node} tint={tint} />
                    {i < branches[b].length - 1 && <div className="ml-4 h-3 w-px bg-border" />}
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
      <Legend />
    </section>
  );
}

function OpSkillNodeView({ node, tint }: { node: OpSkillNode; tint: string }) {
  const styleByStatus = {
    mastered:  { border: tint, bg: `color-mix(in oklch, ${tint} 14%, transparent)`, text: "text-foreground", icon: "✓" },
    active:    { border: "var(--color-gold)", bg: "color-mix(in oklch, var(--color-gold) 14%, transparent)", text: "text-gold", icon: "◐" },
    available: { border: "var(--color-border)", bg: "transparent", text: "text-foreground", icon: "○" },
    locked:    { border: "var(--color-border)", bg: "transparent", text: "text-muted-foreground", icon: "🔒" },
  }[node.status];
  return (
    <div className={`rounded-md border p-2.5 ${node.status === "locked" ? "opacity-55" : ""}`}
      style={{ borderColor: styleByStatus.border, background: styleByStatus.bg }}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={`font-display text-sm ${styleByStatus.text}`}>{node.label}</span>
        <span className="text-xs opacity-70">{styleByStatus.icon}</span>
      </div>
      <div className="text-[11px] text-muted-foreground">Tier {node.tier} · {node.desc}</div>
    </div>
  );
}

function OpTrainingPanel({ training, expanded }: { training: TrainingLevel[]; expanded?: boolean }) {
  return (
    <section className="card-ornate p-6">
      <SectionHeader
        eyebrow="Training Levels"
        title="Mastery Tracks"
        hint="Each track grows 1 → 5 through formal training and verified practice."
      />
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {training.map(t => (
          <li key={t.track} className="rounded-md border border-border bg-ink/40 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display text-sm">{t.track}</span>
              <span className="font-display text-sm text-gold">Lv {t.level}/5</span>
            </div>
            {expanded && <div className="text-[11px] italic text-muted-foreground">{t.blurb}</div>}
            <div className="mt-2 flex items-center gap-2">
              {[1,2,3,4,5].map(n => (
                <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= t.level ? "bg-gold" : "bg-border"}`} />
              ))}
            </div>
            {t.level < 5 && (
              <div className="mt-2 text-[11px] text-muted-foreground">
                <span className="text-gold">{t.progressToNext}%</span> to Level {t.level + 1}
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full border border-border bg-ink">
                  <div className="h-full rounded-full bg-gold/70" style={{ width: `${t.progressToNext}%` }} />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function OpCertifications({ items }: { items: Certification[] }) {
  const statusMeta: Record<Certification["status"], { label: string; color: string }> = {
    active:   { label: "Active",        color: "var(--color-grade-a)" },
    expiring: { label: "Expiring Soon", color: "var(--color-grade-c)" },
    expired:  { label: "Expired",       color: "var(--color-grade-d)" },
  };
  return (
    <section className="card-ornate p-6">
      <SectionHeader eyebrow="Verified Mastery" title="Certifications" hint="Formal proof of capability — awarded by institutions and the house." />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map(c => {
          const s = statusMeta[c.status];
          return (
            <div key={c.id} className="rounded-md border border-border bg-ink/40 p-4"
              style={{ boxShadow: c.status === "active" ? `0 0 14px -8px ${s.color}` : undefined }}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-sm">{c.name}</span>
                <span className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest"
                  style={{ color: s.color, background: `color-mix(in oklch, ${s.color} 15%, transparent)` }}>
                  {s.label}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">Issued by {c.issuer}</div>
              <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                <span>Earned <span className="text-foreground">{c.earnedOn}</span></span>
                {c.expiresOn && <span>Expires <span className="text-foreground">{c.expiresOn}</span></span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function OpJourney({ milestones }: { milestones: CareerMilestone[] }) {
  return (
    <section className="card-ornate p-6">
      <SectionHeader eyebrow="The Journey" title="Career Milestones" hint="Every promotion, certification, and signature moment in your career." />
      <ol className="mt-5 space-y-2">
        {milestones.slice().reverse().map((m, i) => (
          <li key={i} className="flex items-start gap-3 rounded-md border border-border bg-ink/40 p-3">
            <span className="text-gold">◆</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-display text-sm">{m.label}</span>
                <span className="text-[11px] text-muted-foreground">{m.date}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">{m.detail}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ============================ Growth Trees ============================ */

type GrowthStage = {
  name: string;
  blurb: string;
  requirements: string[];
  rewards: string[];
};

type GrowthTree = {
  id: string;
  title: string;
  question: string;
  icon: string;
  accent: string;       // css var
  driver: string;       // what fuels progression
  currentIndex: number; // index in stages
  progressPct: number;  // 0..100 toward next stage
  progressLabel: string;
  stages: GrowthStage[];
};

const GROWTH_TREES: GrowthTree[] = [
  {
    id: "career",
    title: "Career Tree",
    question: "What can I do?",
    icon: "⚔",
    accent: "var(--color-rank-platinum)",
    driver: "Driven by ABCD performance history",
    currentIndex: 3,
    progressPct: 62,
    progressLabel: "8 / 12 A-grades toward Diamond Hunter",
    stages: [
      { name: "Bronze Hunter",   blurb: "Learning the craft under guidance.",
        requirements: ["Complete onboarding voyage", "First solo close"],
        rewards: ["Hunter sigil", "Bronze cloak"] },
      { name: "Silver Hunter",   blurb: "Operates independently.",
        requirements: ["6 months sustained C+ grades", "Own a pipeline cycle"],
        rewards: ["Silver insignia", "Territory assignment"] },
      { name: "Gold Hunter",     blurb: "Consistent professional output.",
        requirements: ["12 B+ grades", "Lead a quarterly target"],
        rewards: ["Gold standard cloak", "Mentor eligibility"] },
      { name: "Platinum Hunter", blurb: "Influential field operator.",
        requirements: ["Multi-quarter A-grade streak", "Run a campaign solo"],
        rewards: ["Platinum sigil", "Voice in strategy rounds"] },
      { name: "Diamond Hunter",  blurb: "Defines excellence in the craft.",
        requirements: ["12 A-grades within 18 months", "Captain nomination"],
        rewards: ["Diamond crest", "Department-level mandate"] },
    ],
  },
  {
    id: "partner",
    title: "Partner Tree",
    question: "What can I build?",
    icon: "⚓",
    accent: "var(--color-gold)",
    driver: "Driven by ownership & cross-team initiative — not raw sales",
    currentIndex: 1,
    progressPct: 35,
    progressLabel: "Guardian → Partner Candidate · 1 of 3 prerequisites met",
    stages: [
      { name: "Explorer",          blurb: "Curious about the business beyond the craft.",
        requirements: ["Shadow a senior on one cross-team initiative"],
        rewards: ["Access to strategy briefings"] },
      { name: "Guardian",          blurb: "Mentors juniors, protects fleet standards.",
        requirements: ["Mentor 2 juniors to first rank-up", "Uphold standards in reviews"],
        rewards: ["Guardian sash", "Review panel seat"] },
      { name: "Partner Candidate", blurb: "Demonstrates cross-functional leadership.",
        requirements: ["Black Diamond rank", "Lead a cross-team campaign", "Captain's nomination"],
        rewards: ["Candidate ring", "Partner forum access"] },
      { name: "Partner",           blurb: "Trusted captain of a business line.",
        requirements: ["Own a sub-line for 2 seasons", "Sustained Fleet Elder legacy"],
        rewards: ["Partner crest", "Profit-share line"] },
      { name: "Business Partner",  blurb: "Owns a P&L and grows new ventures.",
        requirements: ["Launch and sustain a new venture", "Board-level review"],
        rewards: ["Equity grant", "Venture autonomy"] },
      { name: "Shareholder",       blurb: "Long-term steward of the fleet.",
        requirements: ["Decade of stewardship", "Founders' invitation"],
        rewards: ["Shareholder seal", "Permanent admiralty seat"] },
    ],
  },
  {
    id: "mentor",
    title: "Mentor Tree",
    question: "Who have I helped grow?",
    icon: "📖",
    accent: "var(--color-grade-a)",
    driver: "Driven by people developed & mentorship outcomes",
    currentIndex: 2,
    progressPct: 48,
    progressLabel: "Mentor → Master Mentor · 4 of 6 protégés ranked up",
    stages: [
      { name: "Helper",         blurb: "Lends a hand when asked.",
        requirements: ["Onboard 1 new member"],
        rewards: ["Helper ribbon"] },
      { name: "Guide",          blurb: "Takes a junior through their first season.",
        requirements: ["Guide 2 members through onboarding"],
        rewards: ["Guide token", "Listed in new-hire packs"] },
      { name: "Mentor",         blurb: "Pairs long-term with developing hunters.",
        requirements: ["Mentor 3 members to a rank-up"],
        rewards: ["Mentor pin", "Quarterly mentor stipend"] },
      { name: "Master Mentor",  blurb: "Recognized teacher across departments.",
        requirements: ["6 protégés rank-up", "Run a fleet training session"],
        rewards: ["Master Mentor sash", "Curriculum authoring rights"] },
      { name: "Fleet Mentor",   blurb: "Shapes the next generation of the fleet.",
        requirements: ["Sustained 2+ years of mentorship leadership"],
        rewards: ["Fleet Mentor crest", "Permanent academy seat"] },
    ],
  },
  {
    id: "leadership",
    title: "Leadership Tree",
    question: "Who follows me?",
    icon: "🛡",
    accent: "var(--color-rank-diamond)",
    driver: "Driven by team, project, and event leadership",
    currentIndex: 1,
    progressPct: 55,
    progressLabel: "Squad Leader → Captain · led 4 of 6 required projects",
    stages: [
      { name: "Team Member",      blurb: "Contributes inside a team.",
        requirements: ["Active on a team for one season"],
        rewards: ["Team badge"] },
      { name: "Squad Leader",     blurb: "Leads a small squad on focused missions.",
        requirements: ["Lead 2 missions or events"],
        rewards: ["Squad sigil", "Squad budget access"] },
      { name: "Captain",          blurb: "Owns a full team and its outcomes.",
        requirements: ["Lead 6 projects", "Sustained team grade B+"],
        rewards: ["Captain's crest", "Hiring vote"] },
      { name: "Fleet Captain",    blurb: "Coordinates multiple teams toward a goal.",
        requirements: ["Run a multi-team campaign for 2 seasons"],
        rewards: ["Fleet standard", "Operational override"] },
      { name: "Fleet Commander",  blurb: "Sets direction across the fleet floor.",
        requirements: ["Captain nomination", "Proven multi-year influence"],
        rewards: ["Commander's mantle", "Strategy council seat"] },
    ],
  },
  {
    id: "secondary",
    title: "Secondary Class Tree",
    question: "What else can I become?",
    icon: "✦",
    accent: "var(--color-rank-mythic)",
    driver: "Unlocks at Career Tree milestones · multiple classes can stack",
    currentIndex: 1,
    progressPct: 40,
    progressLabel: "1 secondary unlocked · Bard at 60% · Strategist locked",
    stages: [
      { name: "Hunter (Main)",     blurb: "Your primary class. Always active.",
        requirements: ["—"],
        rewards: ["Full Hunter kit"] },
      { name: "Hunter + Sniper",   blurb: "Precision closer. Specializes in high-value, low-volume hunts.",
        requirements: ["Gold Hunter", "5 enterprise closes"],
        rewards: ["Sniper's mark", "Named-account access"] },
      { name: "Hunter + Bard",     blurb: "Voice of the fleet. Owns story and stage.",
        requirements: ["Platinum Hunter", "Headline 3 fleet events"],
        rewards: ["Bard's lyre", "Marketing co-sign"] },
      { name: "Hunter + Strategist", blurb: "Planner & analyst behind the field.",
        requirements: ["Diamond Hunter", "Author a winning territory plan"],
        rewards: ["Strategist's compass", "Planning seat"] },
      { name: "Hunter + Host",     blurb: "Front-of-house ambassador for guests and partners.",
        requirements: ["Platinum Hunter", "Host 6 partner evenings"],
        rewards: ["Host's medallion"] },
      { name: "Hunter + Event Planner", blurb: "Designs and runs crew gatherings end-to-end.",
        requirements: ["Captain (Leadership)", "Run 2 flagship events"],
        rewards: ["Planner's quill"] },
    ],
  },
];

function GrowthTrees() {
  const [openId, setOpenId] = useState<string>(GROWTH_TREES[0].id);
  return (
    <section className="space-y-6">
      <div className="card-ornate-gold p-6">
        <SectionHeader
          eyebrow="Core Progression"
          title="Growth Trees"
          hint="Your character development. Separate from Monthly Grade, Achievement Stars, and Legacy — this is who you are becoming."
        />
        <div className="mt-4 grid gap-2 text-[12px] text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <FactPill label="Where am I now?" />
          <FactPill label="What should I improve next?" />
          <FactPill label="What path am I walking?" />
          <FactPill label="What future is available?" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {GROWTH_TREES.map(t => (
          <GrowthTreeSummary
            key={t.id}
            tree={t}
            active={openId === t.id}
            onOpen={() => setOpenId(t.id)}
          />
        ))}
      </div>

      {GROWTH_TREES.filter(t => t.id === openId).map(t => (
        <GrowthTreeDetail key={t.id} tree={t} />
      ))}
    </section>
  );
}

function FactPill({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-border bg-ink/40 px-3 py-2">
      <span className="text-gold">◆</span> <span className="text-foreground">{label}</span>
    </div>
  );
}

function GrowthTreeSummary({ tree, active, onOpen }: { tree: GrowthTree; active: boolean; onOpen: () => void }) {
  const current = tree.stages[tree.currentIndex];
  const next = tree.stages[tree.currentIndex + 1];
  return (
    <button
      onClick={onOpen}
      className={`card-ornate group relative overflow-hidden p-5 text-left transition-all ${
        active ? "ring-1 ring-gold/60" : "hover:border-gold/40"
      }`}
      style={{ borderColor: active ? tree.accent : undefined }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl" style={{ color: tree.accent }}>{tree.icon}</span>
          <div className="font-display text-sm uppercase tracking-widest" style={{ color: tree.accent }}>
            {tree.title}
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {tree.currentIndex + 1}/{tree.stages.length}
        </span>
      </div>
      <p className="mt-1 text-[11px] italic text-muted-foreground">"{tree.question}"</p>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Current Stage</div>
        <div className="font-display text-base text-foreground">{current.name}</div>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between text-[11px] text-muted-foreground">
          <span>Next: {next ? next.name : "— pinnacle reached —"}</span>
          <span>{next ? `${tree.progressPct}%` : "MAX"}</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink/70">
          <div
            className="h-full transition-all"
            style={{ width: `${next ? tree.progressPct : 100}%`, background: tree.accent }}
          />
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">{tree.progressLabel}</div>
      </div>
    </button>
  );
}

function GrowthTreeDetail({ tree }: { tree: GrowthTree }) {
  const next = tree.stages[tree.currentIndex + 1];
  return (
    <section className="card-ornate p-6" style={{ borderColor: tree.accent }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: tree.accent }}>
            {tree.title} · "{tree.question}"
          </div>
          <h3 className="font-display text-xl text-foreground">The Path of {tree.title.replace(" Tree", "")}</h3>
          <p className="mt-1 text-xs italic text-muted-foreground">{tree.driver}</p>
        </div>
        {next && (
          <div className="rounded-md border border-border bg-ink/40 px-3 py-2 text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Ascending toward</div>
            <div className="font-display text-sm" style={{ color: tree.accent }}>{next.name}</div>
            <div className="mt-1 text-[10px] text-muted-foreground">{tree.progressLabel}</div>
          </div>
        )}
      </div>

      <ol className="mt-6 space-y-3">
        {tree.stages.map((s, i) => {
          const state =
            i < tree.currentIndex ? "done" :
            i === tree.currentIndex ? "current" :
            i === tree.currentIndex + 1 ? "next" : "locked";
          return (
            <li
              key={s.name}
              className={`grid grid-cols-[auto_1fr] gap-4 rounded-md border p-4 ${
                state === "current" ? "bg-ink/60" :
                state === "next"    ? "bg-ink/40" :
                state === "done"    ? "bg-ink/20 opacity-75" :
                                      "bg-ink/10 opacity-55"
              }`}
              style={{
                borderColor: state === "current" || state === "next" ? tree.accent : "var(--color-border)",
              }}
            >
              <StageNode index={i} state={state} accent={tree.accent} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-display text-base" style={{
                    color: state === "locked" ? "var(--color-muted-foreground)" : "var(--color-foreground)",
                  }}>{s.name}</span>
                  <StageBadge state={state} accent={tree.accent} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.blurb}</p>

                {state === "current" && (
                  <div className="mt-3">
                    <div className="flex items-baseline justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                      <span>Progress to next stage</span>
                      <span style={{ color: tree.accent }}>{tree.progressPct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink/70">
                      <div className="h-full" style={{ width: `${tree.progressPct}%`, background: tree.accent }} />
                    </div>
                  </div>
                )}

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Requirements label={state === "done" ? "Earned by" : "Requirements"} items={s.requirements} accent={tree.accent} muted={state === "locked"} />
                  <Requirements label={state === "locked" ? "Locked rewards" : "Rewards"} items={s.rewards} accent={tree.accent} muted={state === "locked"} reward />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StageNode({ index, state, accent }: { index: number; state: "done" | "current" | "next" | "locked"; accent: string }) {
  const sym = state === "done" ? "✓" : state === "locked" ? "🔒" : index + 1;
  return (
    <div
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-sm"
      style={{
        background: state === "current"
          ? `radial-gradient(circle at 30% 30%, ${accent}, oklch(0.2 0.03 250))`
          : "var(--color-ink)",
        color: state === "locked" ? "var(--color-muted-foreground)" :
               state === "current" ? "oklch(0.15 0.03 250)" : accent,
        boxShadow: state === "current" ? `0 0 0 2px ${accent}, 0 0 18px -4px ${accent}` :
                   state === "next"    ? `0 0 0 1px ${accent}` : "none",
      }}
    >
      {sym}
    </div>
  );
}

function StageBadge({ state, accent }: { state: "done" | "current" | "next" | "locked"; accent: string }) {
  const map = {
    done:    { label: "Earned",    color: "var(--color-muted-foreground)" },
    current: { label: "You are here", color: accent },
    next:    { label: "Next stage", color: accent },
    locked:  { label: "Locked",    color: "var(--color-muted-foreground)" },
  } as const;
  const m = map[state];
  return (
    <span
      className="rounded-full border px-2 py-[1px] text-[9px] uppercase tracking-widest"
      style={{ color: m.color, borderColor: m.color }}
    >
      {m.label}
    </span>
  );
}

function Requirements({ label, items, accent, muted, reward }: { label: string; items: string[]; accent: string; muted?: boolean; reward?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-ink/30 p-3">
      <div className="text-[10px] uppercase tracking-widest" style={{ color: muted ? "var(--color-muted-foreground)" : accent }}>{label}</div>
      <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span style={{ color: muted ? "var(--color-muted-foreground)" : accent }}>{reward ? "✦" : "◇"}</span>
            <span className={muted ? "" : "text-foreground/90"}>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}


