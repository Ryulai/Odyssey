import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { getSeasonAchievements, type SeasonAchievement } from "@/lib/achievements.functions";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements · Season One — The Odyssey Guide" },
      { name: "description", content: "The eight Season One Achievements: eight abilities, eight trials, and the stars you have earned along the way." },
      { property: "og:title", content: "Achievements · Season One — The Odyssey Guide" },
      { property: "og:description", content: "Eight abilities, eight trials. Track your Odyssey Season One achievement stars." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthGate><AchievementsPage /></AuthGate>,
});

const STATUS_META: Record<SeasonAchievement["status"], { label: string; cls: string }> = {
  unlocked: { label: "Unlocked", cls: "border-gold/50 bg-gold/10 text-gold" },
  in_progress: { label: "In Progress", cls: "border-amber-400/40 bg-amber-500/10 text-amber-200" },
  locked: { label: "Locked", cls: "border-border bg-ink/50 text-muted-foreground" },
};

function AchievementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["achievements", "season"],
    queryFn: () => getSeasonAchievements(),
  });

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">Achievements</div>
            <div className="text-xs text-muted-foreground">Season One · eight abilities, eight trials.</div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/claims" className="rounded-md border border-gold/30 bg-gold/5 px-3 py-2 text-[10px] uppercase tracking-widest text-gold hover:bg-gold/15">
              Submit a Claim →
            </Link>
            <Link to="/" className="rounded-md border border-border px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">
              ← Home
            </Link>
          </div>
        </header>

        <section className="mb-6 rounded-xl border border-gold/25 bg-gradient-to-br from-ink/60 via-ink/40 to-black/60 p-6">
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Achievements are not targets and not part of your Performance Grade or Rank calculation. Each Trial you
            complete proves an ability — who you are becoming, not what you sold this month.
          </p>
          <div className="mt-4 flex flex-wrap gap-6">
            <Stat label="Season" value={data?.season ?? "S1"} />
            <Stat label="Stars Earned" value={`★ ${data?.total_stars ?? 0}`} />
            <Stat label="Achievements Unlocked" value={`${data?.unlocked ?? 0} / ${data?.items.length ?? 8}`} />
          </div>
        </section>

        {isLoading ? (
          <div className="rounded-xl border border-border bg-ink/30 p-12 text-center text-xs uppercase tracking-widest text-muted-foreground">
            Opening the ledger…
          </div>
        ) : !data?.items.length ? (
          <div className="rounded-xl border border-border bg-ink/30 p-12 text-center text-sm text-muted-foreground">
            No Season One achievements are published yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.items.map((a) => (
              <AchievementCard key={a.id} a={a} />
            ))}
          </div>
        )}

        <section className="mt-8 rounded-xl border border-gold/20 bg-ink/40 p-5">
          <div className="font-display text-[11px] uppercase tracking-[0.3em] text-gold">Achievement History</div>
          <div className="mt-3">
            <HistoryList items={data?.items ?? []} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-2xl text-gold">{value}</div>
    </div>
  );
}

function AchievementCard({ a }: { a: SeasonAchievement }) {
  const meta = STATUS_META[a.status];
  const cap = a.max_per_season;
  const pct = cap ? Math.min(100, Math.round((a.earned_stars / cap) * 100)) : a.earned_stars > 0 ? 100 : 0;

  return (
    <article className={`rounded-xl border p-5 ${a.status === "unlocked" ? "border-gold/40 bg-gold/[0.04]" : "border-border/70 bg-ink/40"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden>{a.icon}</span>
          <div>
            <h2 className="font-display text-base uppercase tracking-wide text-foreground">{a.name}</h2>
            <div className="text-[11px] uppercase tracking-widest text-gold">
              {a.ability}{a.ability_zh ? ` · ${a.ability_zh}` : ""}
            </div>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] uppercase tracking-widest ${meta.cls}`}>
          {meta.label}
        </span>
      </div>

      <dl className="mt-4 space-y-2 text-xs">
        <Row term="Trial" desc={a.requirement} />
        <Row term="Reward" desc={`⭐ x${a.star_reward}`} />
        <Row term="Repeatable" desc={a.repeat_rule || "—"} />
        {a.approval_required && <Row term="Approval" desc="Council approval required" />}
      </dl>

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-[11px] text-muted-foreground">
          <span>Progress this season</span>
          <span className="tabular-nums text-foreground">
            ★ {a.earned_stars}{cap ? ` / ${cap}` : " · unlimited"}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/60">
          <div className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold" style={{ width: `${pct}%` }} />
        </div>
        {a.pending_claims > 0 && (
          <div className="mt-2 text-[11px] text-amber-200">
            {a.pending_claims} claim{a.pending_claims > 1 ? "s" : ""} awaiting review.
          </div>
        )}
      </div>
    </article>
  );
}

function Row({ term, desc }: { term: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-[10px] uppercase tracking-widest text-muted-foreground">{term}</dt>
      <dd className="text-foreground/90">{desc}</dd>
    </div>
  );
}

function HistoryList({ items }: { items: SeasonAchievement[] }) {
  const rows = items
    .flatMap((a) => a.history.map((h) => ({ ...h, name: a.name, icon: a.icon })))
    .sort((x, y) => (x.awarded_at < y.awarded_at ? 1 : -1));

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No stars earned yet. Complete a Trial to begin your record.</p>;
  }
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between rounded-md border border-border/60 bg-ink/40 px-3 py-2">
          <div className="flex items-center gap-3">
            <span aria-hidden>{r.icon}</span>
            <div>
              <div className="text-sm text-foreground">{r.name}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {r.period || new Date(r.awarded_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <span className="font-display text-gold">+{r.stars}★</span>
        </li>
      ))}
    </ul>
  );
}
