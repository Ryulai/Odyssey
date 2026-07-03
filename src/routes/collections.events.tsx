import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/collections/events")({
  head: () => ({ meta: [{ title: "Event Collections — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="Collections"
      title="Event Collections"
      description="Rewards from one-off guild events."
      status="coming-soon"
    />
  ),
});
