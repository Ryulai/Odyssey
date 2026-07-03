import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/collections/cosmetics")({
  head: () => ({ meta: [{ title: "Cosmetic Collections — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="Collections"
      title="Cosmetic Collections"
      description="Purely decorative sets curated by season."
      status="planned"
    />
  ),
});
