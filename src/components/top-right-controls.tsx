import { DirectorModeToggle } from "@/components/director-mode-toggle";
import { PrototypeToggle } from "@/components/prototype/prototype-toggle";

/**
 * Shared container for the two floating top-right controls.
 *
 * Both the Prototype and Director Mode toggles are dev/admin-only.
 * Rendering them in one vertical stack prevents them from overlapping
 * each other and keeps the top-right corner predictable for page content
 * such as back buttons.
 */
export function TopRightControls() {
  return (
    <div className="fixed right-3 top-3 z-[60] flex flex-col items-end gap-2 sm:right-4 sm:top-4">
      <DirectorModeToggle />
      <PrototypeToggle />
    </div>
  );
}
