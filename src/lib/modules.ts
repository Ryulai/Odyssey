/**
 * Odyssey Module Catalog — the permanent architecture.
 *
 * Organized into FIVE DOMAINS (not systems):
 *   ⚔️  Class    — How do I grow?
 *   👤 Profile   — Who am I?
 *   ⚓ Guild     — Where do I belong?
 *   🌍 World     — What exists in Odyssey?
 *   ⚙️  System   — How do I manage everything?
 *
 * The Odyssey Map renders these domains as the main navigation of the
 * Odyssey universe. This file is data-only.
 */

export type ModuleStatus = "live" | "planned" | "coming-soon" | "locked";

export type ModuleEntry = {
  key: string;
  label: string;
  to: string;
  status: ModuleStatus;
  description: string;
  /** Loose hint for the future database schema. Not enforced anywhere yet. */
  dataModel?: string;
};

export type ModuleGroup = {
  key: string;
  label: string;
  glyph: string;
  subtitle: string;
  blurb: string;
  entries: ModuleEntry[];
};

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    key: "class",
    label: "Class",
    glyph: "⚔️",
    subtitle: "How do I grow?",
    blurb: "The five progression systems that shape your growth.",
    entries: [
      { key: "five-systems",    label: "Five Core Systems",       to: "/five-systems",    status: "live",        description: "The official core architecture of Odyssey — Performance, Ranking, Secondary Class, Mentorship, Ownership." },
      { key: "performance",     label: "Performance System",      to: "/performance",     status: "live",        description: "Track your monthly performance, ABCD evaluations, reviews, and personal growth." },
      { key: "ranking",         label: "Ranking System",          to: "/promotions",      status: "live",        description: "View your permanent rank progression from Bronze to Legend." },
      { key: "secondary",       label: "Secondary Class System",  to: "/secondary-class", status: "locked",      description: "Unlocked after Gold Rank. Develop a completely independent secondary class and role." },
      { key: "mentorship",      label: "Mentorship System",       to: "/mentorship",      status: "coming-soon", description: "Guide apprentices and develop future Shipbuilders." },
      { key: "ownership",       label: "Ownership System",        to: "/ownership",       status: "coming-soon", description: "Your long-term journey toward becoming a partner, shareholder, or founder." },
    ],
  },
  {
    key: "profile",
    label: "Profile",
    glyph: "👤",
    subtitle: "Who am I?",
    blurb: "Everything that makes your character yours.",
    entries: [
      { key: "character",   label: "Character Profile", to: "/profile",     status: "live",        description: "Identity, assignment, and legacy at a glance." },
      { key: "identity",    label: "Identity",          to: "/profile",     status: "live",        description: "Your Classes, Roles, and Ranks — the identities you carry." },
      { key: "legacy",      label: "Legacy",            to: "/achievements", status: "live",       description: "Stars, Moons, Suns, and every achievement earned across your journey." },
      { key: "records",     label: "Records",           to: "/statistics",  status: "planned",     description: "Career metrics, grade history, streaks, and averages." },
      { key: "collections", label: "Collections",       to: "/collections", status: "planned",     description: "Portraits, emblems, frames, titles, and cosmetics you've collected." },
    ],
  },
  {
    key: "guild",
    label: "Guild",
    glyph: "⚓",
    subtitle: "Where do I belong?",
    blurb: "Your crew, your ship, and the world you operate in.",
    entries: [
      { key: "fleet",        label: "Fleet",               to: "/fleet",        status: "live",        description: "Your ship, your crew, and the vessels that sail beside you." },
      { key: "team-preview", label: "Team Review Preview", to: "/team-preview", status: "live",        description: "For accounts with direct reports: read-only preview of your team's achievements and performance reviews." },

      { key: "registry",  label: "Guild Registry", to: "/guild/registry",  status: "coming-soon", description: "The full roll of members across every ship in the guild." },
      { key: "economy",   label: "Economy",        to: "/guild/economy",   status: "coming-soon", description: "Sales, revenue, and the ledgers that keep the fleet sailing." },
      { key: "locations", label: "Locations",      to: "/guild/locations", status: "coming-soon", description: "Ports, offices, and every place the guild calls home." },
    ],
  },
  {
    key: "world",
    label: "World",
    glyph: "🌍",
    subtitle: "What exists in Odyssey?",
    blurb: "The encyclopedia of Odyssey.",
    entries: [
      { key: "codex",     label: "Odyssey Codex", to: "/codex",           status: "live",        description: "The official knowledge library — philosophy, systems, language, and design." },
      { key: "classes",   label: "Classes",   to: "/world/classes",   status: "coming-soon", description: "Every Class that exists — their purpose, powers, and paths." },
      { key: "roles",     label: "Roles",     to: "/world/roles",     status: "coming-soon", description: "Every Role a Class can take, and what each demands." },
      { key: "influence", label: "Influence", to: "/world/influence", status: "coming-soon", description: "The factions, houses, and forces that shape the guild." },
      { key: "lore",      label: "Lore",      to: "/world/lore",      status: "coming-soon", description: "The stories, legends, and history of the Odyssey world." },
    ],
  },
  {
    key: "system",
    label: "System",
    glyph: "⚙️",
    subtitle: "How do I manage everything?",
    blurb: "Account, preferences, and controls.",
    entries: [
      { key: "notifications", label: "Notifications", to: "/system/notifications", status: "planned", description: "Claim reviews, promotions, mentions." },
      { key: "settings",      label: "Settings",      to: "/system/settings",      status: "planned", description: "Account and integrations." },
      { key: "preferences",   label: "Preferences",   to: "/system/preferences",   status: "planned", description: "Theme, motion, sound, and privacy." },
      { key: "security",      label: "Security",      to: "/system/security",      status: "planned", description: "Password, sessions, and account protection." },
    ],
  },
];

export function findModule(path: string): ModuleEntry | undefined {
  for (const g of MODULE_GROUPS) {
    const m = g.entries.find((e) => e.to === path);
    if (m) return m;
  }
  return undefined;
}
