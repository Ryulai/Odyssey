import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRole, ROLE_META, can, useAuth } from "@/lib/roles";
import { AuthGate } from "@/components/auth-gate";
import { getStaffDashboard } from "@/lib/workflow.functions";
import { classLabel, roleLabel, rankIdentity, rankGlyph, rankLabel, factionFor } from "@/lib/rpg";
import { GRADE_META, type Grade } from "@/lib/employee-data";
import { PortraitBadge } from "@/components/portrait";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Odyssey Guide — Chart Your Journey. Forge Your Legacy." },
      { name: "description", content: "Your dashboard: profile, monthly performance, legacy, class, promotion journey, and future systems — mentorship and ownership." },
      { property: "og:title", content: "The Odyssey Guide — Chart Your Journey. Forge Your Legacy." },
      { property: "og:description", content: "A single dashboard for your class, rank, monthly performance, legacy, and progression across the Five Systems of Odyssey." },
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
        <OdysseyHeader />
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

const RANK_PALETTE: Record<string, { color: string; glow: string }> = {
  apprentice: { color: "#B8BFC7", glow: "#B8BFC760" },
  bronze:     { color: "#B87333", glow: "#B8733380" },
  silver:     { color: "#C7CBD1", glow: "#C7CBD180" },
  gold:       { color: "#D4A84B", glow: "#D4A84B90" },
  platinum:   { color: "#E5E4E2", glow: "#E5E4E280" },
  diamond:    { color: "#B9F2FF", glow: "#B9F2FF80" },
  black:      { color: "#1A1A1A", glow: "#D4A84B90" },
  mystical:   { color: "#C9A227", glow: "#C9A22790" },
  legend:     { color: "#FFF8E7", glow: "#F5D77FAA" },
};

function paletteFor(rankKey: string | null): { color: string; glow: string } {
  if (!rankKey) return { color: "#D4A84B", glow: "#D4A84B80" };
  const key = rankKey.toLowerCase();
  for (const [k, v] of Object.entries(RANK_PALETTE)) {
    if (key.includes(k)) return v;
  }
  return { color: "#D4A84B", glow: "#D4A84B80" };
}

function LinkedHome({ d }: { d: any }) {
  const { role } = useRole();
  const s = d.staff;
  const isShipbuilder = role === "director";
  const totals = d.totals ?? { stars: 0, moons: 0, suns: 0 };
  const latestGrade = d.grades?.[0]?.grade ?? "—";
  const rankKey  = s.current_rank_key ?? s.rpg?.rank_key ?? s.rank?.key ?? null;
  const rankName = rankLabel(rankKey) || s.rank?.name || d.evaluation?.current_rank_name || "Unranked";
  const rankIdent = rankIdentity(rankKey);
  const palette = paletteFor(rankKey);
  const rankColor = isShipbuilder ? "#D4A84B" : palette.color;
  const rankGlow  = isShipbuilder ? "#D4A84B90" : palette.glow;
  const gradeMeta = GRADE_META[latestGrade as Grade] ?? null;
  const initials = (s.name ?? "")
    .split(/\s+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("") || "—";
  const legacyTitle = isShipbuilder ? "The Shipbuilder" : (d.legacy?.currentTitle?.name ?? "Wanderer");

  const classKey = s.rpg?.primary_class ?? null;
  const roleKey  = s.rpg?.primary_role ?? null;
  const className   = classLabel(classKey);
  const roleName    = roleLabel(roleKey);
  const faction     = factionFor(classKey);
  const profession  = s.profession || s.job_title || roleName || "—";

  const goldOrHigher = /gold|platinum|diamond|black|mystical|legend|beyond/i.test(rankName);
  const secondaryUnlocked = goldOrHigher && Boolean(s.rpg?.secondary_class);

  return (
    <>
      {/* 1 · CHARACTER SHEET HERO — Celestial Dossier */}
      <section
        className="relative overflow-hidden border shadow-[0_0_50px_rgba(0,0,0,0.8)]"
        style={{
          background: "#0A0F1E",
          borderColor: "rgba(197,160,89,0.20)",
        }}
      >
        {/* Corner filigree */}
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute left-2 top-2 h-24 w-24 border-l-2 border-t-2" style={{ borderColor: "#C5A059" }} />
          <div className="absolute right-2 top-2 h-24 w-24 border-r-2 border-t-2" style={{ borderColor: "#C5A059" }} />
          <div className="absolute bottom-2 left-2 h-24 w-24 border-b-2 border-l-2" style={{ borderColor: "#C5A059" }} />
          <div className="absolute bottom-2 right-2 h-24 w-24 border-b-2 border-r-2" style={{ borderColor: "#C5A059" }} />
        </div>

        {/* Header — portrait, identity, tagline */}
        <div className="relative flex flex-col items-center px-6 pb-6 pt-10">
          {/* Portrait */}
          <div
            className="grid h-28 w-28 place-items-center rounded-full border-2 sm:h-32 sm:w-32"
            style={{
              borderColor: rankColor,
              background: "linear-gradient(to bottom, #1a1f35, #0A0F1E)",
              boxShadow: `0 0 40px ${rankGlow}, 0 0 20px ${rankGlow}`,
            }}
          >
            <span
              className="text-3xl font-bold tracking-widest sm:text-4xl"
              style={{ fontFamily: "'Cinzel', serif", color: rankColor }}
            >
              {isShipbuilder ? "⚓" : initials}
            </span>
          </div>

          {/* Identity */}
          <div className="mt-6 space-y-2 text-center">
            <p
              className="text-[10px] uppercase tracking-[0.3em]"
              style={{ color: "rgba(197,160,89,0.60)", fontFamily: "'Inter', sans-serif" }}
            >
              {legacyTitle}
            </p>
            <h1
              className="text-3xl uppercase tracking-wide sm:text-4xl"
              style={{
                color: "#E5E7EB",
                fontFamily: "'Cinzel', serif",
                textShadow: `0 0 30px ${rankGlow}`,
              }}
            >
              {s.name}
            </h1>
            <p
              className="text-sm font-semibold uppercase tracking-[0.2em]"
              style={{
                color: rankColor,
                fontFamily: "'Cinzel', serif",
                textShadow: `0 0 18px ${rankGlow}`,
              }}
            >
              {isShipbuilder ? "Beyond Rank" : rankName}
            </p>
            <p
              className="text-xs font-light uppercase tracking-[0.15em]"
              style={{ color: "#C5A059", fontFamily: "'Inter', sans-serif" }}
            >
              {profession}
              {faction && !isShipbuilder && <> &bull; {faction.label}</>}
            </p>
          </div>

          {/* Tagline */}
          <div
            className="mt-6 px-4 text-center text-sm font-light italic"
            style={{ color: "rgba(197,160,89,0.80)", fontFamily: "'Cormorant Garamond', serif" }}
          >
            {isShipbuilder ? "Charts the course. Builds the ship." : `"${rankIdent || "I Can Do It."}"`}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 px-8">
          <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(197,160,89,0.40), transparent)" }} />
          <div className="h-1.5 w-1.5 rotate-45 border" style={{ borderColor: "rgba(197,160,89,0.60)" }} />
          <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(197,160,89,0.40), transparent)" }} />
        </div>

        {/* Data panels */}
        <div className="space-y-8 px-6 py-8">
          {/* Character */}
          <section>
            <h3
              className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em]"
              style={{ color: "#C5A059", fontFamily: "'Inter', sans-serif" }}
            >
              <span className="h-1 w-1 rotate-45" style={{ background: "#C5A059" }} />
              Character Profile
            </h3>
            <div className="grid grid-cols-1 gap-y-3 border-l pl-3" style={{ borderColor: "rgba(197,160,89,0.20)" }}>
              <DossierRow label="Class"      value={className || "—"} />
              <DossierRow label="Rank"       value={rankName}         color={rankColor} />
              <DossierRow label="Profession" value={profession} />
            </div>
          </section>

          {/* Assignment */}
          <section>
            <h3
              className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em]"
              style={{ color: "#C5A059", fontFamily: "'Inter', sans-serif" }}
            >
              <span className="h-1 w-1 rotate-45" style={{ background: "#C5A059" }} />
              Active Assignment
            </h3>
            <div className="grid grid-cols-1 gap-y-3 border-l pl-3" style={{ borderColor: "rgba(197,160,89,0.20)" }}>
              <DossierRow label="Business Unit" value={s.business_unit || "—"} />
              <DossierRow label="Fleet"         value={s.location?.name || "—"} />
              <DossierRow
                label={isShipbuilder ? "Role" : "Manager"}
                value={isShipbuilder ? "Director · Beyond Rank" : (s.manager?.name ?? "Unassigned")}
              />
            </div>
          </section>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className="border p-4 text-center"
              style={{ background: "#141C2F", borderColor: "rgba(197,160,89,0.10)" }}
            >
              <p className="mb-2 text-[9px] uppercase tracking-[0.2em]" style={{ color: "#C5A059" }}>
                Monthly Perf.
              </p>
              <p className="text-2xl font-bold" style={{ color: gradeMeta?.color ?? "#E2E8F0", fontFamily: "'Cinzel', serif" }}>
                {latestGrade !== "—" ? `Grade ${latestGrade}` : "—"}
              </p>
            </div>
            <div
              className="border p-4 text-center"
              style={{ background: "#141C2F", borderColor: "rgba(197,160,89,0.10)" }}
            >
              <p className="mb-2 text-[9px] uppercase tracking-[0.2em]" style={{ color: "#C5A059" }}>
                Legacy
              </p>
              <p className="text-2xl font-bold" style={{ color: "#E2E8F0", fontFamily: "'Cinzel', serif" }}>
                {totals.stars}
                <span className="ml-1 text-sm" style={{ color: "#C5A059" }}>★</span>
              </p>
              <p className="mt-0.5 text-[10px]" style={{ color: "rgba(226,232,240,0.55)" }}>
                {totals.moons} Moons · {totals.suns} Suns
              </p>
            </div>
          </div>
        </div>

        {/* Footer badge */}
        <div className="flex justify-center pb-8">
          <div className="flex items-center gap-3 opacity-40">
            <div className="h-px w-8" style={{ background: "#C5A059" }} />
            <span className="text-[9px] font-light uppercase tracking-[0.4em]" style={{ color: "#C5A059" }}>
              Guild ID · {s.guild_id ?? "—"}
            </span>
            <div className="h-px w-8" style={{ background: "#C5A059" }} />
          </div>
        </div>
      </section>


      {/* Quick actions */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/profile" className="rounded-md border border-gold bg-gold/10 px-4 py-2 font-display text-[10px] uppercase tracking-widest text-gold hover:bg-gold/20">
          Open My Profile →
        </Link>
        <Link to="/claims" className="rounded-md border border-border px-4 py-2 font-display text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">
          Record a Voyage
        </Link>
      </div>

      {/* 2·3 · MONTHLY PERFORMANCE & LEGACY summary cards */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SummaryCard
          eyebrow="System 1"
          title="Monthly Performance"
          value={latestGrade !== "—" ? `Grade ${latestGrade}` : "No review"}
          valueColor={latestGrade !== "—" ? (gradeMeta?.color ?? "var(--color-gold)") : "var(--color-muted-foreground)"}
          sub={latestGrade !== "—" ? (gradeMeta?.label ?? "") : "Awaiting first monthly review"}
          linkTo="/performance"
          linkLabel="View Performance →"
        />
        <SummaryCard
          eyebrow="Lifetime"
          title="Legacy"
          value={`${totals.stars}★`}
          valueColor="var(--color-gold)"
          sub={`${totals.moons} Moons · ${totals.suns} Suns · ${legacyTitle}`}
          linkTo="/profile"
          linkLabel="View Legacy →"
        />
      </div>


      {/* 4 · CLASS — summary → /career */}
      <div className="mt-6">
        <SummaryCard
          eyebrow="System 1 · 2"
          title="Class"
          value={rankName}
          valueColor={rankColor}
          sub={
            (s.rpg?.primary_class ? classLabel(s.rpg.primary_class) : "Class") +
            (s.rpg?.primary_role ? ` · ${roleLabel(s.rpg.primary_role)}` : "")
          }
          linkTo="/career"
          linkLabel="Open Class →"
          wide
        />
      </div>

      {/* 5 · PROMOTION JOURNEY */}
      {!isShipbuilder && (
        <div className="mt-6">
          <PromotionProgress d={d} />
        </div>
      )}

      {/* 6 · SECONDARY CLASS */}
      <div className="mt-6">
        <SummaryCard
          eyebrow="System 3"
          title="Secondary Class"
          value={secondaryUnlocked ? classLabel(s.rpg.secondary_class) : "Locked"}
          valueColor={secondaryUnlocked ? "var(--color-gold)" : "var(--color-muted-foreground)"}
          sub={secondaryUnlocked ? "A second profession — its own performance & rank" : "Unlocks at Gold Rank"}
          linkTo="/secondary-class"
          linkLabel={secondaryUnlocked ? "Open Secondary Class →" : "View →"}
          wide
        />
      </div>

      {/* 7 · MENTORSHIP */}
      <div className="mt-6">
        <ComingSoonCard
          eyebrow="System 4"
          title="Mentorship"
          blurb="Guide others, track your students, and forge a mentorship legacy."
        />
      </div>

      {/* 8 · OWNERSHIP */}
      <div className="mt-6">
        <ComingSoonCard
          eyebrow="System 5"
          title="Ownership"
          blurb="Shares, investment, and decision rights — the deepest tier of the guild."
        />
      </div>
    </>
  );
}

function IdField({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`text-sm ${accent ? "text-gold" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function IdRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
      <div
        className="font-display text-base text-foreground sm:text-lg"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

function DossierRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span
        className="text-[11px] uppercase tracking-wider"
        style={{ color: "#94A3B8", fontFamily: "'Inter', sans-serif" }}
      >
        {label}
      </span>
      <span
        className="text-sm font-medium tracking-wide"
        style={{ color: color ?? "#E2E8F0", fontFamily: "'Inter', sans-serif" }}
      >
        {value}
      </span>
    </div>
  );
}

function MiniStat({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-md border border-border bg-ink/50 p-4 text-center">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1.5 font-display text-xl leading-tight sm:text-2xl" style={{ color }}>{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}


function SummaryCard({
  eyebrow, title, value, valueColor, sub, linkTo, linkLabel, wide,
}: {
  eyebrow: string;
  title: string;
  value: string;
  valueColor: string;
  sub: string;
  linkTo: string;
  linkLabel: string;
  wide?: boolean;
}) {
  return (
    <section className="rounded-xl border border-gold/25 bg-ink/40 p-6 sm:p-7">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-display text-[11px] uppercase tracking-[0.3em] text-gold">{title}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">{eyebrow}</div>
        </div>
      </div>
      <div className={`mt-5 ${wide ? "flex items-baseline gap-4" : ""}`}>
        <div className="font-display text-3xl leading-tight" style={{ color: valueColor }}>{value}</div>
        <div className={`text-xs text-muted-foreground ${wide ? "" : "mt-1"}`}>{sub}</div>
      </div>
      <Link
        to={linkTo}
        className="mt-5 inline-flex w-full items-center justify-center rounded-md border border-gold/40 bg-gold/10 px-4 py-2.5 text-[11px] uppercase tracking-widest text-gold transition hover:bg-gold/15"
      >
        {linkLabel}
      </Link>
    </section>
  );
}

function ComingSoonCard({ eyebrow, title, blurb }: { eyebrow: string; title: string; blurb: string }) {
  return (
    <section className="rounded-xl border border-border/70 bg-ink/30 p-6 sm:p-7">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-display text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{title}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground/70">{eyebrow}</div>
        </div>
        <span className="rounded-full border border-gold/30 bg-gold/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">
          Coming Soon
        </span>
      </div>
      <p className="mt-4 text-xs italic text-muted-foreground">{blurb}</p>
    </section>
  );
}

/* ----------------------------- Promotion Progress ----------------------------- */

function PromotionProgress({ d }: { d: any }) {
  const s = d.staff ?? {};
  const ev = d.evaluation ?? {};
  const primaryClass = s.rpg?.primary_class ?? null;
  const showAchievements = primaryClass === "ranger" || (s.role_family ?? "hunter") === "hunter";

  const nextRank = ev.next_rank_name ?? null;
  if (!nextRank) return null;

  const reviewsHave = Number(ev.a_grades ?? 0);
  const reviewsNeed = Number(ev.next_min_a_grades ?? 0);
  const reviewsDone = reviewsNeed ? reviewsHave >= reviewsNeed : true;

  const achHave = Number(ev.total_stars ?? 0);
  const achNeed = Number(ev.next_min_total_stars ?? 0);
  const achDone = achNeed ? achHave >= achNeed : true;

  const latestGrade = d.grades?.[0]?.grade ?? "—";
  const gradeDone = latestGrade === "A" || latestGrade === "B";

  const standingDone = true;

  const reqs: { label: string; done: boolean }[] = [
    { label: "Monthly Reviews", done: reviewsDone },
    { label: "Monthly Grade", done: gradeDone },
    { label: "Guild Standing", done: standingDone },
  ];
  if (showAchievements) reqs.push({ label: "Achievement", done: achDone });

  const completed = reqs.filter((r) => r.done).length;
  const total = reqs.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const currentRankKey = ev.current_rank_key ?? s.current_rank_key ?? null;
  const currentRankName = rankLabel(currentRankKey) || ev.current_rank_name || "Unranked";
  const nextRankKey = ev.next_rank_key ?? null;
  const nextRankName = rankLabel(nextRankKey) || ev.next_rank_name || nextRank;
  const currentRankGlyph = rankGlyph(currentRankKey);

  return (
    <section className="card-ornate-gold p-8 sm:p-10">
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Ascension</div>
        <h2 className="mt-2 font-display text-2xl text-foreground sm:text-3xl">Promotion Journey — {nextRankName}</h2>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm text-foreground">{currentRankGlyph} {currentRankName}</span>
          <span className="font-display text-sm text-gold">{nextRankName}</span>
        </div>
        <div className="relative mt-3 h-2 w-full overflow-visible rounded-full bg-ink/60">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-gold/60 to-gold"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-gold bg-background shadow-[0_0_12px_-2px_var(--color-gold)]"
            style={{ left: `${pct}%` }}
          >
            <span className="text-[10px]">⚓</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Requirements</p>
        <div className="mt-4 space-y-3">
          {reqs.map((req) => (
            <div
              key={req.label}
              className={`flex items-center gap-4 rounded-md border px-5 py-4 ${
                req.done ? "border-border/40" : "border-gold/25 bg-ink/40"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border font-display text-sm ${
                  req.done ? "border-gold/40 text-gold" : "border-border text-muted-foreground"
                }`}
              >
                {req.done ? "✓" : "□"}
              </span>
              <span className={`text-sm ${req.done ? "text-foreground/50" : "text-foreground"}`}>
                {req.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex items-center justify-center gap-3">
        <span className="font-display text-3xl text-gold">{completed}</span>
        <span className="text-lg text-muted-foreground">/</span>
        <span className="font-display text-3xl text-gold">{total}</span>
        <span className="ml-1 text-sm text-muted-foreground">Requirements Completed</span>
      </div>

      <div className="mt-6 text-center">
        <Link to="/career" className="text-[11px] uppercase tracking-widest text-gold hover:underline">
          Open Class for full progression →
        </Link>
      </div>
    </section>
  );
}

/* ----------------------------- Header ----------------------------- */

function OdysseyHeader() {
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
        <Link to="/career" className={navLink}>Class</Link>
        <Link to="/claims" className={navLink}>Harbor Records</Link>
        {(role === "manager" || role === "director") && <Link to="/manager" className={navLink}>Captain's Bridge</Link>}
        {role === "director" && <Link to="/fleet" className={navLink}>Fleet Overview</Link>}
        {can(role, "team.recommendPromotion") && <Link to="/promotions" className={navLink}>Voyage Progression</Link>}
        {can(role, "evaluations.write") && <Link to="/evaluations" className={navLink}>Voyage Review</Link>}

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
