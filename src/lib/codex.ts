/**
 * Odyssey Codex — in-app knowledge library.
 *
 * Article contents are sourced from Markdown files under /odyssey-codex/.
 * They are bundled at build time via Vite's import.meta.glob (?raw).
 *
 * The app is read-only. Editing happens in the Markdown source of truth
 * (future: synced from GitHub). Do NOT hardcode article bodies.
 */

export type CodexStatus =
  | "frozen"
  | "discussed"
  | "in-progress"
  | "concept"
  | "locked"
  | "rejected"
  | "unknown";

export type CodexCategoryKey =
  | "foundation"
  | "design-engine"
  | "core-systems"
  | "language"
  | "knowledge"
  | "roadmap";

export type CodexCategoryDef = {
  key: CodexCategoryKey;
  /** Directory under /odyssey-codex to scan. Empty = no source yet. */
  folder: string;
  title: string;
  description: string;
};

export const CODEX_CATEGORIES: CodexCategoryDef[] = [
  { key: "foundation",    folder: "foundation",    title: "Foundation",    description: "The philosophy and principles of Odyssey." },
  { key: "design-engine", folder: "design-engine", title: "Design Engine", description: "The framework used to design every system." },
  { key: "core-systems",  folder: "core-systems",  title: "Core Systems",  description: "The five progression systems of the Odyssey universe." },
  { key: "language",      folder: "language",      title: "Language",      description: "The shared vocabulary that keeps the guild aligned." },
  { key: "knowledge",     folder: "knowledge",     title: "Knowledge",     description: "Decision logs, parking slots, and rejected ideas." },
  { key: "roadmap",       folder: "roadmap",       title: "Roadmap",       description: "Current development and future expansion." },
];

export type CodexSection = {
  title: string;
  /** Icon glyph derived from title keyword. */
  icon: string;
  /** Body markdown for this section (no leading heading). */
  body: string;
};

export type CodexArticle = {
  slug: string;
  category: CodexCategoryKey;
  title: string;
  status: CodexStatus;
  statusRaw: string;
  version: string | null;
  priority: string | null;
  lastUpdated: string | null;
  /** Original body markdown (kept for search + fallback). */
  body: string;
  /** Optional intro paragraph before the first section header. */
  intro: string;
  /** Parsed premium sections (# Header … until next # Header). */
  sections: CodexSection[];
  /** Frozen or Discussed articles render full body. Others show preview only. */
  locked: boolean;
};

const RAW_FILES = import.meta.glob("/odyssey-codex/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const m = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(raw);
  if (!m) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) data[key.toLowerCase()] = val;
  }
  return { data, body: m[2] };
}

function normalizeStatus(raw: string): CodexStatus {
  const s = raw.toLowerCase();
  if (!s) return "unknown";
  if (s.includes("reject")) return "rejected";
  if (s.includes("frozen")) return "frozen";
  if (s.includes("discuss")) return "discussed";
  if (s.includes("progress")) return "in-progress";
  if (s.includes("design")) return "in-progress";
  if (s.includes("concept")) return "concept";
  if (s.includes("planned")) return "concept";
  return "unknown";
}

function extractTitleFromBody(body: string, fallback: string): string {
  const m = /^\s*#\s+(.+?)\s*$/m.exec(body);
  return m ? m[1].replace(/^Article\s+\d+\s+—\s+/i, "") : fallback;
}

function slugFromFilename(path: string): string {
  const name = path.split("/").pop() ?? path;
  return name.replace(/\.md$/i, "").toLowerCase();
}

function categoryFromPath(path: string): CodexCategoryKey | null {
  // /odyssey-codex/<folder>/<file>.md
  const parts = path.split("/");
  const folder = parts[parts.length - 2];
  const cat = CODEX_CATEGORIES.find((c) => c.folder === folder);
  return cat ? cat.key : null;
}

function iconForSection(title: string): string {
  const t = title.toLowerCase();
  if (/(definition|what is$|^what$)/.test(t)) return "📖";
  if (/purpose/.test(t)) return "🎯";
  if (/^why/.test(t)) return "💡";
  if (/what is not|not$/.test(t)) return "🚫";
  if (/philosoph|belief|principle/.test(t)) return "✨";
  if (/architect|structure|framework|current design/.test(t)) return "🏛";
  if (/formula|calculation|grade/.test(t)) return "🧮";
  if (/relationship/.test(t)) return "🔗";
  if (/history/.test(t)) return "📜";
  if (/parking/.test(t)) return "🅿️";
  if (/recovery|note/.test(t)) return "🧭";
  if (/status/.test(t)) return "🧊";
  if (/discussion|current discussion/.test(t)) return "💬";
  if (/rank|path|growth path|journey/.test(t)) return "🗺";
  if (/hunter|class|role/.test(t)) return "⚔️";
  if (/five|systems/.test(t)) return "🌐";
  if (/next step|future/.test(t)) return "➡️";
  if (/concept/.test(t)) return "🌱";
  return "◆";
}

function parseSections(body: string): { intro: string; sections: CodexSection[] } {
  // Strip an initial `# Title` line (already shown as the article header)
  const stripped = body.replace(/^\s*#\s+[^\n]+\n+/, "");
  // Split on top-level `# ` headers (not `##`)
  const parts = stripped.split(/^#\s+(.+)$/m);
  // parts[0] = intro before first header, then alternating [title, body, title, body, …]
  const intro = parts[0].trim();
  const sections: CodexSection[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i].trim();
    const sectionBody = (parts[i + 1] ?? "").trim();
    if (!title) continue;
    sections.push({ title, icon: iconForSection(title), body: sectionBody });
  }
  return { intro, sections };
}


    const { data, body } = parseFrontmatter(raw);
    const statusRaw = data["status"] ?? "";
    const status = normalizeStatus(statusRaw);
    const title = extractTitleFromBody(body, slug);
    // Lock rule: Concept-stage articles show preview only.
    const locked = status === "concept";
    out.push({
      slug,
      category: cat,
      title,
      status,
      statusRaw: statusRaw || labelFromStatus(status),
      version: data["version"] ?? null,
      priority: data["priority"] ?? null,
      lastUpdated: data["last updated"] ?? null,
      body,
      locked,
    });
  }
  // Stable ordering: by title within category
  out.sort((a, b) => a.title.localeCompare(b.title));
  return out;
})();

function labelFromStatus(s: CodexStatus): string {
  switch (s) {
    case "frozen": return "🧊 Frozen";
    case "discussed": return "🟢 Discussed";
    case "in-progress": return "🟡 In Progress";
    case "concept": return "💡 Concept";
    case "locked": return "🔒 Locked";
    case "rejected": return "❌ Rejected";
    default: return "— Discussing";
  }
}

export function getStatusMeta(s: CodexStatus) {
  switch (s) {
    case "frozen":      return { label: "🧊 Frozen",      tone: "border-sky-400/50 text-sky-300 bg-sky-500/10" };
    case "discussed":   return { label: "🟢 Discussed",   tone: "border-emerald-400/50 text-emerald-300 bg-emerald-500/10" };
    case "in-progress": return { label: "🟡 In Progress", tone: "border-amber-400/50 text-amber-300 bg-amber-500/10" };
    case "concept":     return { label: "💡 Concept",     tone: "border-purple-400/50 text-purple-300 bg-purple-500/10" };
    case "locked":      return { label: "🔒 Locked",      tone: "border-border text-muted-foreground bg-muted/20" };
    case "rejected":    return { label: "❌ Rejected",    tone: "border-red-500/50 text-red-300 bg-red-500/10" };
    default:            return { label: "— Discussing",   tone: "border-border text-muted-foreground bg-muted/10" };
  }
}

export function listArticlesByCategory(category: CodexCategoryKey): CodexArticle[] {
  return ARTICLES.filter((a) => a.category === category);
}

export function getArticle(category: CodexCategoryKey, slug: string): CodexArticle | undefined {
  return ARTICLES.find((a) => a.category === category && a.slug === slug);
}

export function allArticles(): CodexArticle[] {
  return ARTICLES;
}

export type CodexCategorySummary = CodexCategoryDef & {
  articleCount: number;
  progressPct: number; // % of articles that are frozen
};

export function categorySummaries(): CodexCategorySummary[] {
  return CODEX_CATEGORIES.map((c) => {
    const articles = listArticlesByCategory(c.key);
    const frozen = articles.filter((a) => a.status === "frozen").length;
    const pct = articles.length === 0 ? 0 : Math.round((frozen / articles.length) * 100);
    return { ...c, articleCount: articles.length, progressPct: pct };
  });
}

export function searchArticles(query: string): CodexArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.slug.includes(q) ||
      a.body.toLowerCase().includes(q),
  ).slice(0, 25);
}
