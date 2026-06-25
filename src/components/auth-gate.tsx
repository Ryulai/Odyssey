import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/roles";

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !session) nav({ to: "/auth" });
  }, [loading, session, nav]);

  if (loading) {
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
