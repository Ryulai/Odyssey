import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRole, ROLE_META, can, useAuth } from "@/lib/roles";
import { AuthGate } from "@/components/auth-gate";
import { getStaffDashboard } from "@/lib/workflow.functions";
import { classLabel, roleLabel, rankIdentity, rankGlyph, rankLabel, factionFor } from "@/lib/rpg";
import { GRADE_META, type Grade } from "@/lib/employee-data";

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

function LinkedHome({ d }: { d: any }) {
  const { role } = useRole();
  const s = d.staff;
  const isShipbuilder = role === "director";
  const totals = d.totals ?? { stars: 0, moons: 0, suns: 0 };
  const latestGrade = d.grades?.[0]?.grade ?? "—";
  const rankKey  = s.current_rank_key ?? s.rpg?.rank_key ?? s.rank?.key ?? null;
  const rankName = rankLabel(rankKey) || s.rank?.name || d.evaluation?.current_rank_name || "Unranked";
  const rankIdent = rankIdentity(rankKey);
  const rankGly   = rankGlyph(rankKey);
  const rankColor = isShipbuilder ? "var(--color-gold)" : (s.rank?.color ?? "var(--color-gold)");
  const gradeMeta = GRADE_META[latestGrade as Grade] ?? null;
  const initials = (s.name ?? "")
    .split(/\s+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("") || "—";
  const legacyTitle = isShipbuilder ? "The Shipbuilder" : (d.legacy?.currentTitle?.name ?? "Wanderer");

  const classKey = s.rpg?.primary_class ?? null;
  const roleKey  = s.rpg?.primary_role ?? null;
  const className   = classLabel(classKey);
  const roleName    = roleLabel(roleKey);
  const faction     = factionFor(classKey);
  // Page title combines Rank + Role (e.g. "Bronze Hunter"). Falls back to rank name only.
  const heroTitle = isShipbuilder
    ? "⚓ Beyond Rank"
    : `${rankGly ? rankGly + " " : ""}${rankName}${roleName ? " " + roleName : ""}`;

  // Secondary class unlocks at Gold; use current rank ordering from RPG data if available.
  const goldOrHigher = /gold|platinum|diamond|black|mystical|legend|beyond/i.test(rankName);
  const secondaryUnlocked = goldOrHigher && Boolean(s.rpg?.secondary_class);

  return (
    <>
      {/* 1 · PROFILE */}
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
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-[0.25em] text-gold">{legacyTitle}</div>
              <div className="font-display text-lg text-foreground/80">{s.name}</div>

              {/* Hero title = Rank + Class-role (e.g. "Bronze Hunter") */}
              <div className="mt-1 font-display text-3xl leading-tight text-foreground">
                {heroTitle}
              </div>
              {!isShipbuilder && rankIdent && (
                <div className="text-sm italic text-muted-foreground">"{rankIdent}"</div>
              )}
              {isShipbuilder && (
                <div className="text-sm italic text-gold/80">Charts the course. Builds the ship.</div>
              )}

              {/* Faction — small subtitle badge, never larger than Class */}
              {faction && !isShipbuilder && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-gold/90">
                  <span>{faction.glyph}</span>
                  <span>{faction.label}</span>
                </div>
              )}

              {/* Ordered identity fields: Profession · Class · Rank · Business Unit · Fleet · Manager */}
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <IdField label="Profession"    value={s.profession || s.job_title || roleName || "—"} />
                <IdField label="Class"         value={className || "—"} />
                <IdField label="Rank"          value={rankName} accent />
                <IdField label="Business Unit" value={s.business_unit || "—"} />
                {s.location?.name && <IdField label="Fleet" value={s.location.name} />}
                {!isShipbuilder ? (
                  <IdField label="Manager" value={s.manager?.name ?? "Unassigned"} />
                ) : (
                  <IdField label="Role" value="Director · Beyond Rank" accent />
                )}
              </div>

              <div className="mt-3">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50">Guild ID</div>
                <div className="font-mono text-[10px] tracking-wider text-muted-foreground/40">{s.guild_id ?? "—"}</div>
              </div>
            </div>
          </div>

          {/* Summary stats — Monthly Performance + Legacy */}
          <div className="grid flex-1 grid-cols-2 gap-3 sm:gap-4">
            <MiniStat
              label="Monthly Performance"
              value={latestGrade !== "—" ? `Grade ${latestGrade}` : "—"}
              sub={latestGrade !== "—" ? (gradeMeta?.label ?? "") : "No review yet"}
              color={latestGrade !== "—" ? (gradeMeta?.color ?? "var(--color-muted-foreground)") : "var(--color-muted-foreground)"}
            />
            <MiniStat
              label="Legacy"
              value={`${totals.stars}★`}
              sub={`${totals.moons}🌙 · ${totals.suns}☀️`}
              color="var(--color-gold)"
            />
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

function MiniStat({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-md border border-border bg-ink/50 p-3 text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg leading-tight" style={{ color }}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
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
  const currentRankName = ev.current_rank_name ?? "Unranked";
  const currentRankGlyph = rankGlyph(currentRankKey);

  return (
    <section className="card-ornate-gold p-8 sm:p-10">
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Ascension</div>
        <h2 className="mt-2 font-display text-2xl text-foreground sm:text-3xl">Promotion Journey — {nextRank}</h2>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm text-foreground">{currentRankGlyph} {currentRankName}</span>
          <span className="font-display text-sm text-gold">{nextRank}</span>
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
