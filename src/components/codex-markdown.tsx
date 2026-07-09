import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Codex Markdown renderer.
 * Read-only. Styled for a dark, RPG-codex aesthetic.
 */
export function CodexMarkdown({ children }: { children: string }) {
  return (
    <div className="codex-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="mt-8 font-display text-3xl tracking-[0.06em] text-foreground" style={{ fontFamily: "'Cinzel', serif" }} {...p} />,
          h2: (p) => <h2 className="mt-8 border-b border-gold/20 pb-2 font-display text-xl uppercase tracking-[0.2em] text-gold" style={{ fontFamily: "'Cinzel', serif" }} {...p} />,
          h3: (p) => <h3 className="mt-6 font-display text-base uppercase tracking-[0.2em] text-foreground" {...p} />,
          h4: (p) => <h4 className="mt-5 text-sm font-semibold text-foreground" {...p} />,
          p:  (p) => <p className="mt-3 text-[15px] leading-relaxed text-foreground/90" style={{ fontFamily: '"Cormorant Garamond", serif' }} {...p} />,
          ul: (p) => <ul className="mt-3 list-disc space-y-1 pl-6 text-[15px] text-foreground/90" style={{ fontFamily: '"Cormorant Garamond", serif' }} {...p} />,
          ol: (p) => <ol className="mt-3 list-decimal space-y-1 pl-6 text-[15px] text-foreground/90" style={{ fontFamily: '"Cormorant Garamond", serif' }} {...p} />,
          li: (p) => <li className="leading-relaxed" {...p} />,
          hr: () => <div className="my-8 flex items-center justify-center"><div className="h-px w-24 bg-gold/40" /></div>,
          blockquote: (p) => <blockquote className="mt-4 border-l-2 border-gold/50 bg-ink/40 px-4 py-2 italic text-muted-foreground" {...p} />,
          code: ({ className, children, ...rest }) => {
            const isBlock = /language-/.test(className ?? "");
            if (isBlock) {
              return (
                <pre className="mt-4 overflow-x-auto rounded-md border border-border bg-ink/60 p-4 text-xs text-foreground">
                  <code className={className} {...rest}>{children}</code>
                </pre>
              );
            }
            return <code className="rounded bg-muted/30 px-1.5 py-0.5 text-[13px] text-gold" {...rest}>{children}</code>;
          },
          table: (p) => (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...p} />
            </div>
          ),
          th: (p) => <th className="border border-border bg-muted/20 px-3 py-2 text-left font-display text-xs uppercase tracking-widest text-gold" {...p} />,
          td: (p) => <td className="border border-border px-3 py-2 text-foreground/90" {...p} />,
          strong: (p) => <strong className="font-semibold text-foreground" {...p} />,
          em: (p) => <em className="italic text-foreground/80" {...p} />,
          a: (p) => <a className="text-gold underline underline-offset-2 hover:text-gold/80" {...p} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
