import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/roles";
import { ensureBootstrapDirector } from "@/lib/bootstrap.functions";

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading, refreshRole } = useAuth();
  const [bootstrapping, setBootstrapping] = useState(false);
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !session) nav({ to: "/auth" });
  }, [loading, session, nav]);

  useEffect(() => {
    if (loading || !session) return;
    let cancelled = false;
    setBootstrapping(true);
    ensureBootstrapDirector({ data: {} })
      .then(async (result) => {
        await refreshRole();
        if (!cancelled && result?.redirectTo === "/admin") nav({ to: "/admin" });
      })
      .catch(async () => {
        await refreshRole();
      })
      .finally(() => {
        if (!cancelled) setBootstrapping(false);
      });
    return () => { cancelled = true; };
  }, [loading, nav, refreshRole, session]);

  if (loading || bootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center text-xs uppercase tracking-widest text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Link to="/auth" className="text-xs uppercase tracking-widest text-gold">→ Sign in</Link>
      </div>
    );
  }
  return <>{children}</>;
}
