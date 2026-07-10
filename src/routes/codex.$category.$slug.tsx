import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  CODEX_CATEGORIES,
  getArticle,
  getStatusMeta,
  type CodexArticle,
  type CodexSection,
  type CodexStatus,
} from "@/lib/codex";
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

/** Canonical section order every Codex page aspires to. */
const STANDARD_SECTIONS = [
  "Overview",
  "Definition",
  "Purpose",
  "Rules",
  "Formula",
  "Examples",
  "Related Systems",
  "Discussion Notes",
  "Remaining Tasks",
  "Changelog",
] as const;

/** Map a raw section title to one of the canonical section keys, or null. */
function canonicalKey(title: string): string | null {
  const t = title.toLowerCase();
  if (/overview/.test(t)) return "Overview";
  if (/definition|what is( not)?$/.test(t)) return "Definition";
  if (/purpose|why/.test(t)) return "Purpose";
  if (/rule|principle|framework|architecture|structure|five/.test(t)) return "Rules";
  if (/formula|calculation|grade|score/.test(t)) return "Formula";
  if (/example|scenario/.test(t)) return "Examples";
  if (/related|relationship|dependency|dependencies/.test(t)) return "Related Systems";
  if (/discussion|current discussion|design history|history|note/.test(t)) return "Discussion Notes";
  if (/remaining|next step|todo|parking|open question|future/.test(t)) return "Remaining Tasks";
  if (/changelog|version history|revisions?/.test(t)) return "Changelog";
  return null;
}

type LifecycleVariant = "frozen" | "in-progress" | "draft" | "parking" | "other";

function variantFor(status: CodexStatus): LifecycleVariant {
  if (status === "frozen") return "frozen";
  if (status === "in-progress") return "in-progress";
  if (status === "draft") return "draft";
  if (status === "parking") return "parking";
  return "other";
}

function lifecycleBanner(v: LifecycleVariant): { label: string; body: string; tone: string } | null {
  switch (v) {
    case "frozen":
      return {
        label: "Official Documentation",
        body: "This article is Frozen. The content below is the source of truth, synchronized with GitHub.",
        tone: "border-emerald-400/40 bg-emerald-500/5 text-emerald-200",
      };
    case "in-progress":
      return {
        label: "Current Discussion",
        body: "This system is being implemented. The content below reflects the current in-progress design and may change before it is frozen.",
        tone: "border-orange-400/40 bg-orange-500/5 text-orange-200",
      };
    case "draft":
      return {
        label: "Draft — Under Discussion",
        body: "This article is a draft. It captures the current design conversation and is not yet a decision.",
        tone: "border-amber-400/40 bg-amber-500/5 text-amber-200",
      };
    case "parking":
      return {
        label: "Parking Lot — Future Concepts",
        body: "This article records future ideas and planned improvements. Work is intentionally postponed.",
        tone: "border-sky-400/40 bg-sky-500/5 text-sky-200",
      };
    default:
      return null;
  }
}

function ArticlePage() {
  const { category, article } = Route.useLoaderData();
  const meta = getStatusMeta(article.status);
  const variant = variantFor(article.status);
  const banner = lifecycleBanner(variant);

  // Group raw sections into canonical buckets.
  const buckets = new Map<string, CodexSection[]>();
  for (const s of article.sections) {
    const key = canonicalKey(s.title) ?? "Discussion Notes";
    const arr = buckets.get(key) ?? [];
    arr.push(s);
    buckets.set(key, arr);
  }

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between text-[10px] uppercase tracking-[0.3em]">
          <Link to="/codex/$category" params={{ category: category.key }} className="text-muted-foreground hover:text-gold">
            ← {category.title}
          </Link>
          <Link to="/codex" className="text-muted-foreground hover:text-gold">Codex</Link>
        </header>

        {article.locked ? (
          <LockedNotice title={article.title} />
        ) : (
          <div className="rounded-lg border border-border bg-ink/30 p-6 sm:p-10">
            {/* Standard header */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${meta.tone}`}>
                {meta.label}
              </span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                {category.title}
              </span>
              {article.version && (
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  v{article.version}
                </span>
              )}
            </div>

            <h1
              className="mt-5 font-display text-3xl tracking-[0.06em] text-foreground sm:text-4xl"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {article.title}
            </h1>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground sm:grid-cols-4">
              <MetaCell label="Owner" value={article.owner ?? "—"} />
              <MetaCell label="Version" value={article.version ?? "—"} />
              <MetaCell label="Updated" value={article.lastUpdated ?? "—"} />
              <MetaCell label="Complete" value={`${article.completionPct}%`} />
            </dl>

            <div className="mt-4 flex items-center gap-3">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-border/40">
                <div className="h-full bg-gold/70 transition-all" style={{ width: `${article.completionPct}%` }} />
              </div>
            </div>

            {banner && (
              <div className={`mt-6 rounded-md border px-4 py-3 text-xs ${banner.tone}`}>
                <div className="font-display uppercase tracking-[0.25em]">{banner.label}</div>
                <p className="mt-1 text-[13px] normal-case tracking-normal opacity-90" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                  {banner.body}
                </p>
              </div>
            )}

            <div className="my-8 flex items-center justify-center">
              <div className="h-px w-24 bg-gold/40" />
            </div>

            {/* Intro */}
            {article.intro && (
              <div className="rounded-md border border-gold/20 bg-ink/40 p-5">
                <CodexMarkdown>{article.intro}</CodexMarkdown>
              </div>
            )}

            {/* Standard sections in canonical order */}
            <div className="mt-6 space-y-6">
              {STANDARD_SECTIONS.map((key) => {
                const items = buckets.get(key);
                if (!items || items.length === 0) return null;
                return (
                  <section key={key} className="rounded-lg border border-border bg-ink/40 p-6 transition hover:border-gold/30">
                    <header className="flex items-center gap-3 border-b border-gold/20 pb-3">
                      <span className="text-xl leading-none">{items[0].icon}</span>
                      <h2
                        className="font-display text-sm uppercase tracking-[0.3em] text-gold"
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        {key}
                      </h2>
                    </header>
                    <div className="space-y-4 pt-2">
                      {items.map((s, i) => (
                        <div key={`${s.title}-${i}`}>
                          {s.title.toLowerCase() !== key.toLowerCase() && (
                            <h3 className="mt-2 font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
                              {s.title}
                            </h3>
                          )}
                          <CodexMarkdown>{s.body}</CodexMarkdown>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}

              {/* Fallback: no sections at all */}
              {article.sections.length === 0 && !article.intro && (
                <EmptyNotice article={article} />
              )}
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
          Read-only · maintained in the Odyssey Codex source of truth
        </div>
      </div>
    </div>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-ink/40 px-3 py-2">
      <dt className="text-[9px] tracking-[0.25em] text-muted-foreground/70">{label}</dt>
      <dd className="mt-1 text-[13px] font-medium normal-case tracking-normal text-foreground">{value}</dd>
    </div>
  );
}

function EmptyNotice({ article }: { article: CodexArticle }) {
  const v = variantFor(article.status);
  const msg =
    v === "parking"
      ? "This slot is reserved for future exploration. The concept is preserved so naming and scope do not drift."
      : v === "draft"
      ? "This draft has not yet been written. The lifecycle is open and awaiting the first design pass."
      : v === "in-progress"
      ? "Implementation is under way. Detailed content will appear here as the design evolves."
      : "No content yet.";
  return (
    <div className="rounded-md border border-dashed border-border bg-ink/40 p-8 text-center text-sm italic text-muted-foreground" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
      {msg}
    </div>
  );
}

function LockedNotice({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-border bg-ink/30 p-10 text-center">
      <div className="text-3xl">🔒</div>
      <h1 className="mt-3 font-display text-2xl tracking-[0.06em] text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
        {title}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm italic text-muted-foreground" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
        This article has not been started yet.
      </p>
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
