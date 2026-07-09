import { useState } from "react";
import { usePrototype } from "@/lib/prototype/use-prototype";
import { PrototypePanel } from "./prototype-panel";

export function PrototypeToggle() {
  const { enabled, active } = usePrototype();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`rounded-full border px-3 py-1.5 text-[10px] font-display uppercase tracking-[0.3em] shadow-lg backdrop-blur transition ${
          enabled
            ? "border-amber-400 bg-amber-500/20 text-amber-200 shadow-amber-500/30"
            : "border-border bg-black/50 text-muted-foreground hover:text-amber-200"
        }`}
        title="Prototype Mode"
      >
        {enabled ? `⚡ Prototype · ${active?.label ?? "—"}` : "Prototype"}
      </button>
      {open && <PrototypePanel onClose={() => setOpen(false)} />}
    </>
  );
}
