import { useState } from "react";
import { useAuth } from "@/lib/roles";
import { completeTemporaryPasswordChange } from "@/lib/password-reset.functions";

export function ForcePasswordChange({ expired, onDone }: { expired: boolean; onDone: () => void }) {
  const { signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const inputCls =
    "w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Both passwords must match."); return; }
    setBusy(true);
    try {
      await completeTemporaryPasswordChange({ data: { new_password: password } });
      onDone();
    } catch (err: any) {
      setError(err?.message ?? "Could not update your password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-foreground">
      <div className="card-ornate w-full max-w-md p-8">
        <h1 className="text-center font-display text-2xl uppercase tracking-[0.2em] text-gold">
          Create a new password
        </h1>
        {expired ? (
          <>
            <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
              Your temporary password has expired. Please contact your Director for a new one.
            </p>
            <button
              onClick={() => signOut()}
              className="mt-6 w-full rounded-md border border-gold bg-gold/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-gold hover:bg-gold/20"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
              You're using a temporary password. Create a new password to continue.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-3">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">New password</span>
                <input type="password" className={inputCls} value={password} minLength={8} required
                  autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Confirm password</span>
                <input type="password" className={inputCls} value={confirm} minLength={8} required
                  autoComplete="new-password" onChange={(e) => setConfirm(e.target.value)} />
              </label>
              {error && <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
              <button type="submit" disabled={busy}
                className="w-full rounded-md border border-gold bg-gold/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-gold hover:bg-gold/20 disabled:opacity-50">
                {busy ? "…" : "Save new password"}
              </button>
            </form>
            <button onClick={() => signOut()} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-gold">
              Sign out
            </button>
          </>
        )}
      </div>
    </div>
  );
}
