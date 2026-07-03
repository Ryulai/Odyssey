import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/collections/effects")({
  head: () => ({ meta: [{ title: "Profile Effects — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="Collections"
      title="Profile Effects"
      description="Animated glows and particle effects for your portrait."
      status="coming-soon"
    />
  ),
});
