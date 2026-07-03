/**
 * Odyssey Module Catalog — the permanent architecture.
 *
 * This file is intentionally data-only. It describes every module Odyssey will
 * eventually contain so navigation, the Odyssey Map, and future database
 * models all agree on one source of truth.
 *
 * Future work: replace `status: "planned" | "coming-soon"` entries with real
 * routes/components and, when needed, populate the `dataModel` hints in a
 * Supabase migration.
 */

export type ModuleStatus = "live" | "planned" | "coming-soon" | "locked";

export type ModuleEntry = {
  key: string;
  label: string;
  to: string;                    // route path
  status: ModuleStatus;
  description: string;
  /** Loose hint for the future database schema. Not enforced anywhere yet. */
  dataModel?: string;
};

export type ModuleGroup = {
  key: string;
  label: string;
  blurb: string;
  entries: ModuleEntry[];
};

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    key: "career",
    label: "Career",
    blurb: "Your professional voyage — primary path, secondary craft, mentorship, and ownership.",
    entries: [
      { key: "primary",     label: "Primary Class",       to: "/class",              status: "live",         description: "Your main class, rank progression, and monthly performance.", dataModel: "rpg_identity + monthly_evaluations" },
      { key: "secondary",   label: "Secondary Class",     to: "/secondary-class",    status: "locked",       description: "Unlocked at Gold — a second craft you cultivate alongside your primary.", dataModel: "rpg_identity.secondary_class" },
      { key: "mentorship",  label: "Mentorship",          to: "/mentorship",         status: "coming-soon",  description: "Guide the crew. Track proteges, sessions, and the mentors who shaped you.", dataModel: "mentorships(mentor_id, protege_id, started_at, status)" },
      { key: "ownership",   label: "Ownership",           to: "/ownership",          status: "coming-soon",  description: "Ventures, holdings, and legacy titles — the shipbuilder's ledger.", dataModel: "legacy_holdings + ventures(id, name, kind, granted_at)" },
    ],
  },
  {
    key: "profile",
    label: "Profile",
    blurb: "Everything that makes your character yours.",
    entries: [
      { key: "character",     label: "Character Profile", to: "/profile",           status: "live",        description: "Identity, assignment, and legacy at a glance." },
      { key: "legacy",        label: "Legacy",            to: "/profile",           status: "live",        description: "Stars, Moons, Suns — the lifetime record.", dataModel: "achievement_records aggregates" },
      { key: "achievements",  label: "Achievements",      to: "/achievements",      status: "planned",     description: "Every star earned, every claim submitted.", dataModel: "achievements + achievement_records" },
      { key: "collections",   label: "Collections",       to: "/collections",       status: "planned",     description: "Portraits, emblems, frames, and cosmetics you've collected." },
      { key: "statistics",    label: "Statistics",        to: "/statistics",        status: "planned",     description: "Career metrics, grade history, streaks, and averages.", dataModel: "derived aggregates over monthly_evaluations" },
      { key: "inventory",     label: "Inventory",         to: "/inventory",         status: "coming-soon", description: "Consumables, tokens, and time-limited perks.", dataModel: "inventory_items(owner_id, kind, qty, expires_at)" },
      { key: "journal",       label: "Journal",           to: "/journal",           status: "coming-soon", description: "Your voyage log — milestones, notes, and reflections.", dataModel: "journal_entries(author_id, kind, body, occurred_at)" },
    ],
  },
  {
    key: "collections",
    label: "Collections",
    blurb: "Every collectable Odyssey will offer — cosmetic, seasonal, and honorary.",
    entries: [
      { key: "portraits",    label: "Portraits",             to: "/collections/portraits",    status: "planned",     description: "Default avatars unlocked through the voyage.", dataModel: "collection_items(kind='portrait')" },
      { key: "emblems",      label: "Guild Emblems",         to: "/collections/emblems",      status: "planned",     description: "Sigils earned through faction service.", dataModel: "collection_items(kind='emblem')" },
      { key: "frames",       label: "Portrait Frames",       to: "/collections/frames",       status: "planned",     description: "Ornamental borders that ring your portrait.", dataModel: "collection_items(kind='frame')" },
      { key: "cosmetics",    label: "Cosmetic Collections",  to: "/collections/cosmetics",    status: "planned",     description: "Purely decorative sets curated by season." },
      { key: "seasonal",     label: "Seasonal Collections",  to: "/collections/seasonal",     status: "coming-soon", description: "Time-boxed sets tied to Odyssey seasons.", dataModel: "collection_sets(season_id)" },
      { key: "events",       label: "Event Collections",     to: "/collections/events",       status: "coming-soon", description: "Rewards from one-off guild events.", dataModel: "collection_sets(event_id)" },
      { key: "founder",      label: "Founder Collections",   to: "/collections/founder",      status: "planned",     description: "Reserved for those who sailed the first voyage." },
      { key: "titles",       label: "Titles",                to: "/collections/titles",       status: "planned",     description: "Honorifics you can display beside your name.", dataModel: "collection_items(kind='title')" },
      { key: "backgrounds",  label: "Backgrounds",           to: "/collections/backgrounds",  status: "planned",     description: "Scenes that frame your character page.", dataModel: "collection_items(kind='background')" },
      { key: "effects",      label: "Profile Effects",       to: "/collections/effects",      status: "coming-soon", description: "Animated glows and particle effects for your portrait.", dataModel: "collection_items(kind='effect')" },
    ],
  },
  {
    key: "system",
    label: "System",
    blurb: "Account, preferences, and guild-wide tools.",
    entries: [
      { key: "notifications",     label: "Notifications",     to: "/system/notifications",     status: "planned",     description: "Claim reviews, promotions, mentions.", dataModel: "notifications(user_id, kind, payload, read_at)" },
      { key: "settings",          label: "Settings",          to: "/system/settings",          status: "planned",     description: "Account, security, and integrations." },
      { key: "preferences",       label: "Preferences",       to: "/system/preferences",       status: "planned",     description: "Theme, motion, sound, and privacy.", dataModel: "user_preferences(user_id, key, value)" },
      { key: "guild-collection",  label: "Guild Collection",  to: "/system/guild-collection",  status: "coming-soon", description: "Shared trophies and records for the whole guild." },
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
