import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth-gate";
import { useAuth, useRole, can } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import { listAchievements, listStaff } from "@/lib/server/config.functions";
import { listClaims, submitClaim, decideClaim, listMyRecords } from "@/lib/server/claims.functions";

export const Route = createFileRoute("/claims")({
  head: () => ({ meta: [{ title: "Achievement Claims — Guild Ledger" }] }),
  component: () => <AuthGate><ClaimsPage /></AuthGate>,
});

const inputCls = "w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none";

function ClaimsPage() {
  const { user } = useAuth();
  const { role } = useRole();
  const isReviewer = can(role, "claims.review");

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-semibold uppercase tracking-widest text-gold">Achievement Claims</div>
            <div className="text-xs text-muted-foreground">Submit claims, attach evidence, await guild approval.</div>
          </div>
          <Link to="/" className="rounded-md border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">← Ledger</Link>
        </header>

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

function SubmitClaim({ userId }: { userId: string | null }) {
  const qc = useQueryClient();
  const { data: staff = [] } = useQuery({ queryKey: ["staff"], queryFn: () => listStaff() });
  const { data: achs = [] } = useQuery({ queryKey: ["achievements"], queryFn: () => listAchievements() });
  const myStaff = useMemo(() => staff.find((s: any) => s.user_id === userId), [staff, userId]);

  const [achievementId, setAchievementId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [evidence, setEvidence] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Default staff to self
  const effectiveStaffId = staffId || myStaff?.id || "";

  const submit = useMutation({
    mutationFn: async () => {
      let url: string | null = null;
      if (file && userId) {
        const path = `${userId}/${Date.now()}-${file.name}`;
        const up = await supabase.storage.from("claim-evidence").upload(path, file, { upsert: false });
        if (up.error) throw up.error;
        url = path; // store the path; signed URLs generated on demand
      }
      return submitClaim({ data: {
        staff_id: effectiveStaffId,
        achievement_id: achievementId,
        evidence_text: evidence,
        evidence_url: url,
        notes,
      }});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["claims"] });
      setMsg("Claim submitted. Awaiting review.");
      setEvidence(""); setNotes(""); setFile(null); setAchievementId("");
    },
    onError: (e: any) => setMsg(e.message ?? "Failed"),
  });

  return (
    <section className="rounded-md border border-border bg-ink/30 p-5">
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">Submit a Claim</h2>
      <form onSubmit={(e) => { e.preventDefault(); if (!achievementId || !effectiveStaffId) return; setBusy(true); submit.mutate(undefined, { onSettled: () => setBusy(false) }); }}
        className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Hunter (staff)</span>
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
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Evidence</span>
          <textarea rows={3} className={inputCls} value={evidence} onChange={e => setEvidence(e.target.value)}
            placeholder="Describe what you did, deal IDs, links…" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Evidence File (optional)</span>
          <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} className="text-xs text-muted-foreground" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Notes</span>
          <textarea rows={2} className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} />
        </label>
        {msg && <div className="rounded border border-gold/30 bg-gold/5 px-3 py-2 text-xs text-gold">{msg}</div>}
        <button type="submit" disabled={busy || !achievementId || !effectiveStaffId}
          className="w-full rounded-md border border-gold bg-gold/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-gold hover:bg-gold/20 disabled:opacity-50">
          {busy ? "Submitting…" : "Submit Claim"}
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
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">My Claims</h2>
      {isLoading ? <div className="py-4 text-xs text-muted-foreground">Loading…</div> : (
        <div className="mt-4 space-y-2">
          {mine.map((c: any) => <ClaimCard key={c.id} c={c} />)}
          {!mine.length && <div className="py-6 text-center text-xs text-muted-foreground">No claims yet.</div>}
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
      <h2 className="font-display text-sm uppercase tracking-[0.25em] text-gold">Review Queue</h2>
      {isLoading ? <div className="py-4 text-xs text-muted-foreground">Loading…</div> : (
        <div className="mt-4 space-y-2">
          {claims.map((c: any) => (
            <ClaimCard key={c.id} c={c} action={c.status === "pending" ? (
              <div className="flex gap-2">
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
          {!claims.length && <div className="py-6 text-center text-xs text-muted-foreground">No claims yet.</div>}
        </div>
      )}
    </section>
  );
}

function ClaimCard({ c, action }: { c: any; action?: React.ReactNode }) {
  const [url, setUrl] = useState<string | null>(null);
  async function openEvidence() {
    if (!c.evidence_url) return;
    const { data, error } = await supabase.storage.from("claim-evidence").createSignedUrl(c.evidence_url, 60);
    if (!error && data) { setUrl(data.signedUrl); window.open(data.signedUrl, "_blank"); }
  }
  return (
    <div className="rounded-md border border-border bg-ink/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-medium">{c.achievement?.name ?? "?"}</div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">★ {c.achievement?.star_reward ?? 0}</span>
            <StatusPill s={c.status} />
          </div>
          <div className="text-xs text-muted-foreground">{c.staff?.name} · {new Date(c.created_at).toLocaleString()}</div>
          {c.evidence_text && <div className="mt-2 text-sm">{c.evidence_text}</div>}
          {c.notes && <div className="mt-1 text-xs italic text-muted-foreground">Notes: {c.notes}</div>}
          {c.evidence_url && (
            <button onClick={openEvidence} className="mt-1 text-xs text-gold underline">{url ? "Re-open evidence" : "View evidence file"}</button>
          )}
          {c.decision_notes && <div className="mt-1 text-xs text-red-300">Reviewer: {c.decision_notes}</div>}
        </div>
        {action}
      </div>
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
