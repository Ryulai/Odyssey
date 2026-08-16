import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { useRole, can } from "@/lib/roles";
import { listTeamPromotions } from "@/lib/workflow.functions";
import { getPromotionProgress, type PromotionProgress, type PromotionRequirement } from "@/lib/promotions.functions";

export const Route = createFileRoute("/promotions")({
  head: () => ({
    meta: [
      { title: "Promotion Progress — The Odyssey Guide" },
      { name: "description", content: "Automatic evaluation of your journey to the next Rank: requirements met, remaining, estimated readiness, and promotion history." },
      { property: "og:title", content: "Promotion Progress — The Odyssey Guide" },
      { property: "og:description", content: "The Odyssey Promotion Engine — transparent, requirement-driven advancement." },
    ],
  }),
  component: () => <AuthGate><PromotionsPage /></AuthGate>,
});

function PromotionsPage() {
  const { role } = useRole();
  const canTeam = can(role, "team.recommendPromotion") || can(role, "promotions.approve");
  const [tab, setTab] = useState<"me" | "team">("me");

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">Promotion Progress</div>
            <div className="text-xs text-muted-foreground">Automatic evaluation against the next Rank's requirements.</div>
          </div>
          <div className="flex items-center gap-2">
            {canTeam && (
              <div className="flex rounded-md border border-border overflow-hidden">
                <TabButton active={tab === "me"} onClick={() => setTab("me")}>My Progress</TabButton>
                <TabButton active={tab === "team"} onClick={() => setTab("team")}>Team</TabButton>
              </div>
            )}
            <Link to="/" className="rounded-md border border-border px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">← Home</Link>
          </div>
        </header>

        {tab === "me" ? <MyProgress /> : <TeamOverview />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-[10px] uppercase tracking-widest ${
        active ? "bg-gold/10 text-gold" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ------------------------------ My Progress ---------------------------------

function MyProgress() {
  const { data, isLoading } = useQuery({
    queryKey: ["promotion-progress", "me"],
    queryFn: () => getPromotionProgress({ data: {} }),
  });

  if (isLoading) return <SkeletonBox>Charting your ascent…</SkeletonBox>;
  if (!data?.staff) {
    return (
      <div className="rounded-xl border border-gold/25 bg-ink/40 p-10 text-center text-sm text-muted-foreground">
        Your account isn't linked to a Hunter profile yet. Ask a Director to add you to the crew manifest.
      </div>
    );
  }

  const p = data as PromotionProgress;

  return (
    <div className="space-y-6">
      <HeroCard p={p} />

      <div className="grid gap-6 lg:grid-cols-3">
        <SignalCard eyebrow="Snapshot" title="Performance Signals">
          <SignalRow label="Overall (3-mo avg)" value={p.scores.overall_avg_3mo !== null ? `${p.scores.overall_avg_3mo}` : "—"} sub={`min ${OVERALL_MIN}`} />
          <SignalRow label="Latest Grade" value={p.scores.latest_grade ?? "—"} sub="A or B qualifies" />
          <SignalRow label="Qualifying (last 3 mo)" value={`${p.scores.qualifying_last3}`} sub="A/B months" />
          <SignalRow label="Approved Claims" value={`${p.scores.approved_claims}`} sub="mission wins" />
        </SignalCard>

        <SignalCard eyebrow="Legacy" title="Cumulative Totals">
          <SignalRow label="Achievement Stars" value={`${p.totals.total_stars}`} />
          <SignalRow label="Unique Achievements" value={`${p.totals.unique_achievements}`} />
          <SignalRow label="A Grades" value={`${p.totals.a_grades}`} />
          <SignalRow label="B Grades" value={`${p.totals.b_grades}`} />
        </SignalCard>

        <SignalCard eyebrow="Estimated" title="Readiness">
          <div className="flex items-baseline gap-3">
            <span
              className="font-display text-4xl"
              style={{ color: readinessColor(p.readiness.tone) }}
            >
              {p.readiness.label}
            </span>
            {p.readiness.eta_months !== null && (
              <span className="text-xs text-muted-foreground">
                {p.readiness.eta_months === 0 ? "now" : `~${p.readiness.eta_months} mo`}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{p.readiness.note}</p>
          {p.days_in_rank !== null && (
            <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              {p.days_in_rank} day{p.days_in_rank === 1 ? "" : "s"} in current rank
            </p>
          )}
        </SignalCard>
      </div>

      {p.criteria_defined ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <RequirementList
            eyebrow="Ahead"
            title={`Remaining · ${p.remaining.length}`}
            items={p.remaining}
            empty="All requirements met. Awaiting Director approval."
          />
          <RequirementList
            eyebrow="Behind you"
            title={`Completed · ${p.completed.length}`}
            items={p.completed}
            empty="No requirements completed yet — start with next month's review."
            muted
          />
        </div>
      ) : p.next_rank_key ? (
        <ComingSoonCard nextRank={p.next_rank_name ?? p.next_rank_key} />
      ) : null}

      <PerformanceHistoryCard months={p.performance_history} />

      <HistoryCard history={p.history} />
    </div>
  );
}

// Ranking V1: criteria are confirmed only up to Gold.
function ComingSoonCard({ nextRank }: { nextRank: string }) {
  return (
    <section className="rounded-xl border border-gold/25 bg-ink/40 p-6 text-center sm:p-8">
      <div className="font-display text-[11px] uppercase tracking-[0.3em] text-gold">
        Future Rank Requirements — Coming Soon
      </div>
      <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
        The requirements for <span className="text-foreground">{nextRank}</span> are not defined yet.
        Gold and above are still being designed — keep building Performance history in the meantime;
        it will always be an input into long-term growth.
      </p>
      <div className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground">
        Known today: Bronze → Silver · Silver → Gold
      </div>
    </section>
  );
}

function PerformanceHistoryCard({ months }: { months: PromotionProgress["performance_history"] }) {
  return (
    <section className="rounded-xl border border-gold/20 bg-ink/40 p-5 sm:p-6">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="font-display text-[11px] uppercase tracking-[0.3em] text-gold">Performance History</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Input into Ranking — never the Rank itself
          </div>
        </div>
        <Link to="/performance" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-gold">
          Performance System →
        </Link>
      </div>
      {months.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No monthly reviews recorded yet. Your first sealed review will appear here.
        </p>
      ) : (
        <ul className="space-y-2">
          {months.map((m) => (
            <li key={m.month} className="flex items-center justify-between rounded-md border border-border/60 bg-ink/40 px-3 py-2">
              <div className="text-sm text-foreground">
                {new Date(m.month).toLocaleDateString(undefined, { year: "numeric", month: "long" })}
              </div>
              <div className="flex items-center gap-4 tabular-nums">
                <span className="text-xs text-muted-foreground">{m.score !== null ? Math.round(m.score) : "—"} / 100</span>
                <span className="font-display text-lg text-gold">{m.grade ?? "—"}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const OVERALL_MIN = 70;

function HeroCard({ p }: { p: PromotionProgress }) {
  const hasNext = Boolean(p.next_rank_key);
  return (
    <section className="rounded-xl border border-gold/25 bg-gradient-to-br from-ink/60 via-ink/40 to-black/60 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-display text-[10px] uppercase tracking-[0.3em] text-gold">
            {p.staff?.name}
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="font-display text-3xl text-foreground">{p.current_rank_name ?? "Unranked"}</span>
            {hasNext && (
              <>
                <span className="text-muted-foreground">→</span>
                <span className="font-display text-3xl text-gold">{p.next_rank_name}</span>
              </>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {hasNext
              ? "The Promotion Engine evaluates every requirement automatically after each monthly review."
              : "You've reached the highest recognised Rank. New horizons open beyond."}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Progress</div>
          <div className="font-display text-4xl text-gold">{p.percent}%</div>
          {p.eligible && (
            <span className="mt-2 inline-block rounded border border-emerald-400/50 bg-emerald-400/10 px-2 py-0.5 font-display text-[10px] uppercase tracking-widest text-emerald-300">
              Eligible for Promotion
            </span>
          )}
        </div>
      </div>
      {hasNext && (
        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-ink/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold transition-all"
            style={{ width: `${p.percent}%` }}
          />
        </div>
      )}
    </section>
  );
}

function RequirementList({
  eyebrow,
  title,
  items,
  empty,
  muted,
}: {
  eyebrow: string;
  title: string;
  items: PromotionRequirement[];
  empty: string;
  muted?: boolean;
}) {
  return (
    <section className="rounded-xl border border-gold/20 bg-ink/40 p-5 sm:p-6">
      <div className="mb-3">
        <div className="font-display text-[11px] uppercase tracking-[0.3em] text-gold">{title}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{eyebrow}</div>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((r) => (
            <li
              key={r.key}
              className={`rounded-md border px-3 py-2 ${
                r.done
                  ? "border-emerald-400/30 bg-emerald-500/5"
                  : r.mandatory
                  ? "border-amber-400/30 bg-amber-500/5"
                  : "border-border/60 bg-ink/40"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-md border text-xs ${
                      r.done
                        ? "border-emerald-400/50 text-emerald-300"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {r.done ? "✓" : "○"}
                  </span>
                  <div>
                    <div className={`text-sm ${muted ? "text-foreground/70" : "text-foreground"}`}>
                      {r.label}
                      {r.mandatory && !r.done && (
                        <span className="ml-2 text-[9px] uppercase tracking-widest text-amber-300">Mandatory</span>
                      )}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.detail}</div>
                  </div>
                </div>
                <div className="text-right tabular-nums text-xs">
                  <div className={r.done ? "text-emerald-300" : "text-foreground"}>{r.have}</div>
                  <div className="text-[10px] text-muted-foreground">need {r.need}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function HistoryCard({ history }: { history: PromotionProgress["history"] }) {
  return (
    <section className="rounded-xl border border-gold/20 bg-ink/40 p-5 sm:p-6">
      <div className="mb-3">
        <div className="font-display text-[11px] uppercase tracking-[0.3em] text-gold">Promotion History</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Journey so far</div>
      </div>
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No promotions recorded yet. Your first advancement will appear here the moment a Director confirms it.
        </p>
      ) : (
        <ol className="space-y-2">
          {history.map((h, i) => (
            <li key={`${h.to_rank_key}-${i}`} className="flex items-center justify-between rounded-md border border-border/60 bg-ink/40 px-3 py-2">
              <div>
                <div className="text-sm text-foreground">
                  {h.from_rank_name ?? "Origin"} <span className="text-muted-foreground">→</span> <span className="text-gold">{h.to_rank_name}</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {new Date(h.promoted_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })} · {h.source}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

// ------------------------------ Team ---------------------------------

function TeamOverview() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["team-promotions"],
    queryFn: () => listTeamPromotions(),
  });

  if (isLoading) return <SkeletonBox>Evaluating…</SkeletonBox>;

  return (
    <section className="rounded-md border border-border bg-ink/30 p-3">
      <table className="w-full text-sm">
        <thead className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
          <tr className="border-b border-border">
            <th className="px-2 py-2">Hunter</th>
            <th className="px-2 py-2">Current</th>
            <th className="px-2 py-2">Next</th>
            <th className="px-2 py-2 text-right">★</th>
            <th className="px-2 py-2 text-right">A</th>
            <th className="px-2 py-2 text-right">B</th>
            <th className="px-2 py-2 text-right">Ach</th>
            <th className="px-2 py-2 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map(({ staff, evaluation }: any) => {
            const ev = evaluation;
            return (
              <tr key={staff.id} className="border-b border-border/40">
                <td className="px-2 py-2">
                  <div>{staff.name}</div>
                  <div className="text-[10px] text-muted-foreground">{staff.role}</div>
                </td>
                <td className="px-2 py-2 text-muted-foreground">{ev?.current_rank_name ?? "—"}</td>
                <td className="px-2 py-2">{ev?.next_rank_name ?? "Max"}</td>
                <td className="px-2 py-2 text-right">{ev?.total_stars ?? 0}{ev?.next_min_total_stars ? ` / ${ev.next_min_total_stars}` : ""}</td>
                <td className="px-2 py-2 text-right">{ev?.a_grades ?? 0}{ev?.next_min_a_grades ? ` / ${ev.next_min_a_grades}` : ""}</td>
                <td className="px-2 py-2 text-right">{ev?.b_grades ?? 0}{ev?.next_min_b_grades ? ` / ${ev.next_min_b_grades}` : ""}</td>
                <td className="px-2 py-2 text-right">{ev?.unique_achievements ?? 0}{ev?.next_min_achievements ? ` / ${ev.next_min_achievements}` : ""}</td>
                <td className="px-2 py-2 text-center">
                  {ev?.eligible ? (
                    <span className="rounded border border-emerald-400/50 bg-emerald-400/10 px-2 py-0.5 font-display text-[10px] uppercase tracking-widest text-emerald-300">Eligible</span>
                  ) : ev?.next_rank_key ? (
                    <span className="rounded border border-border px-2 py-0.5 font-display text-[10px] uppercase tracking-widest text-muted-foreground">Building</span>
                  ) : (
                    <span className="rounded border border-gold/40 px-2 py-0.5 font-display text-[10px] uppercase tracking-widest text-gold">Max</span>
                  )}
                </td>
              </tr>
            );
          })}
          {!data.length && <tr><td colSpan={8} className="py-6 text-center text-xs text-muted-foreground">No Hunters in the fleet yet.</td></tr>}
        </tbody>
      </table>
    </section>
  );
}

// ------------------------------ Primitives ---------------------------------

function SignalCard({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gold/20 bg-ink/40 p-5 sm:p-6">
      <div className="mb-3">
        <div className="font-display text-[11px] uppercase tracking-[0.3em] text-gold">{title}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{eyebrow}</div>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SignalRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <div>
        <div className="text-sm text-foreground">{label}</div>
        {sub && <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{sub}</div>}
      </div>
      <div className="font-display text-lg text-gold tabular-nums">{value}</div>
    </div>
  );
}

function SkeletonBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-ink/30 p-12 text-center text-xs uppercase tracking-widest text-muted-foreground">
      {children}
    </div>
  );
}

function readinessColor(tone: "ok" | "warn" | "info" | "gold") {
  switch (tone) {
    case "ok": return "rgb(110, 231, 183)";
    case "warn": return "rgb(252, 211, 77)";
    case "gold": return "var(--color-gold, gold)";
    default: return "var(--color-foreground)";
  }
}
