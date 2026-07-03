import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/journal")({
  head: () => ({ meta: [{ title: "Journal — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="Profile"
      title="Journal"
      description="Your voyage log — milestones, notes, and reflections."
      status="coming-soon"
    />
  ),
});
