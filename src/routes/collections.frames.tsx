import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/collections/frames")({
  head: () => ({ meta: [{ title: "Portrait Frames — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="Collections"
      title="Portrait Frames"
      description="Ornamental borders that ring your portrait."
      status="planned"
    />
  ),
});
