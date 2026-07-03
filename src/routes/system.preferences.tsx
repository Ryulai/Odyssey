import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/system/preferences")({
  head: () => ({ meta: [{ title: "Preferences — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="System"
      title="Preferences"
      description="Theme, motion, sound, and privacy."
      status="planned"
    />
  ),
});
