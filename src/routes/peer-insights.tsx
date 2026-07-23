import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { getPeerInsights, type PeerRow } from "@/lib/peers.functions";
import { rankLabel } from "@/lib/rpg";

export const Route = createFileRoute("/peer-insights")({
  head: () => ({
    meta: [
      { title: "Peer Insights — The Odyssey Guide" },
      { name: "description", content: "See how Hunters of your rank in your fleet are performing this month. Learn from strengths, celebrate progress." },
      { property: "og:title", content: "Peer Insights — The Odyssey Guide" },
      { property: "og:description", content: "A transparent, learning-first view of peer performance for the current month." },
    ],
  }),
  component: () => <AuthGate><PeerInsights /></AuthGate>,
});

type SortKey = "overall" | "A" | "B" | "C" | "D";

const CATEGORY_META: Record<"A" | "B" | "C" | "D", { label: string; hint: string; color: string }> = {
  A: { label: "Behaviour",    hint: "Discipline & presence",  color: "text-emerald-300" },
  B: { label: "Direction",    hint: "KPI alignment",           color: "text-sky-300" },
  C: { label: "Contribution", hint: "Achievements & effort",   color: "text-amber-300" },
  D: { label: "Result",       hint: "Sales outcome",           color: "text-rose-300" },
};

function monthLabel(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
}

function TrendGlyph({ trend }: { trend: PeerRow["trend"] }) {
  if (trend === "up")   return <span className="text-emerald-300">▲</span>;
  if (trend === "down") return <span className="text-rose-300">▼</span>;
  if (trend === "new")  return <span className="text-muted-foreground">•</span>;
  return <span className="text-muted-foreground">–</span>;
}

function PeerInsights() {
  const { data, isLoading } = useQuery({
    queryKey: ["peer-insights"],
    queryFn: () => getPeerInsights({ data: undefined }),
  });
  const [sort, setSort] = useState<SortKey>("overall");

  const rows = useMemo(() => {
    const list = [...(data?.peers ?? [])];
    const pick = (r: PeerRow) => {
      switch (sort) {
        case "A": return r.a_behaviour;
        case "B": return r.b_direction;
        case "C": return r.c_contribution;
        case "D": return r.d_result;
        default: return r.overall;
      }
    };
    list.sort((x, y) => pick(y) - pick(x));
    return list;
  }, [data, sort]);

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.3em] text-gold">Peer Insights</div>
            <h1 className="mt-1 font-display text-2xl text-foreground">
              {data?.me?.role === "director"
                ? "Organization overview"
                : data?.me?.role === "manager"
                  ? "Your team"
                  : "Learn from your fleet"}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              {data?.me?.role === "staff"
                ? "Same fleet. Same rank. Current month only. This is a learning window — not a scoreboard. Salaries, notes and manager comments are never shown here."
                : data?.me?.role === "manager"
                  ? "Monthly performance for the Hunters you're responsible for. Sensitive data (salary, private notes) is never shown."
                  : "Monthly performance across the organization. Sensitive data (salary, private notes) is never shown."}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <Link to="/" className="text-xs uppercase tracking-widest text-gold hover:underline">← Home</Link>
            {data && (
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Scope: <span className="text-foreground">{data.scope.label}</span>
                <span className="px-2">·</span>
                {monthLabel(data.month ?? new Date().toISOString().slice(0,10))}
              </div>
            )}
            {data?.me && data.me.role === "staff" && (
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Fleet: <span className="text-foreground">{data.me.location_name ?? "—"}</span>
                <span className="px-2">·</span>
                Rank: <span className="text-foreground">{rankLabel(data.me.rank_key)}</span>
              </div>
            )}
          </div>
        </header>


        {isLoading ? (
          <div className="rounded-md border border-border bg-ink/30 p-12 text-center text-xs uppercase tracking-widest text-muted-foreground">
            Gathering the fleet…
          </div>
        ) : data?.notice ? (
          <div className="rounded-md border border-gold/40 bg-ink/30 p-8 text-center text-sm text-muted-foreground">
            {data.notice}
          </div>
        ) : (
          <>
            <SortBar sort={sort} onChange={setSort} />
            <LeaderboardTable rows={rows} sort={sort} />
            <CardsMobile rows={rows} />
            <Legend />
          </>
        )}
      </div>
    </div>
  );
}

function SortBar({ sort, onChange }: { sort: SortKey; onChange: (k: SortKey) => void }) {
  const btn = (k: SortKey, label: string) => (
    <button
      key={k}
      onClick={() => onChange(k)}
      className={`rounded-md border px-3 py-1.5 font-display text-[10px] uppercase tracking-[0.25em] transition ${
        sort === k
          ? "border-gold bg-gold/15 text-gold"
          : "border-border text-muted-foreground hover:border-gold/50 hover:text-gold"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Sort by</span>
      {btn("overall", "Overall")}
      {btn("A", "A · Behaviour")}
      {btn("B", "B · Direction")}
      {btn("C", "C · Contribution")}
      {btn("D", "D · Result")}
    </div>
  );
}

function GradePill({ grade }: { grade: string | null }) {
  const map: Record<string, string> = {
    A: "border-emerald-400/50 bg-emerald-400/10 text-emerald-200",
    B: "border-sky-400/50 bg-sky-400/10 text-sky-200",
    C: "border-amber-400/50 bg-amber-400/10 text-amber-200",
    D: "border-rose-400/50 bg-rose-400/10 text-rose-200",
  };
  const cls = grade ? map[grade] ?? "border-border text-muted-foreground" : "border-border text-muted-foreground";
  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border font-display text-[11px] ${cls}`}>
      {grade ?? "—"}
    </span>
  );
}

function LeaderboardTable({ rows, sort }: { rows: PeerRow[]; sort: SortKey }) {
  return (
    <div className="hidden overflow-hidden rounded-md border border-border bg-ink/30 md:block">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-ink/60 text-[10px] uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="px-3 py-3 text-left">#</th>
            <th className="px-3 py-3 text-left">Hunter</th>
            <th className="px-3 py-3 text-left">Rank</th>
            <th className="px-3 py-3 text-left">Fleet</th>
            <th className={`px-3 py-3 text-right ${sort === "overall" ? "text-gold" : ""}`}>Overall</th>
            <th className={`px-3 py-3 text-right ${sort === "A" ? "text-gold" : ""}`}>A</th>
            <th className={`px-3 py-3 text-right ${sort === "B" ? "text-gold" : ""}`}>B</th>
            <th className={`px-3 py-3 text-right ${sort === "C" ? "text-gold" : ""}`}>C</th>
            <th className={`px-3 py-3 text-right ${sort === "D" ? "text-gold" : ""}`}>D</th>
            <th className="px-3 py-3 text-center">Trend</th>
            <th className="px-3 py-3 text-left">Top Strength</th>
            <th className="px-3 py-3 text-right">Achv.</th>
            <th className="px-3 py-3 text-center">Grade</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.staff_id}
              className={`border-t border-border transition ${r.is_me ? "bg-gold/10 ring-1 ring-inset ring-gold/40" : "hover:bg-ink/40"}`}
            >
              <td className="px-3 py-3 text-muted-foreground">{i + 1}</td>
              <td className="px-3 py-3 font-display uppercase tracking-wider">
                {r.name}
                {r.is_me && <span className="ml-2 rounded border border-gold/60 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-gold">You</span>}
              </td>
              <td className="px-3 py-3 text-muted-foreground">{rankLabel(r.rank_key)}</td>
              <td className="px-3 py-3 text-muted-foreground">{r.location_name ?? "—"}</td>
              <td className="px-3 py-3 text-right font-display text-base">{r.overall.toFixed(1)}</td>
              <td className={`px-3 py-3 text-right ${CATEGORY_META.A.color}`}>{r.a_behaviour.toFixed(0)}</td>
              <td className={`px-3 py-3 text-right ${CATEGORY_META.B.color}`}>{r.b_direction.toFixed(0)}</td>
              <td className={`px-3 py-3 text-right ${CATEGORY_META.C.color}`}>{r.c_contribution.toFixed(0)}</td>
              <td className={`px-3 py-3 text-right ${CATEGORY_META.D.color}`}>{r.d_result.toFixed(0)}</td>
              <td className="px-3 py-3 text-center"><TrendGlyph trend={r.trend} /></td>
              <td className="px-3 py-3 text-xs text-muted-foreground">
                {r.top_strength ? `${r.top_strength} · ${CATEGORY_META[r.top_strength].label}` : "—"}
              </td>
              <td className="px-3 py-3 text-right text-muted-foreground">{r.achievements_count}</td>
              <td className="px-3 py-3 text-center"><GradePill grade={r.grade} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardsMobile({ rows }: { rows: PeerRow[] }) {
  return (
    <div className="grid gap-3 md:hidden">
      {rows.map((r, i) => (
        <div
          key={r.staff_id}
          className={`rounded-md border p-4 ${r.is_me ? "border-gold/60 bg-gold/10" : "border-border bg-ink/30"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">#{i + 1}</span>
                <span className="truncate font-display uppercase tracking-wider">{r.name}</span>
                {r.is_me && <span className="rounded border border-gold/60 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-gold">You</span>}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {rankLabel(r.rank_key)} · {r.location_name ?? "—"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="font-display text-lg">{r.overall.toFixed(1)}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Overall</div>
              </div>
              <GradePill grade={r.grade} />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {(["A", "B", "C", "D"] as const).map(k => {
              const v = k === "A" ? r.a_behaviour : k === "B" ? r.b_direction : k === "C" ? r.c_contribution : r.d_result;
              return (
                <div key={k} className="rounded border border-border bg-ink/40 p-2">
                  <div className={`font-display text-sm ${CATEGORY_META[k].color}`}>{v.toFixed(0)}</div>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{k}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Trend <TrendGlyph trend={r.trend} /></span>
            <span>{r.top_strength ? `Strength: ${CATEGORY_META[r.top_strength].label}` : "No review yet"}</span>
            <span>{r.achievements_count} achv.</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-6 rounded-md border border-border bg-ink/20 p-4">
      <div className="font-display text-[10px] uppercase tracking-[0.3em] text-gold">Grade Categories</div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
        {(["A", "B", "C", "D"] as const).map(k => (
          <div key={k} className="rounded border border-border bg-ink/40 p-3">
            <div className={`font-display text-sm ${CATEGORY_META[k].color}`}>{k} · {CATEGORY_META[k].label}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{CATEGORY_META[k].hint}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Peer Insights only shows Hunters in your fleet at your rank, for the current month.
        No salary, private notes, or manager comments are ever displayed. Use this view to spot
        strengths worth learning from — not to compare worth.
      </p>
    </div>
  );
}
