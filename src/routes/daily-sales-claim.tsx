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
const ACCEPT = "image/*";
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

type UploadPhase = "idle" | "uploading" | "success" | "error";

type Picked = {
  id: string;
  file: File;
  previewUrl: string;
  sizeKB: number;
};

function SubmitDailySales() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const [salesDate, setSalesDate] = useState<string>(todayIso());
  const [amount, setAmount] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [picked, setPicked] = useState<Picked[]>([]);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [message, setMessage] = useState<string>("");

  // Revoke preview URLs on unmount.
  useEffect(() => {
    return () => picked.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleNativeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    const count = list ? list.length : 0;
    console.log("[uploader] native change fired. FileList length =", count);

    if (!list || count === 0) {
      setMessage("No file selected.");
      return;
    }

    const next: Picked[] = [];
    for (let i = 0; i < list.length; i++) {
      const f = list.item(i);
      if (!f) continue;
      console.log("[uploader] file", i, { name: f.name, size: f.size, type: f.type });
      if (f.size === 0) {
        setMessage(`Skipped empty file: ${f.name}`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        setMessage(`Skipped (>10MB): ${f.name}`);
        continue;
      }
      next.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        previewUrl: URL.createObjectURL(f),
        sizeKB: Math.max(1, Math.round(f.size / 1024)),
      });
    }

    setPicked((prev) => {
      const merged = [...prev, ...next];
      if (merged[0]) {
        const f0 = merged[0].file;
        console.log("[proof] AFTER onChange picked[0].file =", f0);
        console.log("[proof] AFTER onChange meta =", {
          name: f0.name,
          size: f0.size,
          type: f0.type,
          lastModified: f0.lastModified,
          isFile: f0 instanceof File,
          isBlob: f0 instanceof Blob,
        });
      }
      return merged;
    });
    setPhase("idle");
    if (next.length) {
      setMessage(`${next.length} file(s) ready to upload.`);
    }
  }


  function removePicked(id: string) {
    setPicked((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  const submit = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not signed in.");
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt < 0) throw new Error("Enter a valid sales amount.");
      if (!salesDate) throw new Error("Pick a date.");
      if (picked.length === 0) throw new Error("Attach at least one evidence image.");

      setPhase("uploading");
      setMessage(`Uploading 0 / ${picked.length}…`);

      const paths: string[] = [];
      for (let i = 0; i < picked.length; i++) {
        const p = picked[i];
        const safe = p.file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "image.jpg";
        const path = `${user.id}/${Date.now()}-${i}-${safe}`;
        console.log("[uploader] uploading", { path, size: p.file.size, type: p.file.type });
        const res = await supabase.storage
          .from("daily-sales-evidence")
          .upload(path, p.file, {
            upsert: false,
            contentType: p.file.type || "application/octet-stream",
          });
        if (res.error) {
          console.error("[uploader] upload error", res.error);
          throw new Error(`Upload failed (${p.file.name}): ${res.error.message}`);
        }
        paths.push(path);
        setMessage(`Uploading ${i + 1} / ${picked.length}…`);
      }

      setMessage("Saving claim record…");
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
      picked.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPicked([]);
      setAmount("");
      setRemarks("");
      setSalesDate(todayIso());
      setPhase("success");
      setMessage("Upload successful — claim submitted (Pending Review).");
    },
    onError: (e: any) => {
      console.error("[uploader] submit onError", e);
      setPhase("error");
      setMessage(`Upload failed: ${e?.message ?? "Unknown error"}`);
    },
  });

  const phaseBadge = (() => {
    if (phase === "uploading")
      return { text: "Uploading…", cls: "border-gold/50 bg-gold/10 text-gold" };
    if (phase === "success")
      return { text: "Upload successful", cls: "border-emerald-400/50 bg-emerald-400/10 text-emerald-200" };
    if (phase === "error")
      return { text: "Upload failed", cls: "border-red-500/50 bg-red-500/10 text-red-200" };
    return {
      text: picked.length === 0 ? "No file selected" : `${picked.length} file(s) ready`,
      cls: "border-border bg-ink/60 text-muted-foreground",
    };
  })();

  const canSubmit =
    !!user?.id && !!salesDate && !!amount && picked.length > 0 && phase !== "uploading";

  return (
    <section className="rounded-md border border-border bg-ink/30 p-5">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">New Daily Sales</h2>
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage("");
          submit.mutate();
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

        {/* Native, visible, directly-clickable file input — no hidden input, no programmatic trigger. */}
        <div className="space-y-3">
          <div>
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
              Evidence Images (jpg / png / webp / heic · max 10MB each)
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleNativeChange}
              disabled={phase === "uploading"}
              className="block w-full cursor-pointer rounded-md border border-gold/40 bg-ink/60 p-2 text-xs text-foreground file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-gold/20 file:px-3 file:py-2 file:font-display file:text-[10px] file:uppercase file:tracking-widest file:text-gold hover:file:bg-gold/30"
            />
          </div>

          <div className={`rounded border px-3 py-2 text-[11px] uppercase tracking-widest ${phaseBadge.cls}`}>
            {phaseBadge.text}
          </div>

          {picked.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {picked.map((p) => (
                <li
                  key={p.id}
                  className="overflow-hidden rounded-md border border-border bg-ink/40"
                >
                  <div className="aspect-square w-full bg-black/40">
                    <img
                      src={p.previewUrl}
                      alt={p.file.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="px-2 py-1">
                    <div className="truncate text-[11px] text-foreground" title={p.file.name}>
                      {p.file.name}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{p.sizeKB} KB</span>
                      <button
                        type="button"
                        onClick={() => removePicked(p.id)}
                        disabled={phase === "uploading"}
                        className="rounded border border-red-400/40 px-1.5 py-0.5 text-red-200 hover:bg-red-500/20 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
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

        {message && (
          <div
            className={
              phase === "error"
                ? "rounded border border-red-500/40 bg-red-500/5 px-3 py-2 text-xs text-red-200"
                : phase === "success"
                ? "rounded border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200"
                : "rounded border border-gold/30 bg-gold/5 px-3 py-2 text-xs text-gold"
            }
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-md border border-gold bg-gold/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-gold hover:bg-gold/20 disabled:opacity-50"
        >
          {phase === "uploading" ? "Uploading…" : "Submit Claim"}
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
