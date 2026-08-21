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
      { name: "description", content: "See how Hunters of your own class are performing this month by Overall Score and Overall Grade." },
      { property: "og:title", content: "Peer Insights — The Odyssey Guide" },
      { property: "og:description", content: "A clean, overall-only view of peer performance for the current month." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthGate><PeerInsights /></AuthGate>,
});

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

function GradePill({ grade }: { grade: string | null }) {
  const map: Record<string, string> = {
    A: "border-emerald-400/50 bg-emerald-400/10 text-emerald-200",
    B: "border-sky-400/50 bg-sky-400/10 text-sky-200",
    C: "border-amber-400/50 bg-amber-400/10 text-amber-200",
    D: "border-rose-400/50 bg-rose-400/10 text-rose-200",
  };
  const cls = grade ? map[grade] ?? "border-border text-muted-foreground" : "border-border text-muted-foreground";
  return (
    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full border font-display text-[12px] ${cls}`}>
      {grade ?? "—"}
    </span>
  );
}

function TabRow({
  tabs,
  active,
  onSelect,
  onLocked,
}: {
  tabs: { key: string; label: string; unlocked: boolean }[];
  active: string | null;
  onSelect: (key: string) => void;
  onLocked: (label: string) => void;
}) {
  if (!tabs.length) return null;
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {tabs.map((t) =>
        t.unlocked ? (
          <button
            key={t.key}
            type="button"
            onClick={() => onSelect(t.key)}
            className={`rounded-md border px-3 py-1.5 text-[11px] uppercase tracking-widest transition ${
              t.key === active
                ? "border-gold/60 bg-gold/10 text-gold"
                : "border-border bg-ink/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ) : (
          <button
            key={t.key}
            type="button"
            aria-disabled="true"
            onClick={() => onLocked(t.label)}
            title="Locked"
            className="cursor-not-allowed rounded-md border border-border/60 bg-ink/20 px-3 py-1.5 text-[11px] uppercase tracking-widest text-muted-foreground/60"
          >
            🔒 {t.label}
          </button>
        ),
      )}
    </div>
  );
}

function PeerInsights() {
  // `null` = let the server decide (own department/class, or the Director's default).
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["peer-insights", selectedDept, selectedClass],
    queryFn: () => getPeerInsights({ data: { department: selectedDept, class_key: selectedClass } }),
  });

  const rows = useMemo(() => {
    const list = [...(data?.peers ?? [])];
    list.sort((x, y) => y.overall - x.overall);
    return list;
  }, [data]);

  const activeDept = data?.active_department ?? selectedDept;
  const activeClass = data?.active_class ?? selectedClass;

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.3em] text-gold">Peer Insights</div>
            <h1 className="mt-1 font-display text-2xl text-foreground">
              {data?.me?.authority === "director" ? "Organization overview" : "Your class this month"}
            </h1>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <Link to="/" className="text-xs uppercase tracking-widest text-gold hover:underline">← Home</Link>
            {data && (
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Scope: <span className="text-foreground">{data.scope.label}</span>
                <span className="px-2">·</span>
                {monthLabel(data.month ?? new Date().toISOString().slice(0, 10))}
              </div>
            )}
            {data?.me && (
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {departmentLabel(data.me.department)} · {odysseyClassLabel(data.me.class_key) || "—"}
                <span className="px-2">·</span>
                {AUTHORITY_LABELS[data.me.authority]}
                <span className="px-2">·</span>
                Fleet: <span className="text-foreground">{data.me.location_name ?? "—"}</span>
                <span className="px-2">·</span>
                Rank: <span className="text-foreground">{rankLabel(data.me.rank_key)}</span>
              </div>
            )}
          </div>
        </header>

        {/* Departments — Warrior | Mage | Priest | Ranger. Locked tabs never fetch. */}
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Department</div>
        <TabRow
          tabs={data?.departments ?? []}
          active={activeDept}
          onSelect={(key) => { setLockedNotice(null); setSelectedDept(key); setSelectedClass(null); }}
          onLocked={(label) => setLockedNotice(`${label} department — locked. Peer Insights is limited to your own department.`)}
        />

        {/* Classes inside the selected department. */}
        {(data?.classes?.length ?? 0) > 0 && (
          <>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Class</div>
            <TabRow
              tabs={data?.classes ?? []}
              active={activeClass}
              onSelect={(key) => { setLockedNotice(null); setSelectedClass(key); }}
              onLocked={(label) => setLockedNotice(`${label} — locked. Peer Insights is available for your own class only.`)}
            />
          </>
        )}

        {lockedNotice && (
          <div className="mb-4 rounded-md border border-border bg-ink/30 px-4 py-2 text-[12px] text-muted-foreground">
            {lockedNotice}
          </div>
        )}


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
            <PeerTable rows={rows} />
            <CardsMobile rows={rows} />
            <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
              Overall Score and Overall Grade (A / B / C / D) only. Detailed review sections, manager
              notes, salary and private comments are never shown here.
            </p>
          </>
        )}
      </div>
    </div>
  );
}


function PeerTable({ rows }: { rows: PeerRow[] }) {
  return (
    <div className="hidden overflow-hidden rounded-md border border-border bg-ink/30 md:block">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-ink/60 text-[10px] uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">#</th>
            <th className="px-4 py-3 text-left">Hunter</th>
            <th className="px-4 py-3 text-left">Rank</th>
            <th className="px-4 py-3 text-left">Fleet</th>
            <th className="px-4 py-3 text-right text-gold">Overall Score</th>
            <th className="px-4 py-3 text-center">Overall Grade</th>
            <th className="px-4 py-3 text-center">Trend</th>
            <th className="px-4 py-3 text-right">Achievements</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.staff_id}
              className={`border-t border-border transition ${r.is_me ? "bg-gold/10 ring-1 ring-inset ring-gold/40" : "hover:bg-ink/40"}`}
            >
              <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
              <td className="px-4 py-3 font-display uppercase tracking-wider">
                {r.name}
                {r.is_me && <span className="ml-2 rounded border border-gold/60 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-gold">You</span>}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{rankLabel(r.rank_key)}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.location_name ?? "—"}</td>
              <td className="px-4 py-3 text-right font-display text-base">{r.overall.toFixed(1)}</td>
              <td className="px-4 py-3 text-center"><GradePill grade={r.grade} /></td>
              <td className="px-4 py-3 text-center"><TrendGlyph trend={r.trend} /></td>
              <td className="px-4 py-3 text-right text-muted-foreground">{r.achievements_count}</td>
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
          <div className="flex items-center justify-between gap-3">
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
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-display text-lg">{r.overall.toFixed(1)}</div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Overall Score</div>
              </div>
              <div className="text-center">
                <GradePill grade={r.grade} />
                <div className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground">Grade</div>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
            <span>Trend <TrendGlyph trend={r.trend} /></span>
            <span>{r.achievements_count} achievements</span>
          </div>
        </div>
      ))}
    </div>
  );
}
