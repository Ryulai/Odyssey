import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/roles";
import { ensureBootstrapDirector } from "@/lib/bootstrap.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — The Odyssey Guide" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    setError(null); setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
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
        <Link to="/" className="mb-6 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold">← The Odyssey Guide</Link>
        <div className="card-ornate p-8">
          <div className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {mode === "signup" ? "Board the Ship" : "Return to Port"}
          </div>
          <h1 className="mt-1 font-display text-2xl text-gold">
            {mode === "signup" ? "Begin Your Odyssey" : "Sign in"}
          </h1>
          <p className="mt-2 text-xs italic text-muted-foreground">
            The first navigator to board becomes the Fleet Director.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            {mode === "signup" && (
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Name</span>
                <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Ariane Voss" />
              </label>
            )}
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Email</span>
              <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} required />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">Password</span>
              <input type="password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </label>
            {error && <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md border border-gold bg-gold/10 px-4 py-2 font-display text-xs uppercase tracking-widest text-gold hover:bg-gold/20 disabled:opacity-50"
            >
              {busy ? "…" : mode === "signup" ? "Set Sail" : "Sign in"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-gold"
          >
            {mode === "signup" ? "Already aboard? Sign in" : "New to the voyage? Board the ship"}
          </button>
        </div>
      </div>
    </div>
  );
}
