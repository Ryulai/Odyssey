import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/system/notifications")({
  head: () => ({ meta: [{ title: "Notifications — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="System"
      title="Notifications"
      description="Claim reviews, promotions, mentions."
      status="planned"
    />
  ),
});
