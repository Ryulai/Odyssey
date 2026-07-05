import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { useRole, can } from "@/lib/roles";
import { listStaff } from "@/lib/config.functions";

export const Route = createFileRoute("/professional-performance")({
  head: () => ({
    meta: [
      { title: "Professional Performance — The Odyssey Guide" },
      {
        name: "description",
        content:
          "Prototype V1 — Hunter Professional Performance evaluation across four capability areas.",
      },
    ],
  }),
  component: () => (
    <AuthGate>
      <ProfessionalPerformancePage />
    </AuthGate>
  ),
});

type AreaKey = "customer" | "communication" | "execution" | "growth";

type Area = {
  key: AreaKey;
  label: string;
  description: string;
  behaviours: string[];
};

const AREAS: Area[] = [
  {
    key: "customer",
    label: "Customer Relationship",
    description:
      "Builds genuine customer relationships and consistently delivers excellent customer experiences.",
    behaviours: [
      "Greets customers professionally.",
      "Understands customer preferences.",
      "Follows up with customers.",
      "Creates memorable customer experiences.",
      "Builds customer trust.",
    ],
  },
  {
    key: "communication",
    label: "Communication & Collaboration",
    description: "Communicates effectively and works well with the team.",
    behaviours: [
      "Communicates clearly.",
      "Supports teammates.",
      "Shares information proactively.",
      "Cooperates across departments.",
      "Maintains a positive team attitude.",
    ],
  },
  {
    key: "execution",
    label: "Execution",
    description:
      "Executes responsibilities consistently with discipline and reliability.",
    behaviours: [
      "Completes assigned tasks.",
      "Follows SOP consistently.",
      "Takes initiative without supervision.",
      "Responds quickly to operational needs.",
      "Demonstrates accountability.",
    ],
  },
  {
    key: "growth",
    label: "Growth to Influence",
    description:
      "Continuously improves oneself and positively influences others.",
    behaviours: [
      "Learns actively.",
      "Accepts feedback positively.",
      "Applies improvements consistently.",
      "Shares knowledge with teammates.",
      "Positively influences others through actions.",
    ],
  },
];

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type Scores = Record<AreaKey, number>;
type Notes = Record<AreaKey, string>;

const BLANK_SCORES: Scores = { customer: 0, communication: 0, execution: 0, growth: 0 };
const BLANK_NOTES: Notes = { customer: "", communication: "", execution: "", growth: "" };

const STORAGE_KEY = "odyssey.prototype.professional-performance.v1";

type Draft = { scores: Scores; notes: Notes };

function loadDraft(staffId: string, month: string): Draft {
  if (typeof window === "undefined") return { scores: { ...BLANK_SCORES }, notes: { ...BLANK_NOTES } };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { scores: { ...BLANK_SCORES }, notes: { ...BLANK_NOTES } };
    const all = JSON.parse(raw) as Record<string, Draft>;
    return all[`${staffId}::${month}`] ?? { scores: { ...BLANK_SCORES }, notes: { ...BLANK_NOTES } };
  } catch {
    return { scores: { ...BLANK_SCORES }, notes: { ...BLANK_NOTES } };
  }
}

function saveDraft(staffId: string, month: string, draft: Draft) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, Draft>) : {};
    all[`${staffId}::${month}`] = draft;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function ProfessionalPerformancePage() {
  const { role } = useRole();
  const canEvaluate = can(role, "evaluations.write");

  const [month, setMonth] = useState(monthKey());
  const [staffId, setStaffId] = useState<string>("");

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => listStaff(),
    enabled: canEvaluate,
  });

  const [scores, setScores] = useState<Scores>({ ...BLANK_SCORES });
  const [notes, setNotes] = useState<Notes>({ ...BLANK_NOTES });
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Load draft whenever staff/month changes.
  useEffect(() => {
    if (!staffId) {
      setScores({ ...BLANK_SCORES });
      setNotes({ ...BLANK_NOTES });
      return;
    }
    const d = loadDraft(staffId, month);
    setScores(d.scores);
    setNotes(d.notes);
  }, [staffId, month]);

  const average = useMemo(() => {
    const vals = Object.values(scores);
    const filled = vals.filter((v) => v > 0);
    if (!filled.length) return 0;
    return +(filled.reduce((a, b) => a + b, 0) / filled.length).toFixed(2);
  }, [scores]);

  function updateScore(key: AreaKey, value: number) {
    setScores((s) => ({ ...s, [key]: value }));
  }
  function updateNote(key: AreaKey, value: string) {
    setNotes((n) => ({ ...n, [key]: value }));
  }

  function handleSave() {
    if (!staffId) return;
    saveDraft(staffId, month, { scores, notes });
    setSavedAt(new Date().toLocaleTimeString());
  }

  function handleReset() {
    setScores({ ...BLANK_SCORES });
    setNotes({ ...BLANK_NOTES });
  }

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.35em] text-gold/70">
              Prototype V1 · Hunter
            </div>
            <h1 className="font-display text-xl font-semibold uppercase tracking-widest text-gold">
              Professional Performance
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              Contributes 50% of the Monthly Performance. Objective Performance (Monthly Sales)
              provides the other 50%. This prototype only captures scores — Monthly Grade,
              Rank Promotion, the 12-Month Rolling Window, Promotion Engine, and Legacy are
              intentionally not calculated here.
            </p>
          </div>
          <Link
            to="/"
            className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
          >
            ← Dashboard
          </Link>
        </header>

        <section className="mb-6 rounded-md border border-gold/30 bg-gold/5 p-4 text-xs text-gold/90">
          <div className="font-display uppercase tracking-[0.25em] text-gold">
            Evaluation Principle
          </div>
          <p className="mt-2 text-muted-foreground">
            Never score based on personal feelings. Every score must be supported by observable
            behaviours. The behaviour list below each area is a <span className="text-gold">reference guideline</span>,
            not a checklist — do not count how many behaviours were completed. Evaluate the crew
            member's overall <span className="text-gold">capability</span> demonstrated throughout the month.
          </p>
        </section>

        {!canEvaluate ? (
          <div className="rounded-md border border-border bg-ink/30 p-5 text-xs text-muted-foreground">
            Only Captains and Managers can record Professional Performance evaluations.
          </div>
        ) : (
          <>
            <section className="mb-6 grid gap-3 rounded-md border border-border bg-ink/30 p-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Team Member (Hunter)
                </span>
                <select
                  className="w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                >
                  <option value="">— Select team member —</option>
                  {staff.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.role}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Month
                </span>
                <input
                  type="month"
                  className="w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </label>
            </section>

            <div className="space-y-4">
              {AREAS.map((area) => (
                <AreaCard
                  key={area.key}
                  area={area}
                  score={scores[area.key]}
                  note={notes[area.key]}
                  onScore={(v) => updateScore(area.key, v)}
                  onNote={(v) => updateNote(area.key, v)}
                  disabled={!staffId}
                />
              ))}
            </div>

            <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-gold/30 bg-gold/5 p-4">
              <div className="text-xs text-muted-foreground">
                Professional Performance (prototype average):{" "}
                <span className="font-display text-lg text-gold">{average || "—"}</span>
                <span className="ml-1 text-[10px] uppercase tracking-widest text-gold/60">/ 100</span>
              </div>
              <div className="flex items-center gap-2">
                {savedAt && (
                  <span className="text-[10px] uppercase tracking-widest text-emerald-300">
                    Saved locally · {savedAt}
                  </span>
                )}
                <button
                  onClick={handleReset}
                  disabled={!staffId}
                  className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-red-400/40 hover:text-red-200 disabled:opacity-50"
                >
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={!staffId}
                  className="rounded-md border border-gold bg-gold/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-gold hover:bg-gold/20 disabled:opacity-50"
                >
                  Save Draft
                </button>
              </div>
            </section>

            <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              Prototype only · saved to this device · not connected to grading, promotion, or legacy
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function AreaCard({
  area,
  score,
  note,
  onScore,
  onNote,
  disabled,
}: {
  area: Area;
  score: number;
  note: string;
  onScore: (v: number) => void;
  onNote: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <article className="rounded-md border border-border bg-ink/30 p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">
            {area.label}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{area.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            disabled={disabled}
            value={score || ""}
            placeholder="0"
            onChange={(e) => onScore(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
            className="w-20 rounded-md border border-border bg-ink/60 px-3 py-2 text-right text-sm text-foreground focus:border-gold focus:outline-none disabled:opacity-50"
          />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">/ 100</span>
        </div>
      </header>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-border/60 bg-black/20 p-3">
          <div className="mb-2 text-[10px] uppercase tracking-widest text-gold/70">
            Behaviour reference · guideline, not checklist
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {area.behaviours.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="text-gold/60">◇</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Captain's observation notes
          </span>
          <textarea
            rows={7}
            disabled={disabled}
            value={note}
            onChange={(e) => onNote(e.target.value)}
            placeholder="Cite the observable behaviours that support this score."
            className="w-full resize-none rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none disabled:opacity-50"
          />
        </label>
      </div>
    </article>
  );
}
