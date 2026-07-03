import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/collections/emblems")({
  head: () => ({ meta: [{ title: "Guild Emblems — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="Collections"
      title="Guild Emblems"
      description="Sigils earned through faction service."
      status="planned"
    />
  ),
});
