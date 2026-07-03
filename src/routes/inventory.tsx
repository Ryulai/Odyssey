import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "Inventory — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="Profile"
      title="Inventory"
      description="Consumables, tokens, and time-limited perks."
      status="coming-soon"
    />
  ),
});
