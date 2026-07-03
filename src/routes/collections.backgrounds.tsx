import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/collections/backgrounds")({
  head: () => ({ meta: [{ title: "Backgrounds — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="Collections"
      title="Backgrounds"
      description="Scenes that frame your character page."
      status="planned"
    />
  ),
});
