import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { getLeaderboard, type LeaderboardRow } from "@/lib/leaderboard.functions";
import { classLabel, rankGlyph, rankLabel } from "@/lib/rpg";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — The Odyssey Guide" },
      { name: "description", content: "The guild ranking board: every Hunter ordered by their latest Performance score, rank and promotion progress." },
      { property: "og:title", content: "Leaderboard — The Odyssey Guide" },
      { property: "og:description", content: "See where you stand among the fleet — latest Performance score, grade, rank and promotion progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AuthGate><Leaderboard /></AuthGate>,
});

function gradeClasses(grade: string | null) {
  const map: Record<string, string> = {
    A: "border-emerald-400/50 bg-emerald-400/10 text-emerald-200",
    B: "border-sky-400/50 bg-sky-400/10 text-sky-200",
    C: "border-amber-400/50 bg-amber-400/10 text-amber-200",
    D: "border-rose-400/50 bg-rose-400/10 text-rose-200",
  };
  return (grade && map[grade]) || "border-border text-muted-foreground";
}

function GradePill({ grade }: { grade: string | null }) {
  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border font-display text-[11px] ${gradeClasses(grade)}`}>
      {grade ?? "—"}
    </span>
  );
}

function PositionBadge({ position }: { position: number }) {
  const tone =
    position === 1 ? "border-gold bg-gold/20 text-gold"
    : position === 2 ? "border-slate-300/60 bg-slate-300/10 text-slate-200"
    : position === 3 ? "border-amber-700/70 bg-amber-700/15 text-amber-300"
    : "border-border text-muted-foreground";
  return (
    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md border font-display text-xs tracking-widest ${tone}`}>
      {position}
    </span>
  );
}

function ProgressBar({ percent }: { percent: number | null }) {
  if (percent === null) {
    return <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Not yet defined</span>;
  }
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink/70 ring-1 ring-inset ring-border">
        <div className="h-full rounded-full bg-gold/70" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-[11px] text-muted-foreground">{percent}%</span>
    </div>
  );
}

function ScoreCell({ row }: { row: LeaderboardRow }) {
  if (row.score === null) {
    return <span className="text-[10px] uppercase tracking-widest text-muted-foreground">No Performance Yet</span>;
  }
  return <span className="font-display text-base">{row.score.toFixed(1)}</span>;
}

function monthLabel(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00Z").toLocaleDateString(undefined, { month: "short", year: "numeric", timeZone: "UTC" });
}

function Leaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => getLeaderboard({ data: undefined }),
  });
  const [selected, setSelected] = useState<LeaderboardRow | null>(null);
  const [onlyScored, setOnlyScored] = useState(false);

  const rows = useMemo(() => {
    const all = data?.rows ?? [];
    return onlyScored ? all.filter(r => r.score !== null) : all;
  }, [data, onlyScored]);

  const me = data?.rows.find(r => r.is_me) ?? null;

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-[10px] uppercase tracking-[0.3em] text-gold">Guild Ranking Board</span>
              <span className="rounded border border-gold/40 px-1.5 py-0.5 font-display text-[9px] uppercase tracking-widest text-gold">Beta</span>
            </div>
            <h1 className="mt-1 font-display text-2xl">Leaderboard</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Every Hunter, ordered by their latest completed Performance score. Ranking and Performance stay
              separate systems — this board only reflects them. Private manager notes are never shown.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <Link to="/" className="text-xs uppercase tracking-widest text-gold hover:underline">← Home</Link>
            <Link to="/peer-insights" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-gold">Peer Insights →</Link>
          </div>
        </header>

        {isLoading ? (
          <div className="rounded-md border border-border bg-ink/30 p-12 text-center text-xs uppercase tracking-widest text-muted-foreground">
            Reading the board…
          </div>
        ) : (
          <>
            {data?.notice && (
              <div className="mb-4 rounded-md border border-gold/40 bg-ink/30 p-4 text-sm text-muted-foreground">{data.notice}</div>
            )}

            {me && (
              <div className="mb-4 rounded-md border border-gold/60 bg-gold/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-display text-[10px] uppercase tracking-[0.3em] text-gold">Your standing</div>
                    <div className="mt-1 font-display text-lg uppercase tracking-wider">
                      #{data?.my_position ?? "—"} · {me.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {classLabel(me.class_key) || "—"} · {rankLabel(me.rank_key) || "Unranked"}
                      {me.next_rank_name ? ` → ${me.next_rank_name}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-display text-xl"><ScoreCell row={me} /></div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{monthLabel(me.month)}</div>
                    </div>
                    <GradePill grade={me.grade} />
                  </div>
                </div>
              </div>
            )}

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Sorted by latest Performance score</span>
              <button
                onClick={() => setOnlyScored(v => !v)}
                className={`rounded-md border px-3 py-1.5 font-display text-[10px] uppercase tracking-[0.25em] transition ${
                  onlyScored ? "border-gold bg-gold/15 text-gold" : "border-border text-muted-foreground hover:border-gold/50 hover:text-gold"
                }`}
              >
                Scored only
              </button>
            </div>

            {/* Desktop board */}
            <div className="hidden overflow-hidden rounded-md border border-border bg-ink/30 md:block">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-ink/60 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 text-left">#</th>
                    <th className="px-3 py-3 text-left">Hunter</th>
                    <th className="px-3 py-3 text-left">Class</th>
                    <th className="px-3 py-3 text-left">Rank</th>
                    <th className="px-3 py-3 text-right">Score</th>
                    <th className="px-3 py-3 text-center">Grade</th>
                    <th className="px-3 py-3 text-left">Next Rank</th>
                    <th className="px-3 py-3 text-left">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={r.staff_id}
                      onClick={() => setSelected(r)}
                      className={`cursor-pointer border-t border-border transition ${r.is_me ? "bg-gold/10 ring-1 ring-inset ring-gold/40" : "hover:bg-ink/40"}`}
                    >
                      <td className="px-3 py-3"><PositionBadge position={i + 1} /></td>
                      <td className="px-3 py-3 font-display uppercase tracking-wider">
                        {r.name}
                        {r.is_me && <span className="ml-2 rounded border border-gold/60 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-gold">You</span>}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{classLabel(r.class_key) || "—"}</td>
                      <td className="px-3 py-3 text-muted-foreground">{rankGlyph(r.rank_key)} {rankLabel(r.rank_key) || "Unranked"}</td>
                      <td className="px-3 py-3 text-right"><ScoreCell row={r} /></td>
                      <td className="px-3 py-3 text-center"><GradePill grade={r.grade} /></td>
                      <td className="px-3 py-3 text-muted-foreground">{r.next_rank_name ?? "—"}</td>
                      <td className="px-3 py-3"><ProgressBar percent={r.promotion_percent} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile board */}
            <div className="grid gap-3 md:hidden">
              {rows.map((r, i) => (
                <button
                  key={r.staff_id}
                  onClick={() => setSelected(r)}
                  className={`rounded-md border p-4 text-left ${r.is_me ? "border-gold/60 bg-gold/10" : "border-border bg-ink/30"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <PositionBadge position={i + 1} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-display uppercase tracking-wider">{r.name}</span>
                          {r.is_me && <span className="rounded border border-gold/60 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-gold">You</span>}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {classLabel(r.class_key) || "—"} · {rankLabel(r.rank_key) || "Unranked"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right"><ScoreCell row={r} /></div>
                      <GradePill grade={r.grade} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Next: {r.next_rank_name ?? "—"}</span>
                    <ProgressBar percent={r.promotion_percent} />
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
              Beta note: the Leaderboard is a presentation layer. It reads the Performance and Ranking systems and
              does not change how scores, grades or promotions are calculated. Rules may evolve during Beta.
            </p>
          </>
        )}
      </div>

      {selected && <PublicProfile row={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function PublicProfile({ row, onClose }: { row: LeaderboardRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-md border border-gold/40 bg-ink p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.3em] text-gold">Hunter Record</div>
            <h2 className="mt-1 font-display text-xl uppercase tracking-wider">{row.name}</h2>
            <div className="text-[11px] text-muted-foreground">
              {classLabel(row.class_key) || "—"} · {rankGlyph(row.rank_key)} {rankLabel(row.rank_key) || "Unranked"}
            </div>
          </div>
          <button onClick={onClose} className="rounded-md border border-border px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-gold">Close</button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded border border-border bg-ink/40 p-3">
            <div className="font-display text-lg">{row.score !== null ? row.score.toFixed(1) : "—"}</div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Total / 100</div>
          </div>
          <div className="rounded border border-border bg-ink/40 p-3">
            <div className="font-display text-lg">{row.class_score !== null ? row.class_score.toFixed(1) : "—"}</div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Class / 50</div>
          </div>
          <div className="rounded border border-border bg-ink/40 p-3">
            <div className="font-display text-lg">{row.guild_score !== null ? row.guild_score.toFixed(1) : "—"}</div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Guild / 50</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded border border-border bg-ink/40 p-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Latest Grade · {monthLabel(row.month)}</span>
          <GradePill grade={row.grade} />
        </div>

        <div className="mt-3 rounded border border-border bg-ink/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Progress → {row.next_rank_name ?? "Max Rank"}
            </span>
            <ProgressBar percent={row.promotion_percent} />
          </div>
        </div>

        <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
          Public competitive record only. Manager notes and private review details are never shown here.
        </p>
      </div>
    </div>
  );
}
