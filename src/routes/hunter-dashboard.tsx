import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { getStaffDashboard } from "@/lib/workflow.functions";
import { getMyTeamScope } from "@/lib/team-preview.functions";
import { classLabel, roleLabel, rankLabel } from "@/lib/rpg";
import { GRADE_META, type Grade } from "@/lib/employee-data";

/** Shown only when the signed-in user has at least one direct report. */
function TeamPreviewActions() {
  const { data } = useQuery({ queryKey: ["team-scope"], queryFn: () => getMyTeamScope() });
  if (!data?.has_direct_reports) return null;
  return (
    <>
      <Link
        to="/team-preview"
        className="flex items-center justify-between rounded-md border border-gold/30 bg-gold/5 px-3 py-2 text-xs text-gold hover:border-gold/60"
      >
        <span>Preview Achievement ({data.reports.length} reports)</span>
        <span>→</span>
      </Link>
      <Link
        to="/team-preview"
        className="flex items-center justify-between rounded-md border border-gold/30 bg-gold/5 px-3 py-2 text-xs text-gold hover:border-gold/60"
      >
        <span>Preview Performance Review</span>
        <span>→</span>
      </Link>
    </>
  );
}


export const Route = createFileRoute("/hunter-dashboard")({
  head: () => ({
    meta: [
      { title: "Hunter Dashboard — The Odyssey Guide" },
      { name: "description", content: "Your daily home: today's mission, current performance, rank, promotion progress, achievements, mentor, secondary class, and quick actions." },
      { property: "og:title", content: "Hunter Dashboard — The Odyssey Guide" },
      { property: "og:description", content: "The employee's daily operating home inside Odyssey." },
    ],
  }),
  component: () => <AuthGate><HunterDashboard /></AuthGate>,
});

const MOTIVATIONS = [
  "Every shift is a chapter. Write it well.",
  "Small wins today. Legendary rank tomorrow.",
  "Discipline is the shortest promotion path.",
  "Serve one guest better than yesterday.",
  "Rank is earned in the quiet hours.",
  "A Hunter shows up before the mission asks.",
  "Consistency beats intensity.",
];

function dailyMotivation() {
  const day = Math.floor(Date.now() / 86_400_000);
  return MOTIVATIONS[day % MOTIVATIONS.length];
}

function HunterDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "me", "hunter-home"],
    queryFn: () => getStaffDashboard({ data: {} }),
  });

  const motivation = useMemo(dailyMotivation, []);

  if (isLoading) {
    return <Shell><SkeletonBlock /></Shell>;
  }
  if (!data?.staff) {
    return (
      <Shell>
        <div className="rounded-xl border border-gold/30 bg-ink/40 p-10 text-center text-sm text-muted-foreground">
          Your account isn't linked to a Hunter profile yet. Ask a Director to add you to the crew manifest.
        </div>
      </Shell>
    );
  }

  const s: any = data.staff;
  const totals = data.totals ?? { stars: 0, moons: 0, suns: 0 };
  const ev: any = data.evaluation ?? {};
  const latestGrade = (data.grades?.[0]?.grade ?? "—") as Grade | "—";
  const latestMonth = data.grades?.[0]?.month ?? null;
  const gradeMeta = latestGrade !== "—" ? GRADE_META[latestGrade as Grade] : null;

  const rankKey = s.current_rank_key ?? s.rpg?.rank_key ?? null;
  const rankName = rankLabel(rankKey) || "Unranked";
  const nextRankName = ev.next_rank_name ? rankLabel(ev.next_rank_key) || ev.next_rank_name : null;

  // Promotion progress (mirrors PromotionProgress logic, simplified)
  const reviewsHave = Number(ev.a_grades ?? 0);
  const reviewsNeed = Number(ev.next_min_a_grades ?? 0);
  const reviewsDone = reviewsNeed ? reviewsHave >= reviewsNeed : true;
  const achHave = Number(ev.total_stars ?? totals.stars ?? 0);
  const achNeed = Number(ev.next_min_total_stars ?? 0);
  const achDone = achNeed ? achHave >= achNeed : true;
  const gradeDone = latestGrade === "A" || latestGrade === "B";
  const reqs = nextRankName
    ? [
        { label: "Monthly Reviews", have: reviewsHave, need: reviewsNeed, done: reviewsDone },
        { label: "Monthly Grade", have: gradeDone ? 1 : 0, need: 1, done: gradeDone },
        { label: "Achievement Stars", have: achHave, need: achNeed, done: achDone },
      ]
    : [];
  const pct = reqs.length
    ? Math.round((reqs.filter((r) => r.done).length / reqs.length) * 100)
    : 100;

  const classKey = s.rpg?.primary_class ?? null;
  const roleKey = s.rpg?.primary_role ?? null;
  const secondaryClass = s.rpg?.secondary_class ?? null;
  const secondaryRole = s.rpg?.secondary_role ?? null;
  const goldOrHigher = /gold|platinum|diamond|black|mystical|legend|beyond/i.test(rankName);
  const secondaryUnlocked = goldOrHigher && Boolean(secondaryClass);

  const recentAchievements = (data.records ?? []).slice(0, 4) as any[];
  const pendingClaims = data.claims?.pending ?? 0;

  const notifications: { tone: "info" | "warn" | "ok"; text: string; to?: string }[] = [];
  if (!latestMonth) notifications.push({ tone: "warn", text: "You have no Monthly Review recorded yet.", to: "/performance" });
  if (pendingClaims > 0) notifications.push({ tone: "info", text: `${pendingClaims} achievement claim${pendingClaims > 1 ? "s" : ""} pending review.`, to: "/claims" });
  if (nextRankName && pct >= 66) notifications.push({ tone: "ok", text: `You're close to ${nextRankName}. Keep pushing.`, to: "/promotions" });
  if (notifications.length === 0) notifications.push({ tone: "info", text: "All clear. No pending actions today." });

  const firstName = (s.name ?? "").split(/\s+/)[0] || "Hunter";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <Shell>
      {/* Hero: greeting + daily motivation */}
      <section className="mb-6 rounded-xl border border-gold/25 bg-gradient-to-br from-ink/60 via-ink/40 to-black/60 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.3em] text-gold">Hunter Dashboard</div>
            <h1 className="mt-1 font-display text-2xl text-foreground sm:text-3xl">
              {greeting}, {firstName}.
            </h1>
            <p className="mt-2 max-w-xl text-sm italic text-muted-foreground">"{motivation}"</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Today</div>
            <div className="font-display text-lg text-gold">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Mission */}
        <Card eyebrow="Today" title="Today's Mission" className="lg:col-span-2">
          <MissionList
            items={[
              { label: "Log Daily Sales", to: "/daily-sales-claim", done: false },
              { label: "Review your latest grade", to: "/performance", done: latestGrade !== "—" },
              { label: "Claim an Achievement", to: "/claims", done: false },
            ]}
          />
        </Card>

        {/* Daily Motivation compact */}
        <Card eyebrow="Compass" title="Daily Focus">
          <div className="flex h-full flex-col justify-between gap-4">
            <p className="font-display text-base leading-relaxed text-foreground">{motivation}</p>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Chart your journey.</div>
          </div>
        </Card>

        {/* Current Performance */}
        <Card eyebrow="This Month" title="Current Performance">
          <div className="flex items-baseline gap-3">
            <span
              className="font-display text-4xl"
              style={{ color: gradeMeta?.color ?? "var(--color-muted-foreground)" }}
            >
              {latestGrade !== "—" ? `Grade ${latestGrade}` : "—"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {latestGrade !== "—" ? `${gradeMeta?.label ?? ""}${latestMonth ? ` · ${latestMonth}` : ""}` : "No review recorded yet"}
          </p>
          <Link to="/performance" className="mt-4 inline-block text-[11px] uppercase tracking-widest text-gold hover:underline">
            View Performance →
          </Link>
        </Card>

        {/* Current Rank */}
        <Card eyebrow="Standing" title="Current Rank">
          <div className="font-display text-3xl text-gold">{rankName}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {classLabel(classKey) || "Class"}{roleKey ? ` · ${roleLabel(roleKey)}` : ""}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span>★ {totals.stars}</span>
            <span>· {totals.moons} Moons</span>
            <span>· {totals.suns} Suns</span>
          </div>
        </Card>

        {/* Promotion Progress */}
        <Card eyebrow="Ascension" title="Promotion Progress">
          {nextRankName ? (
            <>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">{rankName}</span>
                <span className="font-display text-gold">{nextRankName}</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink/60">
                <div className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                {reqs.map((r) => (
                  <div key={r.label} className="flex justify-between">
                    <span className={r.done ? "text-foreground/60" : "text-foreground"}>
                      {r.done ? "✓" : "○"} {r.label}
                    </span>
                    <span className="tabular-nums">{r.have}{r.need ? ` / ${r.need}` : ""}</span>
                  </div>
                ))}
              </div>
              <Link to="/promotions" className="mt-4 inline-block text-[11px] uppercase tracking-widest text-gold hover:underline">
                Promotion Journey →
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">You've reached the top of the ladder. New horizons open beyond.</p>
          )}
        </Card>

        {/* Recent Achievements */}
        <Card eyebrow="Legacy" title="Recent Achievements" className="lg:col-span-2">
          {recentAchievements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No achievements recorded yet. Claim your first one to start your legacy.</p>
          ) : (
            <ul className="space-y-2">
              {recentAchievements.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-md border border-border/60 bg-ink/40 px-3 py-2">
                  <div>
                    <div className="text-sm text-foreground">{r.achievement?.name ?? "Achievement"}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.period ?? ""}</div>
                  </div>
                  <span className="font-display text-gold">+{r.stars ?? r.achievement?.star_reward ?? 1}★</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/claims" className="mt-4 inline-block text-[11px] uppercase tracking-widest text-gold hover:underline">
            All Achievements →
          </Link>
        </Card>

        {/* Mentor Status */}
        <Card eyebrow="System 4" title="Mentor Status">
          {s.manager?.name ? (
            <>
              <div className="font-display text-lg text-foreground">{s.manager.name}</div>
              <p className="mt-1 text-xs text-muted-foreground">{s.manager.role || "Your captain"}</p>
              <p className="mt-3 text-xs text-muted-foreground italic">Mentorship system launches soon — your growth partner is already assigned.</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No mentor assigned yet. A Captain will pair with you soon.</p>
          )}
        </Card>

        {/* Secondary Class */}
        <Card eyebrow="System 3" title="Secondary Class">
          {secondaryUnlocked ? (
            <>
              <div className="font-display text-lg text-gold">{classLabel(secondaryClass)}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {secondaryRole ? roleLabel(secondaryRole) : "Second profession active"}
              </p>
              <Link to="/secondary-class" className="mt-4 inline-block text-[11px] uppercase tracking-widest text-gold hover:underline">
                Open Secondary Class →
              </Link>
            </>
          ) : (
            <>
              <div className="font-display text-lg text-muted-foreground">Locked</div>
              <p className="mt-1 text-xs text-muted-foreground">Unlocks at Gold Rank.</p>
            </>
          )}
        </Card>

        {/* Notifications */}
        <Card eyebrow="Signals" title="Notifications" className="lg:col-span-2">
          <ul className="space-y-2">
            {notifications.map((n, i) => (
              <li
                key={i}
                className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                  n.tone === "warn"
                    ? "border-amber-400/40 bg-amber-500/5 text-amber-100"
                    : n.tone === "ok"
                    ? "border-emerald-400/40 bg-emerald-500/5 text-emerald-100"
                    : "border-border/60 bg-ink/40 text-foreground"
                }`}
              >
                <span>{n.text}</span>
                {n.to && (
                  <Link to={n.to} className="text-[10px] uppercase tracking-widest text-gold hover:underline">
                    Open →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Card>

        {/* Quick Actions */}
        <Card eyebrow="Actions" title="Quick Actions">
          <div className="grid grid-cols-1 gap-2">
            <QuickLink to="/daily-sales-claim" label="Log Daily Sales" />
            <QuickLink to="/claims" label="Submit Achievement" />
            <QuickLink to="/performance" label="View Performance" />
            <QuickLink to="/profile" label="Open My Profile" />
            <TeamPreviewActions />
          </div>
        </Card>

      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">Hunter Dashboard</div>
            <div className="text-xs text-muted-foreground">Your daily home in Odyssey.</div>
          </div>
          <Link to="/" className="rounded-md border border-border px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">
            ← Home
          </Link>
        </header>
        {children}
      </div>
    </div>
  );
}

function Card({ eyebrow, title, children, className }: { eyebrow: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-gold/20 bg-ink/40 p-5 sm:p-6 ${className ?? ""}`}>
      <div className="mb-3">
        <div className="font-display text-[11px] uppercase tracking-[0.3em] text-gold">{title}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{eyebrow}</div>
      </div>
      {children}
    </section>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-md border border-gold/30 bg-gold/5 px-3 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold/15"
    >
      <span>{label}</span>
      <span>→</span>
    </Link>
  );
}

function MissionList({ items }: { items: { label: string; to: string; done: boolean }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.label} className="flex items-center justify-between rounded-md border border-border/60 bg-ink/40 px-3 py-2">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-md border text-xs ${
                it.done ? "border-gold/40 text-gold" : "border-border text-muted-foreground"
              }`}
            >
              {it.done ? "✓" : "○"}
            </span>
            <span className={`text-sm ${it.done ? "text-foreground/60 line-through" : "text-foreground"}`}>{it.label}</span>
          </div>
          <Link to={it.to} className="text-[10px] uppercase tracking-widest text-gold hover:underline">
            Open →
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SkeletonBlock() {
  return (
    <div className="rounded-xl border border-border bg-ink/30 p-12 text-center text-xs uppercase tracking-widest text-muted-foreground">
      Charting your day…
    </div>
  );
}
