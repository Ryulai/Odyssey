import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/ownership")({
  head: () => ({ meta: [{ title: "Ownership — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="Career"
      title="Ownership"
      description="Ventures, holdings, and legacy titles — the shipbuilder's ledger."
      status="coming-soon"
    />
  ),
});
