import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CODEX_CATEGORIES, getArticle, getStatusMeta, type CodexSection } from "@/lib/codex";
import { CodexMarkdown } from "@/components/codex-markdown";

export const Route = createFileRoute("/codex/$category/$slug")({
  loader: ({ params }) => {
    const cat = CODEX_CATEGORIES.find((c) => c.key === params.category);
    if (!cat) throw notFound();
    const article = getArticle(cat.key, params.slug);
    if (!article) throw notFound();
    return { category: cat, article };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.article.title} — Odyssey Codex` : "Odyssey Codex" },
      { name: "description", content: loaderData ? `${loaderData.article.title} — ${loaderData.category.title}` : "Odyssey Codex" },
    ],
  }),
  component: ArticlePage,
  notFoundComponent: () => <MissingArticle />,
  errorComponent: () => <MissingArticle />,
});

function ArticlePage() {
  const { category, article } = Route.useLoaderData();
  const meta = getStatusMeta(article.status);
  // Frozen progress: 100 if frozen, 60 discussed, 40 in-progress, 20 concept
  const progressPct =
    article.status === "frozen" ? 100 :
    article.status === "discussed" ? 70 :
    article.status === "in-progress" ? 45 :
    article.status === "concept" ? 20 : 0;

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between text-[10px] uppercase tracking-[0.3em]">
          <Link to="/codex/$category" params={{ category: category.key }} className="text-muted-foreground hover:text-gold">
            ← {category.title}
          </Link>
          <Link to="/codex" className="text-muted-foreground hover:text-gold">Codex</Link>
        </header>

        <div className="rounded-lg border border-border bg-ink/30 p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${meta.tone}`}>
              {meta.label}
            </span>
            {article.version && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                Version {article.version}
              </span>
            )}
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              {category.title}
            </span>
          </div>

          <h1 className="mt-5 font-display text-3xl tracking-[0.06em] text-foreground sm:text-4xl" style={{ fontFamily: "'Cinzel', serif" }}>
            {article.title}
          </h1>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-border/40">
              <div className="h-full bg-gold/70 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{progressPct}%</div>
          </div>

          <div className="my-8 flex items-center justify-center"><div className="h-px w-24 bg-gold/40" /></div>

          {article.locked ? (
            <div className="rounded-md border border-dashed border-border bg-ink/40 p-8 text-center">
              <div className="text-2xl">🔒</div>
              <div className="mt-2 font-display text-sm uppercase tracking-[0.3em] text-gold">Under Development</div>
              <p className="mx-auto mt-3 max-w-md text-sm italic text-muted-foreground" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                This article is currently under development. Its philosophy has been established,
                but implementation has not yet been finalized.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {article.intro && (
                <div className="rounded-md border border-gold/20 bg-ink/40 p-5">
                  <CodexMarkdown>{article.intro}</CodexMarkdown>
                </div>
              )}
              {article.sections.length === 0 && !article.intro && (
                <CodexMarkdown>{article.body}</CodexMarkdown>
              )}
              {article.sections.map((s: CodexSection, i: number) => (
                <section
                  key={`${s.title}-${i}`}
                  className="rounded-lg border border-border bg-ink/40 p-6 transition hover:border-gold/30"
                >
                  <header className="flex items-center gap-3 border-b border-gold/20 pb-3">
                    <span className="text-xl leading-none">{s.icon}</span>
                    <h2
                      className="font-display text-sm uppercase tracking-[0.3em] text-gold"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      {s.title}
                    </h2>
                  </header>
                  <div className="pt-2">
                    <CodexMarkdown>{s.body}</CodexMarkdown>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
          Read-only · maintained in the Odyssey Codex source of truth
        </div>
      </div>
    </div>
  );
}

function MissingArticle() {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="font-display text-[10px] uppercase tracking-[0.4em] text-gold">Codex</div>
        <h1 className="mt-3 font-display text-2xl text-foreground">Article not found</h1>
        <Link to="/codex" className="mt-6 inline-block rounded-md border border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">
          ← Back to Codex
        </Link>
      </div>
    </div>
  );
}
