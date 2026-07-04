import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { getStaffDashboard } from "@/lib/workflow.functions";
import { GRADE_META } from "@/lib/employee-data";
import { classLabel, roleLabel, rankIdentity, rankGlyph, rankLabel, factionFor } from "@/lib/rpg";
import { PortraitBadge } from "@/components/portrait";



export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Profile — The Odyssey Guide" }] }),
  component: () => <AuthGate><ProfilePage /></AuthGate>,
});

function ProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "me"],
    queryFn: () => getStaffDashboard({ data: {} }),
  });

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">My Profile</div>
            <div className="text-xs text-muted-foreground">Live calculations from the workflow engine — stars, rank, legacy.</div>
          </div>
          <Link to="/" className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">← Ledger</Link>
        </header>

        {isLoading && <Skel />}
        {!isLoading && !data?.staff && (
          <div className="rounded-md border border-border bg-ink/30 p-6 text-sm text-muted-foreground">
            Your account isn't linked to a staff record yet. Ask a Director to add you in <Link to="/admin" className="text-gold underline">Admin → Staff</Link>.
          </div>
        )}

        {data?.staff && <ProfileBody data={data} />}

      </div>
    </div>
  );
}

function Skel() { return <div className="animate-pulse rounded-md border border-border bg-ink/30 p-12 text-center text-xs text-muted-foreground">Calculating…</div>; }

function ProfileBody({ data }: { data: any }) {
  const holdings: any[] = data.holdings ?? [];
  const activeHoldings = holdings.filter((h) => !h.ended_at);
  const SHIPBUILDER_TITLES = new Set(["founder", "co-founder", "partner", "shareholder"]);
  const isShipbuilder = activeHoldings.some((h) => SHIPBUILDER_TITLES.has((h.title ?? "").toLowerCase().trim()));
  return (
    <div className="space-y-6">
      <CharacterSheet d={data} isShipbuilder={isShipbuilder} />
      {activeHoldings.length > 0 && <LegacyRibbon holdings={activeHoldings} />}
      {isShipbuilder ? (
        <ShipbuilderCard holdings={activeHoldings} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <LegacyCard d={data} />
          <PromotionCard d={data} />
        </div>
      )}
      {!isShipbuilder && <ClaimSummary d={data} />}
      {!isShipbuilder && (
        <div className="grid gap-6 lg:grid-cols-2">
          <RecordsCard records={data.records} />
          <GradesCard grades={data.grades} />
        </div>
      )}
    </div>
  );
}

function LegacyRibbon({ holdings }: { holdings: any[] }) {
  return (
    <section className="rounded-md border border-gold/40 bg-gradient-to-r from-gold/5 via-ink/30 to-gold/5 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">Legendary Titles</h2>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Independent of current workplace</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {holdings.map((h) => (
          <div key={h.id} className="rounded-md border border-gold/40 bg-ink/40 px-3 py-1.5">
            <div className="font-display text-xs uppercase tracking-widest text-gold">{h.title}</div>
            <div className="text-[10px] text-muted-foreground">
              {h.location?.name ?? "Company-wide"}{h.granted_at ? ` · since ${h.granted_at}` : ""}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ShipbuilderCard({ holdings }: { holdings: any[] }) {
  const fleets = new Set(holdings.map((h) => h.location?.name).filter(Boolean));
  return (
    <section className="rounded-md border border-gold/30 bg-ink/30 p-5">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">The Shipbuilder</h2>
      <div className="mt-1 text-xs italic text-muted-foreground">Charts the course. Builds the ship. Beyond rank.</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SbStat label="Fleet Built" value={String(fleets.size || holdings.length)} sub="Ventures founded" />
        <SbStat label="Voyagers Guided" value="—" sub="Crew elevated" />
        <SbStat label="Legacy Created" value="Beyond Rank" sub="Shipbuilder" />
      </div>
    </section>
  );
}

function SbStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-md border border-border bg-ink/40 p-3 text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg text-gold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}


function CharacterSheet({ d, isShipbuilder = false }: { d: any; isShipbuilder?: boolean }) {
  const s = d.staff;
  const ev = d.evaluation;
  const latestGrade = d.grades?.[0]?.grade ?? "—";
  const rankKey = s.current_rank_key ?? s.rpg?.current_rank_key ?? s.rank?.key ?? null;
  const rankIdent = rankIdentity(rankKey);
  const rankName = rankLabel(rankKey) || s.rank?.name || ev?.current_rank_name || "Unranked";
  const classKey = s.rpg?.primary_class ?? null;
  const roleKey  = s.rpg?.primary_role ?? null;
  const className = classLabel(classKey);
  const roleName = roleLabel(roleKey);
  const faction = factionFor(classKey);

  const origin = isShipbuilder
    ? "The Shipbuilder"
    : (d.legacy?.currentTitle?.name ?? "Wanderer");
  const profession = (roleName || s.profession || s.job_title || "Adventurer").toUpperCase();
  const guildLabel = (faction?.label ?? (className ? `${className} Guild` : "Free Guild")).toUpperCase();
  const motto = isShipbuilder
    ? "Charts the course. Builds the ship."
    : (rankIdent || "The voyage begins.");
  const initials = (s.name ?? "??")
    .split(/\s+/).filter(Boolean).slice(0, 2).map((p: string) => p[0]?.toUpperCase()).join("");
  const rankColor =
    { bronze:"#B87333", silver:"#C8CDD4", gold:"#F5D07A", platinum:"#B8D4E3",
      diamond:"#8FE3E8", mystical:"#C9A6FF", legend:"#F4E9C1" }[
      (rankKey ?? "").toLowerCase() as string] ?? "#8A8F98";

  return (
    <section className="relative overflow-hidden rounded-lg bg-[#0A0F1E] px-4 py-5 sm:px-12 sm:py-14">
      {/* soft radial glow only */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: `radial-gradient(circle at 50% 12%, ${rankColor}22, transparent 60%)` }}
      />

      {/* ─── HERO — first mobile screen: Who am I? ──────── */}
      <div className="relative flex flex-col items-center text-center">
        <PortraitBadge
          size={112}
          rankColor={rankColor}
          rankGlow={`${rankColor}66`}
          initials={initials || "—"}
          isShipbuilder={isShipbuilder}
        />

        <h1 className="mt-3 font-display text-2xl leading-none tracking-[0.12em] text-foreground sm:mt-7 sm:text-5xl">
          {s.name}
        </h1>

        <div
          className="mt-1.5 font-display text-lg tracking-[0.18em] sm:mt-3 sm:text-3xl"
          style={{ color: rankColor, textShadow: `0 0 18px ${rankColor}66`, fontFamily: "'Cinzel', serif" }}
        >
          {isShipbuilder ? "Beyond Rank" : rankName}
        </div>

        <div className="mt-1.5 text-[10px] uppercase tracking-[0.4em] text-foreground/70 sm:mt-3 sm:text-[11px] sm:tracking-[0.5em]">
          {className || profession}
        </div>

        <div className="mt-1 text-[10px] uppercase tracking-[0.4em] text-muted-foreground sm:mt-1.5 sm:text-[11px] sm:tracking-[0.5em]">
          {guildLabel}
        </div>

        <div
          className="mt-2 text-sm italic text-muted-foreground sm:mt-5 sm:text-xl"
          style={{ fontFamily: '"Cormorant Garamond", serif' }}
        >
          "{motto}"
        </div>
      </div>

      {/* ─── CHARACTER PROFILE — above fold ───────── */}
      <div className="relative mx-auto mt-4 max-w-2xl sm:mt-14">
        <div className="mb-2 text-center text-[9px] uppercase tracking-[0.45em] text-muted-foreground sm:mb-5 sm:text-[10px] sm:tracking-[0.55em]">
          Character Profile
        </div>
        <div className="grid grid-cols-3 gap-x-3 gap-y-3 sm:gap-x-16 sm:gap-y-6">
          <Field label="Profession" value={profession} />
          <Field label="Class" value={className || "—"} />
          <Field
            label="Rank"
            value={isShipbuilder ? "Beyond Rank" : rankName}
            valueStyle={!isShipbuilder ? { color: rankColor, textShadow: `0 0 18px ${rankColor}66` } : undefined}
          />
        </div>
      </div>

      {/* ─── ACTIVE ASSIGNMENT ────────────────────────────── */}
      <div className="relative mx-auto mt-6 max-w-2xl sm:mt-14">
        <div className="mb-2 text-center text-[9px] uppercase tracking-[0.45em] text-muted-foreground sm:mb-5 sm:text-[10px] sm:tracking-[0.55em]">
          Active Assignment
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3 sm:gap-x-16 sm:gap-y-6">
          <Field label="Business Unit" value={s.business_unit || "—"} />
          <Field label="Fleet" value={s.location?.name ?? "—"} />
          {!isShipbuilder && (
            <Field label="Manager" value={s.manager?.name ?? "Unassigned"} />
          )}
        </div>
      </div>


      {/* ─── LEGACY ──────────────────────────────────────── */}
      {!isShipbuilder && (
        <div className="relative mx-auto mt-12 max-w-2xl sm:mt-14">
          <div className="mb-5 text-center text-[10px] uppercase tracking-[0.55em] text-muted-foreground">
            Legacy
          </div>
          <div className="grid grid-cols-3 gap-x-10 sm:gap-x-20">
            <LegacyStat label="Stars" value={d.totals?.stars ?? 0} />
            <LegacyStat label="Moons" value={d.totals?.moons ?? 0} />
            <LegacyStat label="Suns"  value={d.totals?.suns ?? 0} />
          </div>
        </div>
      )}

      {/* ─── FOOTER · Guild ID ───────────────────────────── */}
      {(s.guild_id || s.id) && (
        <div className="relative mt-12 text-center text-[9px] uppercase tracking-[0.5em] text-muted-foreground/40 sm:mt-14">
          Guild ID · {s.guild_id ?? String(s.id).slice(0, 8)}
        </div>
      )}
    </section>
  );
}

function Field({ label, value, valueStyle }: { label: string; value: string; valueStyle?: React.CSSProperties }) {
  return (
    <div className="text-center">
      <div className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground/70">{label}</div>
      <div
        className="mt-3 font-display text-lg tracking-[0.05em] text-foreground/95 sm:text-xl"
        style={valueStyle}
      >
        {value}
      </div>
    </div>
  );
}


function LegacyStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <div className="font-display text-4xl tracking-[0.12em] text-gold sm:text-5xl">{value}</div>
      <div className="mt-3 text-[10px] uppercase tracking-[0.45em] text-muted-foreground">{label}</div>
    </div>
  );
}

function LegacyCard({ d }: { d: any }) {
  const t = d.totals; const l = d.legacy;
  if (!t) return null;
  const starsToNextMoon = t.starsPerMoon - t.starsRemainder;
  return (
    <section className="rounded-md border border-border bg-ink/30 p-5">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">Legacy Engine</h2>
      <div className="mt-3 text-xs text-muted-foreground">{t.starsPerMoon} ⭐ = 1 🌙 · {t.moonsPerSun} 🌙 = 1 ☀️</div>
      <div className="mt-3 rounded border border-gold/30 bg-gold/5 p-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Current Title</div>
        <div className="font-display text-lg text-gold">{l?.currentTitle?.name ?? "Wanderer"}</div>
        <div className="text-xs italic text-muted-foreground">{l?.currentTitle?.flavor ?? "Begin your saga."}</div>
      </div>
      {l?.nextTitle && (
        <div className="mt-3 text-xs text-muted-foreground">
          Next: <span className="text-foreground">{l.nextTitle.name}</span> in <span className="text-gold">{l.starsToNextTitle} ⭐</span>
        </div>
      )}
      <div className="mt-2 text-xs text-muted-foreground">
        {starsToNextMoon === t.starsPerMoon ? "Fresh moon" : `${starsToNextMoon} ⭐ to next 🌙`}
      </div>
    </section>
  );
}

function PromotionCard({ d }: { d: any }) {
  const ev = d.evaluation; if (!ev) return null;
  const reqs = [
    { label: "Total Stars", have: ev.total_stars, need: ev.next_min_total_stars },
    { label: "A-Grades", have: ev.a_grades, need: ev.next_min_a_grades },
    { label: "B-Grades", have: ev.b_grades, need: ev.next_min_b_grades },
    { label: "Achievements", have: ev.unique_achievements, need: ev.next_min_achievements },
  ];
  return (
    <section className={`rounded-md border p-5 ${ev.eligible ? "border-emerald-400/60 bg-emerald-400/5" : "border-border bg-ink/30"}`}>
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">Voyage Progression</h2>
      {!ev.next_rank_key ? (
        <div className="mt-3 text-sm text-muted-foreground">Max rank achieved.</div>
      ) : (
        <>
          <div className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">Next Rank</div>
          <div className="font-display text-lg text-gold">{ev.next_rank_name}</div>
          <div className="mt-3 space-y-2">
            {reqs.map(r => {
              const pct = r.need === 0 ? 100 : Math.min(100, Math.round((r.have / r.need) * 100));
              const done = r.have >= r.need;
              return (
                <div key={r.label}>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{r.label}</span>
                    <span className={done ? "text-emerald-300" : ""}>{r.have} / {r.need} {done ? "✓" : ""}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded bg-ink/60">
                    <div className={`h-full rounded ${done ? "bg-emerald-400" : "bg-gold"}`} style={{ width: pct + "%" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className={`mt-3 font-display text-xs uppercase tracking-widest ${ev.eligible ? "text-emerald-300" : "text-muted-foreground"}`}>
            {ev.eligible ? "Eligible — manager may promote." : "Not yet eligible"}
          </div>
        </>
      )}
    </section>
  );
}

function ClaimSummary({ d }: { d: any }) {
  return (
    <section className="rounded-md border border-border bg-ink/30 p-5">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">My Harbor Records</h2>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <Pill label="Pending"  value={d.claims.pending}  tone="gold" />
        <Pill label="Approved" value={d.claims.approved} tone="emerald" />
        <Pill label="Rejected" value={d.claims.rejected} tone="red" />
      </div>
      <div className="mt-4 text-right">
        <Link to="/claims" className="text-xs uppercase tracking-widest text-gold hover:underline">Record a voyage →</Link>
      </div>
    </section>
  );
}

function Pill({ label, value, tone }: { label: string; value: number; tone: "gold" | "emerald" | "red" }) {
  const colors = {
    gold: "border-gold/40 bg-gold/5 text-gold",
    emerald: "border-emerald-400/50 bg-emerald-400/10 text-emerald-300",
    red: "border-red-500/50 bg-red-500/10 text-red-300",
  }[tone];
  return (
    <div className={`rounded-md border p-3 ${colors}`}>
      <div className="font-display text-xl">{value}</div>
      <div className="text-[10px] uppercase tracking-widest">{label}</div>
    </div>
  );
}

function RecordsCard({ records }: { records: any[] }) {
  return (
    <section className="rounded-md border border-border bg-ink/30 p-5">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">Recent Star Awards</h2>
      <ul className="mt-3 divide-y divide-border">
        {records.length ? records.map(r => (
          <li key={r.id} className="flex justify-between py-2 text-sm">
            <div>
              <div>{r.achievement?.name ?? "—"}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.period}</div>
            </div>
            <div className="font-display text-gold">+{r.stars} ⭐</div>
          </li>
        )) : <li className="py-6 text-center text-xs text-muted-foreground">No stars yet — submit your first claim.</li>}
      </ul>
    </section>
  );
}

function GradesCard({ grades }: { grades: any[] }) {
  return (
    <section className="rounded-md border border-border bg-ink/30 p-5">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">Monthly Grades</h2>
      <ul className="mt-3 divide-y divide-border">
        {grades.length ? grades.map(g => {
          const meta = GRADE_META[g.grade as "A"] ?? GRADE_META.D;
          return (
            <li key={g.month} className="flex justify-between py-2 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{g.month}</div>
                <div className="text-xs text-muted-foreground">Voyage Rating {g.composite_score}</div>
              </div>
              <span className="rounded border px-2 py-0.5 font-display text-sm" style={{ color: meta.color, borderColor: meta.color }}>{g.grade}</span>
            </li>
          );
        }) : <li className="py-6 text-center text-xs text-muted-foreground">No evaluations yet.</li>}
      </ul>
    </section>
  );
}
