import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/collections/founder")({
  head: () => ({ meta: [{ title: "Founder Collections — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="Collections"
      title="Founder Collections"
      description="Reserved for those who sailed the first voyage."
      status="planned"
    />
  ),
});
