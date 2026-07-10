/**
 * Odyssey Codex — the official knowledge base and design authority of the
 * Odyssey Operating System.
 *
 * Every core system inside Odyssey has a Codex page. Content is sourced from
 * Markdown files under /odyssey-codex/ (the GitHub-synced source of truth).
 * When a system does not yet have a frozen Markdown file, a placeholder page
 * still appears in the Codex using the official Odyssey lifecycle status:
 *
 *   🟢 Frozen        Official version synchronized with GitHub.
 *   🟠 In Progress   Currently being implemented.
 *   🟡 Draft         Currently under discussion and design.
 *   🔒 Locked        Reserved for future development.
 *   🅿️ Parking Lot   Approved future enhancement, intentionally postponed.
 */

export type CodexStatus =
  | "frozen"
  | "in-progress"
  | "draft"
  | "locked"
  | "parking"
  // legacy statuses kept so historical articles keep rendering
  | "discussed"
  | "concept"
  | "rejected"
  | "unknown";

export type CodexCategoryKey =
  | "foundation"
  | "systems"
  | "organization"
  | "economy"
  | "design-engine"
  | "language"
  | "knowledge"
  | "roadmap";

export type CodexCategoryDef = {
  key: CodexCategoryKey;
  /** Directories under /odyssey-codex to include in this category. */
  folders: string[];
  title: string;
  description: string;
};

export const CODEX_CATEGORIES: CodexCategoryDef[] = [
  {
    key: "foundation",
    folders: ["foundation"],
    title: "Foundation",
    description: "Philosophy, vision, mission and the core values of Odyssey.",
  },
  {
    key: "systems",
    folders: ["core-systems", "systems"],
    title: "Systems",
    description: "The progression systems that power every member's journey.",
  },
  {
    key: "organization",
    folders: ["organization"],
    title: "Organization",
    description: "How the guild, fleet and staff are structured and operated.",
  },
  {
    key: "economy",
    folders: ["economy"],
    title: "Economy",
    description: "Legacy, currency and reward mechanics of the Odyssey world.",
  },
  {
    key: "design-engine",
    folders: ["design-engine"],
    title: "Design Engine",
    description: "The framework used to design every Odyssey system.",
  },
  {
    key: "language",
    folders: ["language"],
    title: "Language",
    description: "The shared vocabulary that keeps the guild aligned.",
  },
  {
    key: "knowledge",
    folders: ["knowledge"],
    title: "Knowledge",
    description: "Decision logs, parking slots and rejected ideas.",
  },
  {
    key: "roadmap",
    folders: ["roadmap"],
    title: "Roadmap",
    description: "Current development and future expansion.",
  },
];

export type CodexSection = {
  title: string;
  icon: string;
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
  owner: string | null;
  lastUpdated: string | null;
  completionPct: number;
  body: string;
  intro: string;
  sections: CodexSection[];
  /** Only true when status === "locked" — page cannot be opened. */
  locked: boolean;
};

export function completionForStatus(s: CodexStatus): number {
  switch (s) {
    case "frozen":      return 100;
    case "discussed":   return 80;
    case "in-progress": return 60;
    case "draft":       return 30;
    case "concept":     return 15;
    case "parking":     return 10;
    case "rejected":    return 0;
    case "locked":      return 0;
    default:            return 0;
  }
}

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
  if (s.includes("parking")) return "parking";
  if (s.includes("lock")) return "locked";
  if (s.includes("in progress") || s.includes("in-progress")) return "in-progress";
  if (s.includes("draft")) return "draft";
  if (s.includes("discuss")) return "discussed";
  if (s.includes("progress")) return "in-progress";
  if (s.includes("design")) return "in-progress";
  if (s.includes("concept")) return "concept";
  if (s.includes("planned")) return "locked";
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
  const parts = path.split("/");
  const folder = parts[parts.length - 2];
  const cat = CODEX_CATEGORIES.find((c) => c.folders.includes(folder));
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
  const stripped = body.replace(/^\s*#\s+[^\n]+\n+/, "");
  const parts = stripped.split(/^#\s+(.+)$/m);
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

const ARTICLES: CodexArticle[] = (() => {
  const out: CodexArticle[] = [];
  for (const [path, raw] of Object.entries(RAW_FILES)) {
    const cat = categoryFromPath(path);
    if (!cat) continue;
    const slug = slugFromFilename(path);
    const { data, body } = parseFrontmatter(raw);
    const statusRaw = data["status"] ?? "";
    const status = normalizeStatus(statusRaw);
    const title = extractTitleFromBody(body, slug);
    const { intro, sections } = parseSections(body);
    const locked = status === "locked";
    out.push({
      slug,
      category: cat,
      title,
      status,
      statusRaw: statusRaw || labelFromStatus(status),
      version: data["version"] ?? null,
      priority: data["priority"] ?? null,
      owner: data["owner"] ?? null,
      lastUpdated: data["last updated"] ?? null,
      completionPct: completionForStatus(status),
      body,
      intro,
      sections,
      locked,
    });
  }
  out.sort((a, b) => a.title.localeCompare(b.title));
  return out;
})();

function labelFromStatus(s: CodexStatus): string {
  return getStatusMeta(s).label;
}

export function getStatusMeta(s: CodexStatus) {
  switch (s) {
    case "frozen":      return { label: "🟢 Frozen",       tone: "border-emerald-400/50 text-emerald-300 bg-emerald-500/10" };
    case "in-progress": return { label: "🟠 In Progress",  tone: "border-orange-400/50 text-orange-300 bg-orange-500/10" };
    case "draft":       return { label: "🟡 Draft",        tone: "border-amber-400/50 text-amber-300 bg-amber-500/10" };
    case "locked":      return { label: "🔒 Locked",       tone: "border-border text-muted-foreground bg-muted/20" };
    case "parking":     return { label: "🅿️ Parking Lot",  tone: "border-sky-400/40 text-sky-300 bg-sky-500/10" };
    case "discussed":   return { label: "🟢 Discussed",    tone: "border-emerald-400/50 text-emerald-300 bg-emerald-500/10" };
    case "concept":     return { label: "💡 Concept",      tone: "border-purple-400/50 text-purple-300 bg-purple-500/10" };
    case "rejected":    return { label: "❌ Rejected",     tone: "border-red-500/50 text-red-300 bg-red-500/10" };
    default:            return { label: "— Unclassified",  tone: "border-border text-muted-foreground bg-muted/10" };
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
  progressPct: number;
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
