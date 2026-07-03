import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/collections/seasonal")({
  head: () => ({ meta: [{ title: "Seasonal Collections — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="Collections"
      title="Seasonal Collections"
      description="Time-boxed sets tied to Odyssey seasons."
      status="coming-soon"
    />
  ),
});
