import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/statistics")({
  head: () => ({ meta: [{ title: "Statistics — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="Profile"
      title="Statistics"
      description="Career metrics, grade history, streaks, and averages."
      status="planned"
    />
  ),
});
