import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/system/guild-collection")({
  head: () => ({ meta: [{ title: "Guild Collection — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="System"
      title="Guild Collection"
      description="Shared trophies and records for the whole guild."
      status="coming-soon"
    />
  ),
});
