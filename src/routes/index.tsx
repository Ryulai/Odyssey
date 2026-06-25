import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  SAMPLE_EMPLOYEE,
  GRADE_META,
  HUNTER_RANKS,
  PARTNER_PATH,
  type Grade,
  type RankKey,
  type CareerTreeNode,
} from "@/lib/employee-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Guild Ledger — Hunter Growth System" },
      { name: "description", content: "An RPG-styled employee growth dashboard: ABCD grading, achievement stars, rank progression, career and partner trees, and monthly reviews." },
      { property: "og:title", content: "Guild Ledger — Hunter Growth System" },
      { property: "og:description", content: "ABCD grading, achievement stars, rank progression, career and partner trees, and monthly reviews." },
    ],
  }),
  component: Dashboard,
});

type TabKey = "overview" | "career" | "partner" | "reviews" | "achievements";

function Dashboard() {
  const emp = SAMPLE_EMPLOYEE;
  const [tab, setTab] = useState<TabKey>("overview");

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <HunterHeader />
        <ProfileCard
          name={emp.name}
          title={emp.guildTitle}
          avatar={emp.avatar}
          rank={emp.currentRank}
          grade={emp.currentGrade}
          starCount={emp.stars.length}
          joinedOn={emp.joinedOn}
        />

        <Tabs value={tab} onChange={setTab} />

        <div className="mt-6 space-y-6">
          {tab === "overview" && (
            <>
              <ABCDPanel current={emp.currentGrade} history={emp.abcdHistory} />
              <div className="grid gap-6 lg:grid-cols-2">
                <RankLadder current={emp.currentRank} />
                <PartnerPath currentKey={emp.partnerStage} />
              </div>
              <RecentStars stars={emp.stars.slice(0, 4)} />
            </>
          )}
          {tab === "career" && <CareerTree nodes={emp.career} />}
          {tab === "partner" && <PartnerPath currentKey={emp.partnerStage} expanded />}
          {tab === "reviews" && <ReviewsPanel reviews={emp.reviews} />}
          {tab === "achievements" && <AchievementsGrid stars={emp.stars} />}
        </div>

        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          The Guild Ledger · prototype · all hunters depicted are fictional
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
          <div className="text-xs text-muted-foreground">Hunter growth & partner registry</div>
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

function ProfileCard(props: {
  name: string; title: string; avatar: string; rank: RankKey; grade: Grade; starCount: number; joinedOn: string;
}) {
  const rank = HUNTER_RANKS.find(r => r.key === props.rank)!;
  const grade = GRADE_META[props.grade];
  const years = Math.max(1, new Date().getFullYear() - new Date(props.joinedOn).getFullYear());

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
            {props.avatar}
          </div>
          <div>
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">{props.name}</h1>
            <p className="text-sm text-muted-foreground">{props.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">Sworn to the guild for {years} year{years > 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-3 gap-3 sm:gap-4">
          <Stat label="Rank" value={rank.name.replace(" Hunter", "")} sub={rank.subtitle} color={rank.color} />
          <Stat label="This Month" value={`Grade ${props.grade}`} sub={grade.label} color={grade.color} />
          <Stat label="Stars" value={String(props.starCount)} sub="achievements" color="var(--color-gold)" />
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
  { key: "career",       label: "Career Tree" },
  { key: "partner",      label: "Partner Path" },
  { key: "reviews",      label: "Monthly Reviews" },
  { key: "achievements", label: "Achievements" },
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

/* ----------------------------- ABCD Panel ----------------------------- */

function ABCDPanel({ current, history }: { current: Grade; history: { month: string; grade: Grade }[] }) {
  return (
    <section className="card-ornate p-6">
      <SectionHeader
        eyebrow="Monthly Standing"
        title="ABCD Grading"
        hint="Current month's contribution & consistency. Resets each month. Does not change rank."
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {(["A","B","C","D"] as Grade[]).map(g => {
          const meta = GRADE_META[g];
          const active = g === current;
          return (
            <div
              key={g}
              className={`rounded-md border p-4 transition-all ${active ? "scale-[1.02]" : "opacity-60"}`}
              style={{
                borderColor: active ? meta.color : "var(--color-border)",
                background: active
                  ? `linear-gradient(180deg, color-mix(in oklch, ${meta.color} 18%, transparent), transparent)`
                  : "transparent",
                boxShadow: active ? `0 0 24px -8px ${meta.color}` : undefined,
              }}
            >
              <div className="flex items-baseline justify-between">
                <div className="font-display text-3xl" style={{ color: meta.color }}>{g}</div>
                {active && <span className="text-[10px] uppercase tracking-widest text-gold">Current</span>}
              </div>
              <div className="mt-1 font-display text-sm">{meta.label}</div>
              <div className="text-xs text-muted-foreground">{meta.tagline}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Last 6 months</div>
        <div className="flex items-end gap-2">
          {history.map(h => {
            const meta = GRADE_META[h.grade];
            const heights: Record<Grade, string> = { A: "h-20", B: "h-16", C: "h-11", D: "h-6" };
            return (
              <div key={h.month} className="flex flex-1 flex-col items-center gap-1">
                <div className={`w-full rounded-sm ${heights[h.grade]}`} style={{ background: meta.color, opacity: 0.85 }} />
                <div className="text-[10px] text-muted-foreground">{h.month.slice(5)}</div>
                <div className="font-display text-xs" style={{ color: meta.color }}>{h.grade}</div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-5 rounded-md border border-border bg-ink/40 p-3 text-xs text-muted-foreground">
        Grading affects yearly bonuses and seasonal rewards. It is independent from Rank (capability) and Achievements (history).
      </p>
    </section>
  );
}

/* ----------------------------- Rank Ladder ----------------------------- */

function RankLadder({ current }: { current: RankKey }) {
  const currentIdx = HUNTER_RANKS.findIndex(r => r.key === current);
  return (
    <section className="card-ornate p-6">
      <SectionHeader eyebrow="Capability Certification" title="Hunter Rank" hint="Rank never decreases. It unlocks opportunities, not bonuses." />
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
              <RankPip color={r.color} achieved={achieved} locked={r.locked && !achieved} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-display text-sm" style={{ color: achieved ? r.color : undefined }}>
                    {r.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{r.subtitle}</span>
                  {isCurrent && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">You are here</span>}
                  {r.locked && !achieved && <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Locked</span>}
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
        eyebrow="What can I build?"
        title="Partner Tree"
        hint="Leadership, ownership, business mindset. Separate from craft."
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
              </div>
            </div>
          );
        })}
      </div>

      {expanded && (
        <div className="mt-5 rounded-md border border-border bg-ink/40 p-4 text-xs text-muted-foreground">
          <div className="mb-2 font-display text-sm text-foreground">General expectations</div>
          <ul className="list-inside list-disc space-y-1">
            <li>Strong performance record across multiple seasons</li>
            <li>Multiple Career Tree branches developed</li>
            <li>Demonstrated leadership and mentorship</li>
            <li>Understanding of operations, branding, business development</li>
            <li>Long-term commitment to the guild</li>
          </ul>
          <p className="mt-3 italic">Specific gates are not revealed. Captains nominate candidates.</p>
        </div>
      )}
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

/* ----------------------------- Achievements ----------------------------- */

function RecentStars({ stars }: { stars: typeof SAMPLE_EMPLOYEE.stars }) {
  return (
    <section className="card-ornate p-6">
      <SectionHeader eyebrow="Latest Trophies" title="Recent Achievement Stars" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {stars.map(s => <StarCard key={s.id} star={s} />)}
      </div>
    </section>
  );
}

function AchievementsGrid({ stars }: { stars: typeof SAMPLE_EMPLOYEE.stars }) {
  return (
    <section className="card-ornate p-6">
      <SectionHeader eyebrow="Hall of Records" title="All Achievement Stars" hint="A historical record. Stars are never taken back." />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stars.map(s => <StarCard key={s.id} star={s} />)}
      </div>
    </section>
  );
}

function StarCard({ star }: { star: typeof SAMPLE_EMPLOYEE.stars[number] }) {
  return (
    <div className="flex gap-3 rounded-md border border-border bg-ink/40 p-3">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md"
        style={{ background: "radial-gradient(circle at 30% 30%, oklch(0.85 0.16 85), oklch(0.45 0.1 60))" }}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="oklch(0.18 0.03 250)">
          <path d="M12 2l2.9 6.6L22 9.7l-5 4.9 1.2 7L12 18.3 5.8 21.6 7 14.6 2 9.7l7.1-1.1z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-sm leading-tight">{star.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="rounded-full border border-border px-1.5 py-0.5">{star.category}</span>
          <span>{star.earnedOn}</span>
          <Rarity n={star.rarity} />
        </div>
      </div>
    </div>
  );
}

function Rarity({ n }: { n: number }) {
  return (
    <span aria-label={`Rarity ${n} of 5`} className="text-gold tracking-tight">
      {"★".repeat(n)}<span className="opacity-30">{"★".repeat(5 - n)}</span>
    </span>
  );
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
