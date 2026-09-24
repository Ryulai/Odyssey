import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/leaderboard")({
  beforeLoad: () => {
    throw redirect({ to: "/peer-insights", replace: true });
  },
  head: () => ({
    meta: [
      { title: "Leaderboard — The Odyssey Guide" },
      { name: "description", content: "The guild ranking board: every Hunter ordered by their latest Performance score, rank and promotion progress." },
      { property: "og:title", content: "Leaderboard — The Odyssey Guide" },
      { property: "og:description", content: "See where you stand among the fleet — latest Performance score, grade, rank and promotion progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => null,
});
