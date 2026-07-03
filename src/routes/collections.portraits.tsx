import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/collections/portraits")({
  head: () => ({ meta: [{ title: "Portraits — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="Collections"
      title="Portraits"
      description="Default avatars unlocked through the voyage."
      status="planned"
    />
  ),
});
