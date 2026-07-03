import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/mentorship")({
  head: () => ({ meta: [{ title: "Mentorship — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="Career"
      title="Mentorship"
      description="Guide the crew. Track proteges, sessions, and the mentors who shaped you."
      status="coming-soon"
    />
  ),
});
