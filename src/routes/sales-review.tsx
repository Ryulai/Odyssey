import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { useRole } from "@/lib/roles";
import {
  decideDailySales,
  listSalesForReview,
  signSalesEvidenceForReview,
  type DailySalesReviewRow,
} from "@/lib/daily-sales.functions";

export const Route = createFileRoute("/sales-review")({
  head: () => ({
    meta: [
      { title: "Daily Sales Review — The Odyssey Guide" },
      { name: "description", content: "Captains and Managers review, approve, or reject Hunter Daily Sales Claims." },
    ],
  }),
  component: () => (
    <AuthGate>
      <SalesReviewPage />
    </AuthGate>
  ),
});

type StatusFilter = "pending" | "approved" | "rejected" | "all";

function SalesReviewPage() {
  const { role } = useRole();
  const isReviewer = role === "manager" || role === "director";

  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["sales-review", filter],
    queryFn: () => listSalesForReview({ data: { status: filter } }),
    enabled: isReviewer,
  });

  const open = useMemo(() => rows.find((r) => r.id === openId) ?? null, [rows, openId]);

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.35em] text-gold/70">
              Captain · Review Desk
            </div>
            <h1
              className="mt-1 text-2xl uppercase tracking-wide sm:text-3xl"
              style={{ fontFamily: "'Cinzel', serif", color: "#E5E7EB", textShadow: "0 0 30px rgba(212,168,75,0.35)" }}
            >
              Daily Sales Review
            </h1>
            <p className="mt-1 text-xs italic text-muted-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Review Hunter Daily Sales Claims. Approve or reject with reason.
            </p>
          </div>
          <Link
            to="/"
            className="rounded-md border border-border px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
          >
            ← Home
          </Link>
        </header>

        {!isReviewer ? (
          <div className="rounded-md border border-red-500/40 bg-red-500/5 p-6 text-center text-sm text-red-200">
            This page is available to Captain, Manager and Admin accounts only.
          </div>
        ) : open ? (
          <ReviewDetail row={open} onBack={() => setOpenId(null)} />
        ) : (
          <>
            <FilterBar filter={filter} setFilter={setFilter} />
            {isLoading ? (
              <div className="mt-6 rounded-md border border-border bg-ink/30 p-6 text-center text-xs text-muted-foreground">
                Loading…
              </div>
            ) : error ? (
              <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-200">
                {(error as Error).message}
              </div>
            ) : (
              <ReviewTable rows={rows} onOpen={setOpenId} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FilterBar({ filter, setFilter }: { filter: StatusFilter; setFilter: (v: StatusFilter) => void }) {
  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "pending", label: "Pending Review" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setFilter(t.key)}
          className={`rounded-md border px-3 py-1.5 font-display text-[10px] uppercase tracking-widest transition ${
            filter === t.key
              ? "border-gold bg-gold/10 text-gold"
              : "border-border bg-ink/30 text-muted-foreground hover:border-gold/40 hover:text-gold"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function StatusPill({ s }: { s: string }) {
  const map: Record<string, string> = {
    pending: "border-gold/40 bg-gold/5 text-gold",
    approved: "border-emerald-400/50 bg-emerald-400/10 text-emerald-300",
    rejected: "border-red-500/50 bg-red-500/10 text-red-300",
  };
  const label = s === "pending" ? "Pending Review" : s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <span className={`rounded border px-2 py-0.5 font-display text-[10px] uppercase tracking-widest ${map[s] ?? map.pending}`}>
      {label}
    </span>
  );
}

function fmtRM(n: number | string) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(Number(n));
}
function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "2-digit",
  });
}
function fmtTs(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}
function classLabel(cls: string | null, role: string | null) {
  if (!cls) return "—";
  const capped = cls.charAt(0).toUpperCase() + cls.slice(1);
  if (!role) return capped;
  return `${capped} · ${role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`;
}

function ReviewTable({ rows, onOpen }: { rows: DailySalesReviewRow[]; onOpen: (id: string) => void }) {
  if (!rows.length) {
    return (
      <div className="mt-6 rounded-md border border-border bg-ink/30 p-10 text-center text-xs text-muted-foreground">
        No submissions in this view.
      </div>
    );
  }
  return (
    <div className="mt-6 overflow-hidden rounded-md border border-border bg-ink/30">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-ink/60 text-[10px] uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Employee</th>
            <th className="px-3 py-2 text-left">Primary Class</th>
            <th className="px-3 py-2 text-left">Business Unit</th>
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-right">Total Sales</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-ink/50">
              <td className="px-3 py-2 font-display text-foreground">{r.staff.name}</td>
              <td className="px-3 py-2 text-muted-foreground">{classLabel(r.staff.primary_class, r.staff.primary_role)}</td>
              <td className="px-3 py-2 text-muted-foreground">{r.staff.business_unit || "—"}</td>
              <td className="px-3 py-2 text-muted-foreground">{fmtDate(r.sales_date)}</td>
              <td className="px-3 py-2 text-right font-display text-gold">{fmtRM(r.total_amount)}</td>
              <td className="px-3 py-2"><StatusPill s={r.status} /></td>
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => onOpen(r.id)}
                  className="rounded border border-gold/50 bg-gold/10 px-2 py-1 font-display text-[10px] uppercase tracking-widest text-gold hover:bg-gold/20"
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewDetail({ row, onBack }: { row: DailySalesReviewRow; onBack: () => void }) {
  const qc = useQueryClient();
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState(row.decision_notes || "");
  const [msg, setMsg] = useState<string | null>(null);

  const decide = useMutation({
    mutationFn: (decision: "approved" | "rejected") =>
      decideDailySales({ data: { id: row.id, decision, decision_notes: decision === "rejected" ? reason : "" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-review"] });
      onBack();
    },
    onError: (e: any) => setMsg(e?.message ?? "Failed."),
  });

  const readonly = row.status !== "pending";

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="rounded-md border border-border px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
      >
        ← Back
      </button>

      <section className="rounded-md border border-border bg-ink/30 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.3em] text-gold/70">Employee</div>
            <div className="mt-1 font-display text-lg text-foreground">{row.staff.name}</div>
            <div className="text-xs text-muted-foreground">
              {classLabel(row.staff.primary_class, row.staff.primary_role)} · {row.staff.business_unit || "—"}
            </div>
          </div>
          <div className="text-right">
            <StatusPill s={row.status} />
            <div className="mt-2 font-display text-2xl text-gold">{fmtRM(row.total_amount)}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {fmtDate(row.sales_date)}
            </div>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Submitted At</dt>
            <dd className="mt-0.5 font-display text-foreground">{fmtTs(row.created_at)}</dd>
          </div>
          {row.reviewed_at && (
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">Reviewed</dt>
              <dd className="mt-0.5 font-display text-foreground">
                {fmtTs(row.reviewed_at)} · {row.reviewer_name ?? "Reviewer"}
              </dd>
            </div>
          )}
        </dl>

        {row.remarks && (
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Hunter Remarks</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{row.remarks}</p>
          </div>
        )}

        {row.status === "rejected" && row.decision_notes && (
          <div className="mt-4 rounded border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-200">
            <div className="text-[10px] uppercase tracking-widest text-red-300/80">Rejection Reason</div>
            <p className="mt-1 whitespace-pre-wrap">{row.decision_notes}</p>
          </div>
        )}
      </section>

      <section className="rounded-md border border-border bg-ink/30 p-5">
        <h3 className="font-display text-sm uppercase tracking-[0.25em] text-gold">Evidence</h3>
        {row.evidence_files.length ? (
          <EvidenceGallery paths={row.evidence_files} />
        ) : (
          <div className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground">
            No evidence attached.
          </div>
        )}
      </section>

      {!readonly && (
        <section className="rounded-md border border-border bg-ink/30 p-5">
          <h3 className="font-display text-sm uppercase tracking-[0.25em] text-gold">Decision</h3>
          {rejectMode ? (
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Rejection reason (required)
                </span>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none"
                  placeholder="Explain why this submission is rejected…"
                />
              </label>
              {msg && <div className="rounded border border-red-500/40 bg-red-500/5 px-3 py-2 text-xs text-red-200">{msg}</div>}
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={decide.isPending || !reason.trim()}
                  onClick={() => decide.mutate("rejected")}
                  className="rounded-md border border-red-500 bg-red-500/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                >
                  {decide.isPending ? "Rejecting…" : "Confirm Reject"}
                </button>
                <button
                  onClick={() => { setRejectMode(false); setMsg(null); }}
                  className="rounded-md border border-border px-4 py-2 font-display text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                disabled={decide.isPending}
                onClick={() => decide.mutate("approved")}
                className="rounded-md border border-emerald-400 bg-emerald-400/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-emerald-200 hover:bg-emerald-400/20 disabled:opacity-50"
              >
                {decide.isPending ? "Approving…" : "Approve"}
              </button>
              <button
                onClick={() => setRejectMode(true)}
                className="rounded-md border border-red-500 bg-red-500/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-red-200 hover:bg-red-500/20"
              >
                Reject
              </button>
              <button
                onClick={onBack}
                className="rounded-md border border-border px-4 py-2 font-display text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
              >
                Back
              </button>
            </div>
          )}
          {msg && !rejectMode && (
            <div className="mt-3 rounded border border-red-500/40 bg-red-500/5 px-3 py-2 text-xs text-red-200">{msg}</div>
          )}
        </section>
      )}
    </div>
  );
}

function EvidenceGallery({ paths }: { paths: string[] }) {
  const { data: urls = {} } = useQuery<Record<string, string>>({
    queryKey: ["sales-review", "signed", ...paths],
    queryFn: () => signSalesEvidenceForReview({ data: { paths } }),
    staleTime: 60_000 * 20,
  });
  return (
    <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {paths.map((p) => (
        <li key={p} className="overflow-hidden rounded border border-border bg-ink/60">
          <div className="aspect-square w-full">
            {urls[p] ? (
              <a href={urls[p]} target="_blank" rel="noreferrer">
                <img src={urls[p]} alt="evidence" className="h-full w-full object-cover" />
              </a>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                Loading…
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
