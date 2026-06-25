import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  SAMPLE_EMPLOYEE,
  GRADE_META,
  HUNTER_RANKS,
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
} from "@/lib/employee-data";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Guild Ledger — Hunter Legacy System" },
      { name: "description", content: "An RPG-styled hunter progression journal: ABCD monthly grade, permanent Hunter Rank, repeatable achievement stars, lifetime legacy, and the Partner tree." },
      { property: "og:title", content: "Guild Ledger — Hunter Legacy System" },
      { property: "og:description", content: "Monthly grades, permanent rank, repeatable stars, lifetime legacy, and the partner journey." },
    ],
  }),
  component: Dashboard,
});

type TabKey = "overview" | "achievements" | "legacy" | "career" | "partner" | "reviews";

function Dashboard() {
  const emp = SAMPLE_EMPLOYEE;
  const [tab, setTab] = useState<TabKey>("overview");
  const legacy = useMemo(() => computeLegacy(totalStars(emp)), [emp]);

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <HunterHeader />
        <ProfileCard emp={emp} legacy={legacy} />

        <Tabs value={tab} onChange={setTab} />

        <div className="mt-6 space-y-6">
          {tab === "overview" && (
            <>
              <QuestBoard quests={emp.quests} />
              <div className="grid gap-6 lg:grid-cols-2">
                <CurrentGradeCard current={emp.currentGrade} />
                <NextRankProgress current={emp.currentRank} progress={emp.rankProgress} />
              </div>
              <LegacyBanner legacy={legacy} />
              <HunterAttributes attributes={emp.attributes} />
              <ABCDPanel current={emp.currentGrade} history={emp.abcdHistory} />
            </>
          )}
          {tab === "achievements" && <AchievementsLedger items={emp.achievements} />}
          {tab === "legacy" && <LegacyHall legacy={legacy} emp={emp} />}
          {tab === "career" && (
            <>
              <RankLadder current={emp.currentRank} />
              <CareerTree nodes={emp.career} />
            </>
          )}
          {tab === "partner" && <PartnerPath currentKey={emp.partnerStage} expanded />}
          {tab === "reviews" && <ReviewsPanel reviews={emp.reviews} />}
        </div>


        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          The Guild Ledger · a hunter's adventure journal · all hunters depicted are fictional
        </footer>
      </div>
    </div>
  );
}

/* ----------------------------- Header ----------------------------- */

function HunterHeader() {
  return (
    <header className="mb-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <CrestIcon />
        <div>
          <div className="font-display text-lg font-semibold tracking-widest text-gold uppercase">
            The Guild Ledger
          </div>
          <div className="text-xs text-muted-foreground">Adventure journal of a guild hunter</div>
        </div>
      </div>
      <div className="hidden text-right text-xs text-muted-foreground sm:block">
        Season · Year of the Azure Tide
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
            <p className="mt-1 text-xs text-muted-foreground">Sworn to the guild for {years} year{years > 1 ? "s" : ""}</p>
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

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview",     label: "Overview" },
  { key: "achievements", label: "Achievements" },
  { key: "legacy",       label: "Legacy" },
  { key: "career",       label: "Rank & Career" },
  { key: "partner",      label: "Partner Path" },
  { key: "reviews",      label: "Reviews" },
];

function Tabs({ value, onChange }: { value: TabKey; onChange: (k: TabKey) => void }) {
  return (
    <nav className="mt-6 flex flex-wrap gap-1 border-b border-border" role="tablist">
      {TABS.map(t => {
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
  return (
    <section className="card-ornate p-6">
      <SectionHeader
        eyebrow="Hall of Records"
        title="Achievement Ledger"
        hint="Achievements are repeatable. Earning the same achievement again grants another star."
      />
      <div className="mt-3 text-xs text-muted-foreground">
        <span className="text-gold font-display">{totalEarnedStars}★</span> stars earned across <span className="text-foreground">{items.length}</span> achievements in this ledger.
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {items.map(a => <AchievementRow key={a.id} a={a} />)}
      </div>
    </section>
  );
}

function AchievementRow({ a }: { a: RepeatableAchievement }) {
  const stars = a.history.reduce((s, h) => s + h.stars, 0);
  const times = a.history.length;
  const last = a.history[a.history.length - 1];
  const diffColor = DIFFICULTY_COLOR[a.difficulty] ?? "var(--color-gold)";
  return (
    <div className="rounded-md border border-border bg-ink/40 p-4">
      <div className="flex items-start gap-3">
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-md border text-xl"
          style={{
            borderColor: diffColor,
            background: `radial-gradient(circle at 30% 30%, color-mix(in oklch, ${diffColor} 35%, transparent), oklch(0.2 0.03 250))`,
            boxShadow: times > 0 ? `0 0 14px -6px ${diffColor}` : undefined,
          }}
        >
          {a.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-display text-sm">{a.name}</span>
            <span className="font-display text-sm text-gold">{stars}★</span>
          </div>
          <div className="text-[11px] text-muted-foreground">{a.description}</div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] uppercase tracking-widest">
            <Chip>{a.type}</Chip>
            <Chip color={diffColor}>{a.difficulty}</Chip>
            <Chip>Resets · {a.resetCycle}</Chip>
            <Chip>{a.repeatable ? "Repeatable" : "One-Time"}</Chip>
            <Chip>Max {a.maxPerCycle}/cycle</Chip>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <Stat2 label="Times Earned" value={String(times)} />
        <Stat2 label="Stars Generated" value={`${stars}★`} />
        <Stat2 label="Reward" value={a.rewardText} />
        <Stat2 label="Latest" value={last ? last.period : "—"} />
      </div>

      {times > 0 ? (
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">History</div>
          <ol className="mt-1.5 space-y-1">
            {a.history.slice().reverse().map((h, i) => (
              <li key={i} className="flex items-center justify-between rounded border border-border/70 bg-ink/60 px-2 py-1 text-[11px]">
                <span className="text-foreground">{h.period}</span>
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground">{h.date}</span>
                  <span className="text-gold">{"★".repeat(h.stars)}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="mt-3 rounded border border-dashed border-border/60 bg-ink/40 px-3 py-2 text-[11px] italic text-muted-foreground">
          Not yet claimed. {a.repeatable ? "Earn it and the ledger will remember every time." : "A relic yet to be forged — a one-time honor."}
        </div>
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
    { label: "Sworn to the Guild", date: emp.joinedOn, detail: emp.guildTitle },
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
        <SectionHeader eyebrow="Titles of the Guild" title="Legacy Titles" hint="Titles awarded as your lifetime legacy grows." />
        <ol className="mt-4 space-y-2">
          {[
            { name: "Wanderer",           min: 0,   glyph: "·" },
            { name: "Pathfinder",         min: 10,  glyph: "🌙" },
            { name: "Voyager",            min: 30,  glyph: "🌙🌙🌙" },
            { name: "Shipbuilder",        min: 50,  glyph: "☀" },
            { name: "Master Shipbuilder", min: 150, glyph: "☀☀☀" },
            { name: "Guild Elder",        min: 250, glyph: "☀×5" },
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
