import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/system/settings")({
  head: () => ({ meta: [{ title: "Settings — The Odyssey Guide" }] }),
  component: () => (
    <PlaceholderPage
      eyebrow="System"
      title="Settings"
      description="Account, security, and integrations."
      status="planned"
    />
  ),
});
