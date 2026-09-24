import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { Button } from "@/components/ui/button";
import { getPeerInsights, type PeerRow } from "@/lib/peers.functions";
import { rankLabel } from "@/lib/rpg";
import { AUTHORITY_LABELS, departmentLabel, odysseyClassLabel } from "@/lib/taxonomy";

export const Route = createFileRoute("/peer-insights")({
  head: () => ({
    meta: [
      { title: "Peer Insights / Guild Ranking — The Odyssey Guide" },
      {
        name: "description",
        content:
          "Monthly guild rankings with Performance Score, Grade, Trend, Department, Class, and achievements.",
      },
      { property: "og:title", content: "Peer Insights / Guild Ranking — The Odyssey Guide" },
      {
        property: "og:description",
        content:
          "See monthly Performance ranking, Grade, and Trend within authorized Odyssey groups.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AuthGate>
      <PeerInsights />
    </AuthGate>
  ),
});

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function previousMonthLabel(year: number, month: number) {
  return new Date(Date.UTC(year, month - 2, 1)).toLocaleDateString(undefined, {
    month: "short",
    timeZone: "UTC",
  });
}

function Trend({ row, year, month }: { row: PeerRow; year: number; month: number }) {
  if (row.overall === null) return <span className="text-muted-foreground">— No review</span>;
  if (row.prev_overall === null)
    return <span className="text-muted-foreground">→ No prior review</span>;
  const glyph = row.trend === "up" ? "↑" : row.trend === "down" ? "↓" : "→";
  const tone =
    row.trend === "up"
      ? "text-emerald-300"
      : row.trend === "down"
        ? "text-rose-300"
        : "text-muted-foreground";
  const delta = row.trend_delta ?? 0;
  return (
    <span className={tone}>
      {glyph} {delta > 0 ? "+" : ""}
      {delta.toFixed(1)} vs {previousMonthLabel(year, month)}
    </span>
  );
}

function GradePill({ grade }: { grade: string | null }) {
  const tones: Record<string, string> = {
    A: "border-emerald-400/50 bg-emerald-400/10 text-emerald-200",
    B: "border-sky-400/50 bg-sky-400/10 text-sky-200",
    C: "border-amber-400/50 bg-amber-400/10 text-amber-200",
    D: "border-rose-400/50 bg-rose-400/10 text-rose-200",
  };
  return (
    <span
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border font-display text-sm ${grade ? (tones[grade] ?? "border-border text-muted-foreground") : "border-border text-muted-foreground"}`}
    >
      {grade ?? "—"}
    </span>
  );
}

function PositionBadge({ position }: { position: number }) {
  const tone =
    position === 1
      ? "border-gold bg-gold/20 text-gold"
      : position === 2
        ? "border-foreground/40 bg-foreground/5 text-foreground"
        : position === 3
          ? "border-amber-700/70 bg-amber-700/15 text-amber-300"
          : "border-border text-muted-foreground";
  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border font-display text-xs ${tone}`}
    >
      #{position}
    </span>
  );
}

function PeerInsights() {
  const [group, setGroup] = useState<string | null>(null);
  const [classKey, setClassKey] = useState<string | null>(null);
  const [year, setYear] = useState(new Date().getUTCFullYear());
  const [month, setMonth] = useState(new Date().getUTCMonth() + 1);
  const query = useQuery({
    queryKey: ["peer-insights", group, classKey, year, month],
    queryFn: () =>
      getPeerInsights({
        data: { group, class_key: classKey === "all" ? null : classKey, year, month },
      }),
  });
  const data = query.data;

  return (
    <main className="min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.3em] text-gold">
              Peer Insights
            </div>
            <h1 className="mt-1 font-display text-2xl">Peer Insights / Guild Ranking</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Rank, Score, Grade, and month-to-month Trend together for the selected month.
            </p>
          </div>
          <Link to="/" className="text-xs uppercase tracking-widest text-gold hover:underline">
            ← Home
          </Link>
        </header>

        {data?.me && (
          <div className="mb-4 text-[10px] uppercase tracking-widest text-muted-foreground">
            {departmentLabel(data.me.department)} · {odysseyClassLabel(data.me.class_key) || "—"} ·{" "}
            {AUTHORITY_LABELS[data.me.authority]} · Rank:{" "}
            <span className="text-foreground">{rankLabel(data.me.rank_key)}</span>
          </div>
        )}

        {(data?.groups.length ?? 0) > 1 && (
          <div
            className="mb-4 flex flex-wrap gap-1 rounded-md border border-border p-1"
            aria-label="Ranking group"
          >
            {data?.groups.map((item) => (
              <Button
                key={item.key}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setGroup(item.key);
                  setClassKey(null);
                }}
                className={`font-display text-[10px] uppercase tracking-[0.2em] ${data.active_group === item.key ? "bg-gold/15 text-gold" : "text-muted-foreground"}`}
              >
                {item.label}
              </Button>
            ))}
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            Year
            <select
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="rounded-md border border-border bg-ink/40 px-3 py-2 text-sm text-foreground"
            >
              {[0, 1, 2]
                .map((offset) => new Date().getUTCFullYear() - offset)
                .map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
            </select>
          </label>
          <label className="grid gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            Month
            <select
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
              className="rounded-md border border-border bg-ink/40 px-3 py-2 text-sm text-foreground"
            >
              {MONTH_NAMES.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          {(data?.classes.length ?? 0) > 0 && (
            <label className="grid gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              Class
              <select
                value={classKey ?? data?.active_class ?? "all"}
                onChange={(event) => setClassKey(event.target.value)}
                className="rounded-md border border-border bg-ink/40 px-3 py-2 text-sm text-foreground"
              >
                {data?.classes
                  .filter((item) => item.unlocked)
                  .map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <div className="pb-2 text-[11px] text-muted-foreground">
            {MONTH_NAMES[month - 1]} {year} · compared with {previousMonthLabel(year, month)}
          </div>
        </div>

        {query.isLoading ? (
          <Message>Gathering the guild ranking…</Message>
        ) : query.error ? (
          <Message>Could not load Peer Insights. Please try again.</Message>
        ) : data?.notice ? (
          <Message>{data.notice}</Message>
        ) : (
          <div className="space-y-7">
            {data?.sections.map((section) => (
              <RankingSection
                key={section.key}
                label={section.label}
                rows={section.peers}
                year={year}
                month={month}
              />
            ))}
          </div>
        )}

        <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
          A / B / C / D is the overall Performance Review Grade, not a Behaviour section. Private
          notes, detailed review sections, salary, and comments are never shown. Every group ranks
          separately.
        </p>
      </div>
    </main>
  );
}

function RankingSection({
  label,
  rows,
  year,
  month,
}: {
  label: string;
  rows: PeerRow[];
  year: number;
  month: number;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
        <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">
          {label} Ranking
        </h2>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {rows.length} eligible
        </span>
      </div>
      {rows.length === 0 ? (
        <Message>No eligible people in this group.</Message>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <article
              key={row.staff_id}
              className={`rounded-md border p-4 ${row.is_me ? "border-gold/60 bg-gold/10" : "border-border bg-ink/30"}`}
            >
              <div className="flex items-start gap-3">
                <PositionBadge position={row.position} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-display uppercase tracking-wider">{row.name}</h3>
                    {row.is_me && (
                      <span className="rounded border border-gold/60 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-gold">
                        You
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {departmentLabel(row.department)} · {row.class_label ?? "—"}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <div className="font-display text-xl">
                      {row.overall === null ? "—" : row.overall.toFixed(1)}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
                      Score
                    </div>
                  </div>
                  <div className="text-center">
                    <GradePill grade={row.grade} />
                    <div className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground">
                      Grade
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[11px]">
                <Trend row={row} year={year} month={month} />
                <span className="text-muted-foreground">{row.achievements_count} achievements</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-ink/30 p-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
