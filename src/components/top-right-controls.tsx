import { DirectorModeToggle } from "@/components/director-mode-toggle";
import { PrototypeToggle } from "@/components/prototype/prototype-toggle";
import { useOdysseyEnvironment } from "@/components/environment-badge";
import { allowsPrototypeSandbox } from "@/lib/environment";

/**
 * Shared container for the floating top-right controls.
 *
 * Director Mode is role-gated inside its own component. The Prototype sandbox
 * is development-only and must never be reachable on the Beta release, so it
 * is hidden outside the Prototype environment.
 */
export function TopRightControls() {
  const env = useOdysseyEnvironment();
  return (
    <div className="fixed right-3 top-3 z-[60] flex flex-col items-end gap-2 sm:right-4 sm:top-4">
      <DirectorModeToggle />
      {allowsPrototypeSandbox(env) && <PrototypeToggle />}
    </div>
  );
}
