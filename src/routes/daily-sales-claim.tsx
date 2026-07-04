import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { useAuth } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyHunterStatus,
  listMyDailySales,
  signDailySalesEvidence,
  submitDailySales,
  type DailySalesClaim,
} from "@/lib/daily-sales.functions";

export const Route = createFileRoute("/daily-sales-claim")({
  head: () => ({
    meta: [
      { title: "Daily Sales Claim — The Odyssey Guide" },
      { name: "description", content: "Hunters record daily sales totals with supporting evidence for manager review." },
    ],
  }),
  component: () => (
    <AuthGate>
      <DailySalesPage />
    </AuthGate>
  ),
});

const inputCls =
  "w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB / image
const ACCEPT = "image/*,.heic,.heif";
const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  gif: "image/gif",
};
function resolveImageMime(file: File): string | null {
  if (file.type && file.type.startsWith("image/")) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MIME[ext] ?? null;
}

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function DailySalesPage() {
  const { data: hunter, isLoading } = useQuery({
    queryKey: ["daily-sales", "hunter-status"],
    queryFn: () => getMyHunterStatus(),
  });

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.35em] text-gold/70">
              Hunter · Records
            </div>
            <h1
              className="mt-1 text-2xl uppercase tracking-wide sm:text-3xl"
              style={{ fontFamily: "'Cinzel', serif", color: "#E5E7EB", textShadow: "0 0 30px rgba(212,168,75,0.35)" }}
            >
              Daily Sales Claim
            </h1>
            <p className="mt-1 text-xs italic text-muted-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Log today's sales. Attach receipts, invoices, POS screenshots. Awaits Manager review.
            </p>
          </div>
          <Link
            to="/"
            className="rounded-md border border-border px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
          >
            ← Home
          </Link>
        </header>

        {isLoading ? (
          <div className="rounded-md border border-border bg-ink/30 p-6 text-center text-xs text-muted-foreground">
            Loading…
          </div>
        ) : !hunter?.isHunter ? (
          <div className="rounded-md border border-red-500/40 bg-red-500/5 p-6 text-center text-sm text-red-200">
            Daily Sales Claim is available to Hunter accounts only.
          </div>
        ) : (
          <div className="space-y-8">
            <SubmitDailySales />
            <SubmissionHistory />
          </div>
        )}
      </div>
    </div>
  );
}

function SubmitDailySales() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [salesDate, setSalesDate] = useState<string>(todayIso());
  const [amount, setAmount] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function onPickFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    const valid: File[] = [];
    const errors: string[] = [];
    for (const f of incoming) {
      const mime = resolveImageMime(f);
      if (!mime) {
        errors.push(`Unsupported: ${f.name}`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        errors.push(`Too large (>10MB): ${f.name}`);
        continue;
      }
      // Attach resolved mime for later upload
      (f as any).__mime = mime;
      valid.push(f);
    }
    if (errors.length) setMsg(errors.join(" · "));
    else if (valid.length) setMsg(null);
    setFiles((prev) => [...prev, ...valid]);
  }

  function removeAt(i: number) {
    setFiles((prev) => prev.filter((_, j) => j !== i));
  }

  const submit = useMutation({
    mutationFn: async () => {
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt < 0) throw new Error("Enter a valid sales amount.");
      if (!salesDate) throw new Error("Pick a date.");
      if (!user?.id) throw new Error("Not signed in.");

      const paths: string[] = [];
      for (const file of files) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
        const up = await supabase.storage
          .from("daily-sales-evidence")
          .upload(path, file, { upsert: false, contentType: file.type });
        if (up.error) throw up.error;
        paths.push(path);
      }

      return submitDailySales({
        data: {
          sales_date: salesDate,
          total_amount: amt,
          evidence_files: paths,
          remarks,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-sales", "history"] });
      setAmount("");
      setRemarks("");
      setFiles([]);
      setSalesDate(todayIso());
      setMsg("Submitted — Pending Review.");
    },
    onError: (e: any) => setMsg(e?.message ?? "Failed to submit."),
  });

  return (
    <section className="rounded-md border border-border bg-ink/30 p-5">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">New Daily Sales</h2>
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          setMsg(null);
          submit.mutate(undefined, { onSettled: () => setBusy(false) });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Date</span>
            <input
              type="date"
              className={inputCls}
              value={salesDate}
              max={todayIso()}
              onChange={(e) => setSalesDate(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
              Total Sales Amount (RM)
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className={inputCls}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </label>
        </div>

        <div>
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Evidence — receipts, invoices, POS or sales screenshots (jpg / png / webp / heic, 10MB each)
          </span>
          <input
            type="file"
            multiple
            accept={ACCEPT}
            onChange={(e) => {
              onPickFiles(e.target.files);
              e.target.value = "";
            }}
            className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded file:border file:border-gold/40 file:bg-gold/10 file:px-3 file:py-1.5 file:text-[10px] file:font-display file:uppercase file:tracking-widest file:text-gold hover:file:bg-gold/20"
          />
          {!!files.length && (
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {files.map((f, i) => (
                <li key={i} className="group relative overflow-hidden rounded-md border border-border bg-ink/40">
                  <div className="aspect-square w-full">
                    {previews[i] ? (
                      <img src={previews[i]} alt={f.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                        {f.name}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    aria-label={`Remove ${f.name}`}
                    className="absolute right-1 top-1 rounded-full border border-red-400/50 bg-black/60 px-2 py-0.5 text-[10px] text-red-200 opacity-90 hover:bg-red-500/30"
                  >
                    ✕
                  </button>
                  <div className="truncate border-t border-border/60 px-2 py-1 text-[10px] text-muted-foreground">
                    {(f.size / 1024).toFixed(0)} KB
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Remarks (optional)
          </span>
          <textarea
            rows={3}
            className={inputCls}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Notes for your manager…"
          />
        </label>

        {msg && (
          <div className="rounded border border-gold/30 bg-gold/5 px-3 py-2 text-xs text-gold">{msg}</div>
        )}

        <button
          type="submit"
          disabled={busy || !amount || !salesDate}
          className="w-full rounded-md border border-gold bg-gold/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-gold hover:bg-gold/20 disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Submit Claim"}
        </button>
      </form>
    </section>
  );
}

function StatusPill({ s }: { s: string }) {
  const label = s === "pending" ? "Pending Review" : s;
  return (
    <span className="rounded border border-gold/40 bg-gold/5 px-2 py-0.5 font-display text-[10px] uppercase tracking-widest text-gold">
      {label}
    </span>
  );
}

function fmtRM(n: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function fmtTs(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SubmissionHistory() {
  const { data: rows = [], isLoading } = useQuery<DailySalesClaim[]>({
    queryKey: ["daily-sales", "history"],
    queryFn: () => listMyDailySales(),
  });

  return (
    <section className="rounded-md border border-border bg-ink/30 p-5">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">Submission History</h2>
      {isLoading ? (
        <div className="py-6 text-center text-xs text-muted-foreground">Loading…</div>
      ) : !rows.length ? (
        <div className="py-8 text-center text-xs text-muted-foreground">No submissions yet.</div>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((r) => (
            <HistoryRow key={r.id} row={r} />
          ))}
        </ul>
      )}
    </section>
  );
}

function HistoryRow({ row }: { row: DailySalesClaim }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-md border border-border bg-ink/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm text-foreground">{fmtDate(row.sales_date)}</span>
            <StatusPill s={row.status} />
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Submitted {fmtTs(row.created_at)} · {row.evidence_files.length} evidence
          </div>
        </div>
        <div className="font-display text-sm text-gold">{fmtRM(Number(row.total_amount))}</div>
      </button>
      {open && (
        <div className="border-t border-border/60 px-3 py-3">
          {row.remarks && (
            <div className="mb-3 text-xs text-muted-foreground">
              <span className="mr-1 text-[10px] uppercase tracking-widest text-gold/70">Remarks:</span>
              {row.remarks}
            </div>
          )}
          {row.evidence_files.length > 0 ? (
            <EvidenceGallery paths={row.evidence_files} />
          ) : (
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">No evidence attached.</div>
          )}
        </div>
      )}
    </li>
  );
}

function EvidenceGallery({ paths }: { paths: string[] }) {
  const { data: urls = {} } = useQuery<Record<string, string>>({
    queryKey: ["daily-sales", "signed", ...paths],
    queryFn: () => signDailySalesEvidence({ data: { paths } }),
    staleTime: 60_000 * 20,
  });
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
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
