import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { useAuth, useRole, can } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import { listAchievements, listStaff } from "@/lib/config.functions";
import { listClaims, submitClaim, decideClaim, listMyRecords, testMinimalClaimInsert } from "@/lib/claims.functions";

export const Route = createFileRoute("/claims")({
  head: () => ({ meta: [{ title: "Harbor Records — The Odyssey Guide" }] }),
  component: () => <AuthGate><ClaimsPage /></AuthGate>,
});

const inputCls = "w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none";
const MAX_FILES = 10;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB / file
const ACCEPT = "image/*,application/pdf,.jpg,.jpeg,.png,.webp,.pdf,.heic,.heif";
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"]);
const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  heic: "image/heic", heif: "image/heif", pdf: "application/pdf",
};
function resolveMime(f: File): string {
  if (f.type && ALLOWED.has(f.type)) return f.type;
  const ext = (f.name.split(".").pop() ?? "").toLowerCase();
  return EXT_MIME[ext] ?? f.type ?? "";
}

function ClaimsPage() {
  const { user } = useAuth();
  const { role } = useRole();
  const isReviewer = can(role, "claims.review");

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">Harbor Records</div>
            <div className="text-xs text-muted-foreground">Record your voyages, attach voyage proof, await harbor approval.</div>
          </div>
          <Link to="/" className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">← Ledger</Link>
        </header>

        <MinimalInsertTest />



        <div className="grid gap-6 lg:grid-cols-2">
          <SubmitClaim userId={user?.id ?? null} />
          <MyRecords />
        </div>

        <div className="mt-8">
          {isReviewer ? <ReviewQueue /> : <MyClaims userId={user?.id ?? null} />}
        </div>
      </div>
    </div>
  );
}

function MinimalInsertTest() {
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const r = await testMinimalClaimInsert();
      console.log("[minimal-claim-test]", r);
      setResult(r);
    } catch (e: any) {
      console.error("[minimal-claim-test] threw", e);
      setResult({ ok: false, step: "threw", error: { message: e?.message ?? String(e) } });
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="mb-6 rounded-md border border-red-500/40 bg-red-500/5 p-5">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-red-200">
        🧪 Minimal Insert Test
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Inserts the smallest possible row into <code>achievement_claims</code> (staff_id + achievement_id + submitted_by).
        All other columns fall back to DB defaults. Use this to isolate which field breaks the Harbor Records submission.
      </p>
      <button
        type="button"
        onClick={run}
        disabled={running}
        className="mt-3 rounded-md border border-red-400 bg-red-500/10 px-4 py-2 font-display text-[11px] uppercase tracking-widest text-red-100 hover:bg-red-500/20 disabled:opacity-50"
      >
        {running ? "Running…" : "Run Minimal Insert"}
      </button>
      {result && (
        <pre className="mt-3 overflow-x-auto rounded border border-border bg-black/50 p-3 text-[11px] text-foreground">
{JSON.stringify(result, null, 2)}
        </pre>
      )}
    </section>
  );
}

function SubmitClaim({ userId }: { userId: string | null }) {
  const qc = useQueryClient();
  const { data: staff = [] } = useQuery({ queryKey: ["staff"], queryFn: () => listStaff() });
  const { data: achs = [] } = useQuery({ queryKey: ["achievements"], queryFn: () => listAchievements() });
  const myStaff = useMemo(() => staff.find((s: any) => s.user_id === userId), [staff, userId]);

  const [achievementId, setAchievementId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [evidence, setEvidence] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const effectiveStaffId = staffId || myStaff?.id || "";

  function onPickFiles(list: FileList | null) {
    console.log("[claims][upload] onPickFiles", { count: list?.length ?? 0 });
    if (!list || !list.length) { setMsg("No file received from picker."); return; }
    const incoming = Array.from(list);
    const valid: File[] = [];
    const errors: string[] = [];
    for (const f of incoming) {
      const mime = resolveMime(f);
      console.log("[claims][upload] file", { name: f.name, size: f.size, type: f.type, resolved: mime });
      if (!ALLOWED.has(mime)) { errors.push(`Unsupported: ${f.name} (${f.type || "unknown"})`); continue; }
      if (f.size === 0) { errors.push(`Empty: ${f.name}`); continue; }
      if (f.size > MAX_BYTES) { errors.push(`Too large (>10MB): ${f.name}`); continue; }
      (f as any).__mime = mime;
      valid.push(f);
    }
    const merged = [...files, ...valid].slice(0, MAX_FILES);
    if (files.length + valid.length > MAX_FILES) errors.push(`Maximum ${MAX_FILES} files.`);
    setFiles(merged);
    if (errors.length) setMsg(errors.join(" · "));
    else if (valid.length) setMsg(`${valid.length} file(s) selected.`);
  }

  const submit = useMutation({
    mutationFn: async () => {
      const paths: string[] = [];
      if (userId && files.length) {
        for (const file of files) {
          const mime = (file as any).__mime || resolveMime(file);
          const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
          const up = await supabase.storage.from("claim-evidence").upload(path, file, { upsert: false, contentType: mime });
          if (up.error) throw up.error;
          paths.push(path);
        }
      }
      return submitClaim({ data: {
        staff_id: effectiveStaffId,
        achievement_id: achievementId,
        evidence_text: evidence,
        evidence_files: paths,
        notes,
      }});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["claims"] });
      setMsg("Voyage recorded. Awaiting harbor review.");
      setEvidence(""); setNotes(""); setFiles([]); setAchievementId("");
    },
    onError: (e: any) => setMsg(e.message ?? "Failed"),
  });

  return (
    <section className="rounded-md border border-border bg-ink/30 p-5">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">Record a Voyage</h2>
      <form onSubmit={(e) => { e.preventDefault(); if (!achievementId || !effectiveStaffId) return; setBusy(true); submit.mutate(undefined, { onSettled: () => setBusy(false) }); }}
        className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Navigator (crew)</span>
          <select className={inputCls} value={effectiveStaffId} onChange={e => setStaffId(e.target.value)} required>
            <option value="">— Select —</option>
            {staff.map((s: any) => <option key={s.id} value={s.id}>{s.name}{s.user_id === userId ? " (me)" : ""}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Achievement Type</span>
          <select className={inputCls} value={achievementId} onChange={e => setAchievementId(e.target.value)} required>
            <option value="">— Select —</option>
            {achs.map((a: any) => <option key={a.id} value={a.id}>{a.name} (★ {a.star_reward})</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Voyage Proof (text)</span>
          <textarea rows={3} className={inputCls} value={evidence} onChange={e => setEvidence(e.target.value)}
            placeholder="Describe what you did, deal IDs, links…" />
        </label>
        <div>
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
            Voyage Proof Files — jpg, png, webp, pdf · up to {MAX_FILES}, 10MB each
          </span>
          <input
            type="file"
            multiple
            accept={ACCEPT}
            onClick={(e) => { (e.currentTarget as HTMLInputElement).value = ""; }}
            onChange={(e) => { console.log("[claims][upload] native onChange", e.currentTarget.files?.length ?? 0); onPickFiles(e.currentTarget.files); }}
            className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded file:border file:border-gold/40 file:bg-gold/10 file:px-3 file:py-1.5 file:text-[10px] file:font-display file:uppercase file:tracking-widest file:text-gold hover:file:bg-gold/20"
          />
          {!!files.length && (
            <ul className="mt-2 space-y-1">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded border border-border bg-ink/40 px-2 py-1 text-xs">
                  <span className="truncate">{f.name} <span className="text-muted-foreground">· {(f.size / 1024).toFixed(0)} KB</span></span>
                  <button type="button" onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-300">remove</button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Captain Notes</span>
          <textarea rows={2} className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} />
        </label>
        {msg && <div className="rounded border border-gold/30 bg-gold/5 px-3 py-2 text-xs text-gold">{msg}</div>}
        <button type="submit" disabled={busy || !achievementId || !effectiveStaffId}
          className="w-full rounded-md border border-gold bg-gold/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-gold hover:bg-gold/20 disabled:opacity-50">
          {busy ? "Recording…" : "Record Voyage"}
        </button>
      </form>
    </section>
  );
}

function StatusPill({ s }: { s: string }) {
  const cls =
    s === "approved" ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
    : s === "rejected" ? "border-red-500/50 bg-red-500/10 text-red-300"
    : "border-gold/40 bg-gold/5 text-gold";
  return <span className={`rounded border px-2 py-0.5 font-display text-[10px] uppercase tracking-widest ${cls}`}>{s}</span>;
}

function MyClaims({ userId }: { userId: string | null }) {
  const { data: claims = [], isLoading } = useQuery({ queryKey: ["claims"], queryFn: () => listClaims() });
  const mine = claims.filter((c: any) => c.submitted_by === userId);
  return (
    <section className="rounded-md border border-border bg-ink/30 p-5">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">My Voyages</h2>
      {isLoading ? <div className="py-4 text-xs text-muted-foreground">Loading…</div> : (
        <div className="mt-4 space-y-2">
          {mine.map((c: any) => <ClaimCard key={c.id} c={c} />)}
          {!mine.length && <div className="py-6 text-center text-xs text-muted-foreground">No voyages recorded yet.</div>}
        </div>
      )}
    </section>
  );
}

function ReviewQueue() {
  const qc = useQueryClient();
  const { data: claims = [], isLoading } = useQuery({ queryKey: ["claims"], queryFn: () => listClaims() });
  const decide = useMutation({ mutationFn: (d: any) => decideClaim({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["claims"] }); qc.invalidateQueries({ queryKey: ["records"] }); } });

  return (
    <section className="rounded-md border border-border bg-ink/30 p-5">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">Harbor Review Queue</h2>
      {isLoading ? <div className="py-4 text-xs text-muted-foreground">Loading…</div> : (
        <div className="mt-4 space-y-2">
          {claims.map((c: any) => (
            <ClaimCard key={c.id} c={c} action={c.status === "pending" ? (
              <div className="flex shrink-0 gap-2">
                <button onClick={() => decide.mutate({ id: c.id, decision: "approved" })}
                  className="rounded border border-emerald-400/50 px-3 py-1 text-xs uppercase tracking-widest text-emerald-300 hover:bg-emerald-400/10">Approve</button>
                <button onClick={() => {
                  const note = window.prompt("Reason for rejection?") ?? "";
                  decide.mutate({ id: c.id, decision: "rejected", decision_notes: note });
                }}
                  className="rounded border border-red-500/50 px-3 py-1 text-xs uppercase tracking-widest text-red-300 hover:bg-red-500/10">Reject</button>
              </div>
            ) : null} />
          ))}
          {!claims.length && <div className="py-6 text-center text-xs text-muted-foreground">No voyages recorded yet.</div>}
        </div>
      )}
    </section>
  );
}

function ClaimCard({ c, action }: { c: any; action?: React.ReactNode }) {
  const paths: string[] = useMemo(() => {
    const arr = Array.isArray(c.evidence_files) ? c.evidence_files.filter(Boolean) : [];
    if (!arr.length && c.evidence_url) return [c.evidence_url];
    return arr;
  }, [c.evidence_files, c.evidence_url]);

  return (
    <div className="rounded-md border border-border bg-ink/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium">{c.achievement?.name ?? "?"}</div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">★ {c.achievement?.star_reward ?? 0}</span>
            <StatusPill s={c.status} />
          </div>
          <div className="text-xs text-muted-foreground">
            {c.staff?.name} · submitted {new Date(c.created_at).toLocaleString()}
            {c.decided_at && <> · decided {new Date(c.decided_at).toLocaleString()}</>}
          </div>
          {c.evidence_text && <div className="mt-2 text-sm">{c.evidence_text}</div>}
          {c.notes && <div className="mt-1 text-xs italic text-muted-foreground">Captain Notes: {c.notes}</div>}
          {!!paths.length && <EvidenceGallery paths={paths} />}
          {c.decision_notes && <div className="mt-2 text-xs text-red-300">Reviewer: {c.decision_notes}</div>}
        </div>
        {action}
      </div>
    </div>
  );
}

function EvidenceGallery({ paths }: { paths: string[] }) {
  const [active, setActive] = useState<{ url: string; type: "image" | "pdf"; name: string } | null>(null);
  const [items, setItems] = useState<Array<{ path: string; url: string; type: "image" | "pdf"; name: string } | null>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = await Promise.all(paths.map(async (p) => {
        const { data } = await supabase.storage.from("claim-evidence").createSignedUrl(p, 60 * 30);
        if (!data?.signedUrl) return null;
        const name = p.split("/").pop() ?? p;
        const isPdf = /\.pdf($|\?)/i.test(name);
        return { path: p, url: data.signedUrl, type: isPdf ? "pdf" as const : "image" as const, name };
      }));
      if (!cancelled) setItems(next);
    })();
    return () => { cancelled = true; };
  }, [paths.join("|")]);

  return (
    <div className="mt-2">
      <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Voyage Proof · {paths.length} file{paths.length === 1 ? "" : "s"}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => it && (
          <button key={i} type="button" onClick={() => setActive(it)}
            className="group relative h-20 w-20 overflow-hidden rounded border border-border bg-ink/60 transition-colors hover:border-gold/60">
            {it.type === "image" ? (
              <img src={it.url} alt={it.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[10px] font-display uppercase tracking-widest text-gold">
                <span className="text-base">PDF</span>
                <span className="truncate px-1 text-[8px] text-muted-foreground">{it.name.slice(0, 12)}</span>
              </div>
            )}
          </button>
        ))}
      </div>
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setActive(null)}>
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg border border-gold/40 bg-ink" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs">
              <span className="truncate font-display uppercase tracking-widest text-gold">{active.name}</span>
              <div className="flex gap-2">
                <a href={active.url} target="_blank" rel="noreferrer" className="rounded border border-border px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">Open</a>
                <button onClick={() => setActive(null)} className="rounded border border-border px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">Close</button>
              </div>
            </div>
            <div className="h-[80vh] bg-black/60">
              {active.type === "image" ? (
                <img src={active.url} alt={active.name} className="h-full w-full object-contain" />
              ) : (
                <iframe src={active.url} title={active.name} className="h-full w-full" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MyRecords() {
  const { data: records = [], isLoading } = useQuery({ queryKey: ["records"], queryFn: () => listMyRecords() });
  return (
    <section className="rounded-md border border-border bg-ink/30 p-5">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">Awarded Records</h2>
      {isLoading ? <div className="py-4 text-xs text-muted-foreground">Loading…</div> : (
        <div className="mt-4 space-y-2">
          {records.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between rounded-md border border-border bg-ink/40 px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{r.achievement?.name ?? "?"}</div>
                <div className="text-[11px] text-muted-foreground">{r.staff?.name} · {r.period}</div>
              </div>
              <span className="rounded border border-gold/40 bg-gold/5 px-2 py-0.5 font-display text-[10px] uppercase tracking-widest text-gold">★ {r.stars}</span>
            </div>
          ))}
          {!records.length && <div className="py-6 text-center text-xs text-muted-foreground">No records yet.</div>}
        </div>
      )}
    </section>
  );
}
