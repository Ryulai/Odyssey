import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/achievements")({
  head: () => ({ meta: [{ title: "Achievements — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="Profile"
      title="Achievements"
      description="Every star earned, every claim submitted."
      status="planned"
    />
  ),
});
