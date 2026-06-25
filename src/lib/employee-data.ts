export type Grade = "A" | "B" | "C" | "D";

export const GRADE_META: Record<Grade, { label: string; tagline: string; color: string }> = {
  A: { label: "Full Sail", tagline: "Excellent Performance", color: "var(--color-grade-a)" },
  B: { label: "Steady Voyage", tagline: "Good Performance", color: "var(--color-grade-b)" },
  C: { label: "On Course", tagline: "Basic Requirement Achieved", color: "var(--color-grade-c)" },
  D: { label: "Adrift", tagline: "Needs Improvement", color: "var(--color-grade-d)" },
};

export type RankKey =
  | "bronze" | "silver" | "gold" | "platinum" | "diamond" | "mythic" | "legend";

export interface RankInfo {
  key: RankKey;
  name: string;
  subtitle: string;
  description: string;
  color: string;
  locked?: boolean;
}

export const HUNTER_RANKS: RankInfo[] = [
  { key: "bronze",   name: "Bronze Hunter",   subtitle: "Apprentice",            description: "Learning the craft.",            color: "var(--color-rank-bronze)" },
  { key: "silver",   name: "Silver Hunter",   subtitle: "Independent Hunter",    description: "Operates without supervision.",  color: "var(--color-rank-silver)" },
  { key: "gold",     name: "Gold Hunter",     subtitle: "Professional Hunter",   description: "Consistent professional output.",color: "var(--color-rank-gold)" },
  { key: "platinum", name: "Platinum Hunter", subtitle: "Elite Hunter",          description: "Influential contributor.",       color: "var(--color-rank-platinum)" },
  { key: "diamond",  name: "Black Diamond",   subtitle: "Master Hunter",         description: "Builds and shapes teams.",       color: "var(--color-rank-diamond)" },
  { key: "mythic",   name: "Mythic Hunter",   subtitle: "Department Legend",     description: "Locked tier.",                    color: "var(--color-rank-mythic)", locked: true },
  { key: "legend",   name: "Legend Hunter",   subtitle: "Company Legend",        description: "Locked tier.",                    color: "var(--color-rank-legend)", locked: true },
];

export type PartnerKey =
  | "explorer" | "guardian" | "candidate" | "partner" | "business" | "shareholder";

export interface PartnerNode {
  key: PartnerKey;
  name: string;
  blurb: string;
  unlocked: boolean;
  current?: boolean;
}

export type CareerTreeNode = {
  id: string;
  label: string;
  branch: "combat" | "strategy" | "craft" | "lore";
  tier: 1 | 2 | 3 | 4;
  status: "mastered" | "active" | "available" | "locked";
  desc: string;
};

export interface AchievementStar {
  id: string;
  title: string;
  category: "Quest" | "Mentorship" | "Innovation" | "Loyalty" | "Crisis";
  earnedOn: string;
  rarity: 1 | 2 | 3 | 4 | 5;
}

export interface MonthlyReview {
  month: string; // "2026-05"
  grade: Grade;
  highlights: string[];
  improvements: string[];
  reviewer: string;
}

export interface Quest {
  id: string;
  name: string;
  flavor: string;
  icon: string;
  current: number;
  target: number;
  unit: string;
  reward: string;
}

export interface Attribute {
  key: "sales" | "brand" | "network" | "marketing" | "professional";
  label: string;
  flavor: string;
  icon: string;
  stars: 1 | 2 | 3 | 4 | 5;
}

export interface CollectionAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  unlocked: boolean;
  unlockedOn?: string;
  hint?: string;
}

export interface RankProgress {
  nextRank: RankKey;
  metric: string;          // "A Grades"
  current: number;
  needed: number;
  notes: string[];
}

export interface Employee {
  id: string;
  name: string;
  guildTitle: string;
  joinedOn: string;
  avatar: string;
  currentGrade: Grade;
  currentRank: RankKey;
  partnerStage: PartnerKey;
  stars: AchievementStar[];
  career: CareerTreeNode[];
  reviews: MonthlyReview[];
  abcdHistory: { month: string; grade: Grade }[];
  quests: Quest[];
  attributes: Attribute[];
  collection: CollectionAchievement[];
  rankProgress: RankProgress;
}

export const PARTNER_PATH: PartnerNode[] = [
  { key: "explorer",    name: "Explorer",          blurb: "Curious about the business beyond their craft.",   unlocked: true,  current: false },
  { key: "guardian",    name: "Guardian",          blurb: "Mentors juniors, protects guild standards.",       unlocked: true,  current: true  },
  { key: "candidate",   name: "Partner Candidate", blurb: "Demonstrates cross-functional leadership.",         unlocked: false },
  { key: "partner",     name: "Partner",           blurb: "Trusted captain of a business line.",              unlocked: false },
  { key: "business",    name: "Business Partner",  blurb: "Owns a P&L and grows new ventures.",                unlocked: false },
  { key: "shareholder", name: "Shareholder",       blurb: "Long-term steward of the guild.",                   unlocked: false },
];

export const SAMPLE_EMPLOYEE: Employee = {
  id: "emp-001",
  name: "Ariane Voss",
  guildTitle: "Field Hunter, Northwind Division",
  joinedOn: "2022-03-14",
  avatar: "AV",
  currentGrade: "A",
  currentRank: "platinum",
  partnerStage: "guardian",
  abcdHistory: [
    { month: "2025-12", grade: "B" },
    { month: "2026-01", grade: "B" },
    { month: "2026-02", grade: "A" },
    { month: "2026-03", grade: "C" },
    { month: "2026-04", grade: "B" },
    { month: "2026-05", grade: "A" },
  ],
  stars: [
    { id: "s1", title: "Closed the Vermillion Contract",       category: "Quest",       earnedOn: "2026-05-22", rarity: 5 },
    { id: "s2", title: "Mentored 3 Bronze Hunters to Silver",  category: "Mentorship",  earnedOn: "2026-04-10", rarity: 4 },
    { id: "s3", title: "Salvaged the Q1 Launch",               category: "Crisis",      earnedOn: "2026-03-30", rarity: 5 },
    { id: "s4", title: "Built the Lead-Scoring Compass",       category: "Innovation",  earnedOn: "2026-02-18", rarity: 4 },
    { id: "s5", title: "Three Years at the Guild",             category: "Loyalty",     earnedOn: "2025-03-14", rarity: 3 },
    { id: "s6", title: "First Independent Hunt",               category: "Quest",       earnedOn: "2023-06-02", rarity: 2 },
  ],
  career: [
    // Combat (execution)
    { id: "c1", label: "First Strike",       branch: "combat",   tier: 1, status: "mastered",  desc: "Close your first deal solo." },
    { id: "c2", label: "Pursuit Doctrine",   branch: "combat",   tier: 2, status: "mastered",  desc: "Run a full pipeline cycle." },
    { id: "c3", label: "Siege Warfare",      branch: "combat",   tier: 3, status: "active",    desc: "Lead an enterprise pursuit." },
    { id: "c4", label: "Field Marshal",      branch: "combat",   tier: 4, status: "locked",    desc: "Command a multi-team campaign." },
    // Strategy
    { id: "s1", label: "Map Reading",        branch: "strategy", tier: 1, status: "mastered",  desc: "Read the territory deck." },
    { id: "s2", label: "Route Planning",     branch: "strategy", tier: 2, status: "mastered",  desc: "Plan a quarterly territory." },
    { id: "s3", label: "Theatre Command",    branch: "strategy", tier: 3, status: "available", desc: "Own a regional plan." },
    { id: "s4", label: "Grand Strategy",     branch: "strategy", tier: 4, status: "locked",    desc: "Set multi-year direction." },
    // Craft (tools)
    { id: "k1", label: "Toolsmith",          branch: "craft",    tier: 1, status: "mastered",  desc: "Master the CRM forge." },
    { id: "k2", label: "Compass Maker",      branch: "craft",    tier: 2, status: "active",    desc: "Build a reusable playbook." },
    { id: "k3", label: "Engine Builder",     branch: "craft",    tier: 3, status: "locked",    desc: "Ship an internal system." },
    { id: "k4", label: "Forgemaster",        branch: "craft",    tier: 4, status: "locked",    desc: "Define a guild-wide standard." },
    // Lore (knowledge)
    { id: "l1", label: "Guild Codex",        branch: "lore",     tier: 1, status: "mastered",  desc: "Learn the guild charter." },
    { id: "l2", label: "Market Almanac",     branch: "lore",     tier: 2, status: "mastered",  desc: "Speak the customer's language." },
    { id: "l3", label: "Rival Studies",      branch: "lore",     tier: 3, status: "available", desc: "Brief the guild on a rival." },
    { id: "l4", label: "Loremaster",         branch: "lore",     tier: 4, status: "locked",    desc: "Author canon for the guild." },
  ],
  reviews: [
    { month: "2026-05", grade: "A", reviewer: "Captain Rho",
      highlights: ["Closed Vermillion contract three weeks early.", "Stood in for the chapter lead during their leave."],
      improvements: ["Document the playbook so others can repeat it."] },
    { month: "2026-04", grade: "B", reviewer: "Captain Rho",
      highlights: ["Mentored two new Bronze hunters."],
      improvements: ["Forecast accuracy slipped on two opportunities."] },
    { month: "2026-03", grade: "C", reviewer: "Captain Rho",
      highlights: ["Hit baseline activity targets."],
      improvements: ["Pipeline coverage thin; needs prospecting cadence."] },
  ],
  quests: [
    { id: "q1", name: "Sales Target",        flavor: "Slay the monthly revenue beast.",     icon: "⚔",  current: 78000, target: 100000, unit: "gp",     reward: "+1 Star · Rank XP" },
    { id: "q2", name: "Exposure Target",     flavor: "Raise the banner across the realm.",  icon: "🏴", current: 42,    target: 60,     unit: "posts",  reward: "Brand Influence +" },
    { id: "q3", name: "Event Participation", flavor: "Show your colors at the gatherings.", icon: "🎪", current: 3,     target: 4,      unit: "events", reward: "Network Influence +" },
    { id: "q4", name: "Reviews Collected",   flavor: "Gather testaments from clients won.", icon: "📜", current: 9,     target: 12,     unit: "scrolls", reward: "Professional Influence +" },
  ],
  attributes: [
    { key: "sales",        label: "Sales Influence",        flavor: "Power to close the hunt.",            icon: "⚔",  stars: 5 },
    { key: "brand",        label: "Brand Influence",        flavor: "Reach of your banner.",                icon: "🏴", stars: 3 },
    { key: "network",      label: "Network Influence",      flavor: "Strength of your alliances.",          icon: "🤝", stars: 4 },
    { key: "marketing",    label: "Marketing Influence",    flavor: "Charm of your warcry.",                icon: "📣", stars: 2 },
    { key: "professional", label: "Professional Influence", flavor: "Respect among fellow hunters.",        icon: "🎖", stars: 4 },
  ],
  collection: [
    { id: "a1", name: "Baller Sales",         description: "Hit 150% of monthly sales target.",       icon: "💰", rarity: "Epic",      unlocked: true,  unlockedOn: "2026-05-22" },
    { id: "a2", name: "Top Sales",            description: "Ranked #1 hunter of the season.",         icon: "👑", rarity: "Legendary", unlocked: true,  unlockedOn: "2026-04-01" },
    { id: "a3", name: "Thank You",            description: "Receive 10 client gratitude scrolls.",    icon: "🙏", rarity: "Rare",      unlocked: true,  unlockedOn: "2026-03-12" },
    { id: "a4", name: "Nothing I Can't Sell", description: "Close a deal in every product line.",     icon: "🗡", rarity: "Epic",      unlocked: false, hint: "Hunt across all five product realms." },
    { id: "a5", name: "Attention Seeker",     description: "Top engagement on social campaigns.",     icon: "📢", rarity: "Rare",      unlocked: true,  unlockedOn: "2026-02-09" },
    { id: "a6", name: "Iron Man",             description: "12 months without a missed target.",      icon: "🛡", rarity: "Legendary", unlocked: false, hint: "Currently at 8 of 12 months." },
    { id: "a7", name: "Mentorship",           description: "Guide 3 juniors to their first rank up.", icon: "🧙", rarity: "Epic",      unlocked: true,  unlockedOn: "2026-04-10" },
    { id: "a8", name: "Game Changer",         description: "Ship an innovation adopted guild-wide.",  icon: "💎", rarity: "Legendary", unlocked: false, hint: "A relic yet to be forged." },
  ],
  rankProgress: {
    nextRank: "diamond",
    metric: "A Grades",
    current: 8,
    needed: 12,
    notes: [
      "Maintain Platinum-level capability for 4 more months.",
      "Captain's nomination required for the final trial.",
      "Complete one Tier-4 Career branch.",
    ],
  },
};
