import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  CODEX_CATEGORIES,
  getStatusMeta,
  listArticlesByCategory,
  type CodexArticle,
  type CodexCategoryKey,
} from "@/lib/codex";

export const Route = createFileRoute("/codex/$category/")({
  loader: ({ params }) => {
    const cat = CODEX_CATEGORIES.find((c) => c.key === params.category);
    if (!cat) throw notFound();
    return { category: cat, articles: listArticlesByCategory(cat.key) };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.category.title} — Odyssey Codex` : "Odyssey Codex" },
      { name: "description", content: loaderData?.category.description ?? "Odyssey Codex" },
    ],
  }),
  component: CategoryPage,
  notFoundComponent: () => <MissingCategory />,
  errorComponent: () => <MissingCategory />,
});

function CategoryPage() {
  const { category, articles } = Route.useLoaderData();
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.4em] text-gold">Odyssey Codex</div>
            <h1 className="mt-2 font-display text-3xl tracking-[0.08em] text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
              {category.title}
            </h1>
            <p className="mt-2 max-w-xl text-sm italic text-muted-foreground" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              {category.description}
            </p>
          </div>
          <Link to="/codex" className="rounded-md border border-border px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">
            ← Codex
          </Link>
        </header>

        {articles.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-ink/30 p-12 text-center text-xs uppercase tracking-widest text-muted-foreground">
            No articles yet · content arrives in a future voyage
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {articles.map((a: CodexArticle) => (
              <ArticleCard key={a.slug} article={a} category={category.key} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ article, category }: { article: CodexArticle; category: CodexCategoryKey }) {
  const meta = getStatusMeta(article.status);

  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${meta.tone}`}>
          {meta.label}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {article.completionPct}%
        </span>
      </div>
      <h2 className="mt-3 font-display text-lg tracking-[0.05em] text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
        {article.title}
      </h2>
      <div className="mt-1 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
        {article.version && <span>v{article.version}</span>}
        {article.lastUpdated && <span>· {article.lastUpdated}</span>}
      </div>
      {article.locked && (
        <div className="mt-3 rounded-md border border-dashed border-border bg-ink/50 p-3 text-[11px] italic text-muted-foreground">
          🔒 This article has not been started yet.
        </div>
      )}
    </>
  );

  if (article.locked) {
    return (
      <li>
        <div
          aria-disabled="true"
          className="flex h-full cursor-not-allowed flex-col rounded-lg border border-border/60 bg-ink/20 p-5 opacity-70"
        >
          {inner}
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link
        to="/codex/$category/$slug"
        params={{ category, slug: article.slug }}
        className="group flex h-full flex-col rounded-lg border border-border bg-ink/30 p-5 transition hover:border-gold/50 hover:bg-ink/50"
      >
        {inner}
      </Link>
    </li>
  );
}

function MissingCategory() {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="font-display text-[10px] uppercase tracking-[0.4em] text-gold">Codex</div>
        <h1 className="mt-3 font-display text-2xl text-foreground">Category not found</h1>
        <Link to="/codex" className="mt-6 inline-block rounded-md border border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">
          ← Back to Codex
        </Link>
      </div>
    </div>
  );
}
