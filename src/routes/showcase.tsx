import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ShowcaseProvider } from "@/lib/showcase/context";
import { ShowcaseSidebar } from "@/components/showcase/sidebar";
import { CharacterSwitcher } from "@/components/showcase/character-switcher";
import { ActProgress } from "@/components/showcase/act-progress";
import { findAct } from "@/lib/showcase/acts";

export const Route = createFileRoute("/showcase")({
  head: () => ({
    meta: [
      { title: "Odyssey Showcase — A personal RPG for growth" },
      { name: "description", content: "A premium demo of the Odyssey growth ecosystem." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ShowcaseLayout,
});

function ShowcaseLayout() {
  return (
    <ShowcaseProvider>
      <ShowcaseChrome />
    </ShowcaseProvider>
  );
}

function ShowcaseChrome() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const act = findAct(path);
  const fullBleed = act?.fullBleed ?? false;

  return (
    <div
      className="min-h-screen w-full text-parchment relative overflow-x-hidden"
      style={{
        background:
          "radial-gradient(1200px 800px at 20% -10%, #1a0f1e 0%, transparent 50%), radial-gradient(1000px 700px at 100% 10%, #0e1420 0%, transparent 55%), #05040a",
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {fullBleed ? (
        <main className="relative z-10 min-h-screen">
          <Outlet />
        </main>
      ) : (
        <div className="flex relative z-10">
          <ShowcaseSidebar />
          <main className="flex-1 min-w-0">
            <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 md:px-10 py-4 bg-gradient-to-b from-[#05040a]/95 to-transparent backdrop-blur-md">
              <div className="md:hidden font-display text-lg tracking-widest text-parchment">ODYSSEY</div>
              <div className="hidden md:block"><ActProgress /></div>
              <div className="ml-auto"><CharacterSwitcher /></div>
            </header>
            <div className="px-6 md:px-10 pb-24 pt-4">
              <Outlet />
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
