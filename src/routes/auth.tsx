import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/roles";
import { ensureBootstrapDirector } from "@/lib/bootstrap.functions";
import { activateBetaAccount } from "@/lib/beta-access.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — The Odyssey Internal Beta" },
      { name: "description", content: "Odyssey Beta V1 entry gate. Sign in or activate a Director-approved Hunter account." },
      { property: "og:title", content: "The Odyssey — Internal Beta Sign In" },
      { property: "og:description", content: "Odyssey Beta V1 entry gate for approved Hunters, Managers and Directors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"signin" | "activate">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);


  useEffect(() => {
    let cancelled = false;
    if (session) {
      ensureBootstrapDirector({ data: {} }).then((result) => {
        if (cancelled) return;
        nav({ to: result?.redirectTo === "/admin" ? "/admin" : "/" });
      }).catch(() => {
        if (!cancelled) nav({ to: "/" });
      });
    }
    return () => { cancelled = true; };
  }, [session, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setNotice(null); setBusy(true);
    try {
      if (mode === "activate") {
        const result = await activateBetaAccount({ data: { email, password } });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setNotice(result.message);
        setMode("signin");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const result = await ensureBootstrapDirector({ data: {} });
      nav({ to: result?.redirectTo === "/admin" ? "/admin" : "/" });
    } catch (e: any) {
      setError(e.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "w-full rounded-md border border-border bg-ink/60 px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none";

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto flex max-w-md flex-col px-4 py-16">
        <Link to="/" className="mb-6 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold">← Back</Link>

        <div className="card-ornate p-8">
          <div className="flex items-center justify-center">
            <span className="rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-gold">
              Internal Beta · V1
            </span>
          </div>

          <h1 className="mt-5 text-center font-display text-3xl uppercase tracking-[0.25em] text-gold">
            The Odyssey
          </h1>
          <p className="mt-2 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {mode === "signin" ? "Sign in" : "Activate account"}
          </p>

          <div className="mt-6 rounded-md border border-border/70 bg-ink/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            Accounts must be pre-created and approved by a Director before activation.
            Public registration is closed during the Beta.
          </div>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Email</span>
              <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Password</span>
              <input
                type="password"
                className={inputCls}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={mode === "activate" ? 8 : 6}
                autoComplete={mode === "activate" ? "new-password" : "current-password"}
              />
            </label>

            {error && <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
            {notice && <div className="rounded border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-gold">{notice}</div>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md border border-gold bg-gold/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-gold hover:bg-gold/20 disabled:opacity-50"
            >
              {busy ? "…" : mode === "activate" ? "Activate account" : "Sign in"}
            </button>
          </form>

          <button
            onClick={() => { setMode(mode === "activate" ? "signin" : "activate"); setError(null); setNotice(null); setForgot(false); }}
            className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-gold"
          >
            {mode === "activate"
              ? "Already activated? Sign in"
              : "First time here? Activate your approved account"}
          </button>

          <button
            onClick={() => setForgot((v) => !v)}
            className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-gold"
          >
            Forgot your password?
          </button>
          {forgot && (
            <div className="mt-3 rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-center text-[11px] leading-relaxed text-gold">
              Please contact your Director to reset your Odyssey account.
            </div>
          )}


          <p className="mt-6 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            Your Department, Class, Rank and Authority are set by your Staff Identity.
          </p>
        </div>
      </div>
    </div>
  );
}
