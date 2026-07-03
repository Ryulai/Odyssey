import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/collections/titles")({
  head: () => ({ meta: [{ title: "Titles — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="Collections"
      title="Titles"
      description="Honorifics you can display beside your name."
      status="planned"
    />
  ),
});
