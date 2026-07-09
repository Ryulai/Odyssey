import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  categorySummaries,
  searchArticles,
  getStatusMeta,
  type CodexCategorySummary,
  type CodexArticle,
} from "@/lib/codex";

export const Route = createFileRoute("/codex")({
  head: () => ({
    meta: [
      { title: "Odyssey Codex — The Knowledge of Odyssey" },
      { name: "description", content: "The official in-app knowledge library of the Odyssey ecosystem — philosophy, systems, language, and design." },
    ],
  }),
  component: CodexHome,
});

function CodexHome() {
  const summaries = useMemo(() => categorySummaries(), []);
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchArticles(query), [query]);

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 flex items-start justify-between gap-4">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.4em] text-gold">🏛 Odyssey Codex</div>
            <h1 className="mt-2 font-display text-3xl tracking-[0.08em] text-foreground sm:text-4xl" style={{ fontFamily: "'Cinzel', serif" }}>
              The Knowledge of Odyssey
            </h1>
            <p className="mt-2 max-w-xl text-sm italic text-muted-foreground" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              Every philosophy, system, and article that shapes the Odyssey universe.
            </p>
          </div>
          <Link to="/" className="rounded-md border border-border px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold">
            ← Home
          </Link>
        </header>

        <div className="mb-10">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the Codex… (e.g. Performance, Anchor, Framework)"
            className="w-full rounded-md border border-border bg-ink/40 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-gold/50"
          />
          {query && (
            <div className="mt-4 rounded-md border border-border bg-ink/30 p-3">
              {results.length === 0 ? (
                <div className="p-4 text-center text-xs uppercase tracking-widest text-muted-foreground">
                  No articles match "{query}"
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {results.map((a) => (
                    <SearchResultRow key={`${a.category}-${a.slug}`} article={a} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {!query && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {summaries.map((s) => <CategoryCard key={s.key} summary={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryCard({ summary }: { summary: CodexCategorySummary }) {
  const empty = summary.articleCount === 0;
  return (
    <Link
      to="/codex/$category"
      params={{ category: summary.key }}
      className="group flex flex-col rounded-lg border border-border bg-ink/30 p-6 transition hover:border-gold/50 hover:bg-ink/50"
    >
      <div className="font-display text-[10px] uppercase tracking-[0.35em] text-gold/80">
        Category
      </div>
      <h2 className="mt-2 font-display text-xl tracking-[0.06em] text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
        {summary.title}
      </h2>
      <p className="mt-2 flex-1 text-sm italic text-muted-foreground" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
        {summary.description}
      </p>
      <div className="mt-5 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        <span>{summary.articleCount} {summary.articleCount === 1 ? "Article" : "Articles"}</span>
        <span className="text-gold">{summary.progressPct}% Frozen</span>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border/40">
        <div
          className="h-full bg-gold/70 transition-all"
          style={{ width: `${summary.progressPct}%` }}
        />
      </div>
      {empty && (
        <div className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground/60">
          Awaiting first article
        </div>
      )}
    </Link>
  );
}

function SearchResultRow({ article }: { article: CodexArticle }) {
  const meta = getStatusMeta(article.status);
  return (
    <li>
      <Link
        to="/codex/$category/$slug"
        params={{ category: article.category, slug: article.slug }}
        className="flex items-center justify-between gap-4 px-2 py-3 hover:bg-muted/10"
      >
        <div>
          <div className="font-display text-sm tracking-[0.04em] text-foreground">{article.title}</div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{article.category}</div>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${meta.tone}`}>
          {meta.label}
        </span>
      </Link>
    </li>
  );
}
