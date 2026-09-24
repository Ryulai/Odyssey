import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/peer-insights")({
  beforeLoad: () => {
    throw redirect({ to: "/leaderboard", replace: true });
  },
  head: () => ({
    meta: [
      { title: "Leaderboard — The Odyssey Guide" },
      { name: "description", content: "Monthly Performance rankings by authorized Odyssey group." },
      { property: "og:title", content: "Leaderboard — The Odyssey Guide" },
      { property: "og:description", content: "Monthly Performance rankings by authorized Odyssey group." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => null,
});
