import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/roles";
import { ensureBootstrapDirector } from "@/lib/bootstrap.functions";
import { getPasswordResetState } from "@/lib/password-reset.functions";
import { ForcePasswordChange } from "@/components/force-password-change";

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading, refreshRole } = useAuth();
  const [bootstrapping, setBootstrapping] = useState(false);
  const [pwState, setPwState] = useState<{ mustChangePassword: boolean; expired: boolean } | null>(null);
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !session) nav({ to: "/auth" });
  }, [loading, session, nav]);

  const checkPassword = useCallback(async () => {
    try {
      const state = await getPasswordResetState({ data: {} });
      setPwState({ mustChangePassword: state.mustChangePassword, expired: state.expired });
    } catch {
      setPwState({ mustChangePassword: false, expired: false });
    }
  }, []);

  useEffect(() => {
    if (loading || !session) { setPwState(null); return; }
    void checkPassword();
  }, [checkPassword, loading, session]);

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

  if (loading || bootstrapping || (session && !pwState)) {
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
  if (pwState?.mustChangePassword) {
    return <ForcePasswordChange expired={pwState.expired} onDone={() => void checkPassword()} />;
  }
  return <>{children}</>;
}

