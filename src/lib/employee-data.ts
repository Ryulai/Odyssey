export type Grade = "A" | "B" | "C" | "D";

export const GRADE_META: Record<Grade, { label: string; tagline: string; color: string }> = {
  A: { label: "Full Sail", tagline: "Excellent Performance", color: "var(--color-grade-a)" },
  B: { label: "Steady Voyage", tagline: "Good Performance", color: "var(--color-grade-b)" },
  C: { label: "On Course", tagline: "Basic Requirement Achieved", color: "var(--color-grade-c)" },
  D: { label: "Adrift", tagline: "Needs Improvement", color: "var(--color-grade-d)" },
};

export type RankKey =
  | "bronze" | "silver" | "gold" | "platinum" | "diamond" | "blackdiamond" | "mythic" | "legend";

export interface RankInfo {
  key: RankKey;
  name: string;
  subtitle: string;
  description: string;
  color: string;
  locked?: boolean;
}

export const HUNTER_RANKS: RankInfo[] = [
  { key: "bronze",       name: "Bronze Hunter",       subtitle: "Apprentice",         description: "Learning the craft.",            color: "var(--color-rank-bronze)" },
  { key: "silver",       name: "Silver Hunter",       subtitle: "Independent",        description: "Operates without supervision.",  color: "var(--color-rank-silver)" },
  { key: "gold",         name: "Gold Hunter",         subtitle: "Professional",       description: "Consistent professional output.",color: "var(--color-rank-gold)" },
  { key: "platinum",     name: "Platinum Hunter",     subtitle: "Elite",              description: "Influential contributor.",       color: "var(--color-rank-platinum)" },
  { key: "diamond",      name: "Diamond Hunter",      subtitle: "Veteran Master",     description: "Defines excellence in the craft.", color: "var(--color-rank-diamond)" },
  { key: "blackdiamond", name: "Black Diamond Hunter",subtitle: "Guild Pillar",       description: "Builds and shapes whole teams.", color: "oklch(0.45 0.05 280)" },
  { key: "mythic",       name: "Mythic Hunter",       subtitle: "Department Legend",  description: "Locked tier.",                    color: "var(--color-rank-mythic)", locked: true },
  { key: "legend",       name: "Legend Hunter",       subtitle: "Company Legend",     description: "Locked tier.",                    color: "var(--color-rank-legend)", locked: true },
];

export type PartnerKey =
  | "explorer" | "guardian" | "candidate" | "partner" | "business" | "shareholder";

export interface PartnerNode {
  key: PartnerKey;
  name: string;
  blurb: string;
  requirements: string[];
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

export interface MonthlyReview {
  month: string;
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

export type AchievementType = "Monthly" | "Season" | "Annual" | "One-Time" | "Milestone";
export type Difficulty = "Easy" | "Standard" | "Hard" | "Epic" | "Legendary";
export type ResetCycle = "Monthly" | "Seasonal" | "Yearly" | "Never";

export interface AchievementRecord {
  period: string; // e.g. "Jan 2026" or "Q1 2026"
  date: string;   // ISO date
  stars: number;  // stars granted on this earning
}

export interface RepeatableAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: AchievementType;
  difficulty: Difficulty;
  resetCycle: ResetCycle;
  repeatable: boolean;
  maxPerCycle: number;     // stars per cycle
  rewardText: string;      // human-friendly reward summary
  history: AchievementRecord[];
}

export interface RankProgress {
  nextRank: RankKey;
  metric: string;
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
  career: CareerTreeNode[];
  reviews: MonthlyReview[];
  abcdHistory: { month: string; grade: Grade }[];
  quests: Quest[];
  attributes: Attribute[];
  achievements: RepeatableAchievement[];
  rankProgress: RankProgress;
  /** Lifetime stars accumulated from past seasons before tracked history. */
  pastLegacyStars: number;
}

export const PARTNER_PATH: PartnerNode[] = [
  { key: "explorer",    name: "Explorer",          blurb: "Curious about the business beyond their craft.",  unlocked: true,  current: false,
    requirements: ["Show interest beyond your craft", "Shadow a senior on one cross-team initiative"] },
  { key: "guardian",    name: "Guardian",          blurb: "Mentors juniors, protects guild standards.",      unlocked: true,  current: true,
    requirements: ["Mentor at least 2 hunters to their first rank up", "Uphold guild standards in reviews"] },
  { key: "candidate",   name: "Partner Candidate", blurb: "Demonstrates cross-functional leadership.",       unlocked: false,
    requirements: ["Black Diamond rank", "Lead one cross-team campaign", "Captain's nomination"] },
  { key: "partner",     name: "Partner",           blurb: "Trusted captain of a business line.",             unlocked: false,
    requirements: ["Own a sub-line for 2 seasons", "Sustain Guild Elder legacy"] },
  { key: "business",    name: "Business Partner",  blurb: "Owns a P&L and grows new ventures.",              unlocked: false,
    requirements: ["Launch and sustain a new venture", "Board-level review"] },
  { key: "shareholder", name: "Shareholder",       blurb: "Long-term steward of the guild.",                 unlocked: false,
    requirements: ["Decade of stewardship", "Founders' invitation"] },
];

/* -------------------------- Legacy Title System -------------------------- */

export interface LegacyTitle {
  name: string;
  minStars: number;
  flavor: string;
}

export const LEGACY_TITLES: LegacyTitle[] = [
  { name: "Wanderer",          minStars: 0,   flavor: "The journey has just begun." },
  { name: "Pathfinder",        minStars: 10,  flavor: "One moon claimed. A path emerges." },
  { name: "Voyager",           minStars: 30,  flavor: "Three moons. The map widens." },
  { name: "Shipbuilder",       minStars: 50,  flavor: "A sun rises. You forge what others sail." },
  { name: "Master Shipbuilder",minStars: 150, flavor: "Three suns. Your fleet is your own." },
  { name: "Guild Elder",       minStars: 250, flavor: "Five suns. Your name carries weight." },
  { name: "Living Legend",     minStars: 500, flavor: "Ten suns. Songs are sung in your name." },
];

// Compression: 10 stars = 1 moon, 5 moons = 1 sun (so 1 sun = 50 stars)
export function computeLegacy(totalStars: number) {
  const suns  = Math.floor(totalStars / 50);
  const remAfterSuns = totalStars - suns * 50;
  const moons = Math.floor(remAfterSuns / 10);
  const stars = remAfterSuns - moons * 10;
  let title = LEGACY_TITLES[0];
  for (const t of LEGACY_TITLES) if (totalStars >= t.minStars) title = t;
  const next = LEGACY_TITLES.find(t => t.minStars > totalStars);
  return { suns, moons, stars, total: totalStars, title, next };
}

export function totalStars(emp: Employee): number {
  const earned = emp.achievements.reduce(
    (sum, a) => sum + a.history.reduce((s, h) => s + h.stars, 0),
    0,
  );
  return earned + emp.pastLegacyStars;
}

/* -------------------------------- Sample -------------------------------- */

export const SAMPLE_EMPLOYEE: Employee = {
  id: "emp-001",
  name: "Ariane Voss",
  guildTitle: "Field Hunter, Northwind Division",
  joinedOn: "2022-03-14",
  avatar: "AV",
  currentGrade: "A",
  currentRank: "platinum",
  partnerStage: "guardian",
  pastLegacyStars: 118, // accumulated from seasons before the tracked log
  abcdHistory: [
    { month: "2025-06", grade: "C" },
    { month: "2025-07", grade: "B" },
    { month: "2025-08", grade: "B" },
    { month: "2025-09", grade: "A" },
    { month: "2025-10", grade: "B" },
    { month: "2025-11", grade: "A" },
    { month: "2025-12", grade: "B" },
    { month: "2026-01", grade: "B" },
    { month: "2026-02", grade: "A" },
    { month: "2026-03", grade: "C" },
    { month: "2026-04", grade: "B" },
    { month: "2026-05", grade: "A" },
  ],
  career: [
    { id: "c1", label: "First Strike",       branch: "combat",   tier: 1, status: "mastered",  desc: "Close your first deal solo." },
    { id: "c2", label: "Pursuit Doctrine",   branch: "combat",   tier: 2, status: "mastered",  desc: "Run a full pipeline cycle." },
    { id: "c3", label: "Siege Warfare",      branch: "combat",   tier: 3, status: "active",    desc: "Lead an enterprise pursuit." },
    { id: "c4", label: "Field Marshal",      branch: "combat",   tier: 4, status: "locked",    desc: "Command a multi-team campaign." },
    { id: "s1", label: "Map Reading",        branch: "strategy", tier: 1, status: "mastered",  desc: "Read the territory deck." },
    { id: "s2", label: "Route Planning",     branch: "strategy", tier: 2, status: "mastered",  desc: "Plan a quarterly territory." },
    { id: "s3", label: "Theatre Command",    branch: "strategy", tier: 3, status: "available", desc: "Own a regional plan." },
    { id: "s4", label: "Grand Strategy",     branch: "strategy", tier: 4, status: "locked",    desc: "Set multi-year direction." },
    { id: "k1", label: "Toolsmith",          branch: "craft",    tier: 1, status: "mastered",  desc: "Master the CRM forge." },
    { id: "k2", label: "Compass Maker",      branch: "craft",    tier: 2, status: "active",    desc: "Build a reusable playbook." },
    { id: "k3", label: "Engine Builder",     branch: "craft",    tier: 3, status: "locked",    desc: "Ship an internal system." },
    { id: "k4", label: "Forgemaster",        branch: "craft",    tier: 4, status: "locked",    desc: "Define a guild-wide standard." },
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
  achievements: [
    {
      id: "top-sales", name: "Top Sales", icon: "👑",
      description: "Ranked #1 hunter of the month.",
      type: "Monthly", difficulty: "Hard", resetCycle: "Monthly",
      repeatable: true, maxPerCycle: 1, rewardText: "+1 Star per month",
      history: [
        { period: "Jan 2026", date: "2026-01-31", stars: 1 },
        { period: "Mar 2026", date: "2026-03-31", stars: 1 },
        { period: "Apr 2026", date: "2026-04-30", stars: 1 },
      ],
    },
    {
      id: "baller-sales", name: "Baller Sales", icon: "💰",
      description: "Hit 150% of monthly sales target.",
      type: "Monthly", difficulty: "Epic", resetCycle: "Monthly",
      repeatable: true, maxPerCycle: 1, rewardText: "+1 Star per month",
      history: [
        { period: "Feb 2026", date: "2026-02-28", stars: 1 },
        { period: "May 2026", date: "2026-05-31", stars: 1 },
      ],
    },
    {
      id: "thank-you", name: "Thank You", icon: "🙏",
      description: "Collect 10 client gratitude scrolls in a month.",
      type: "Monthly", difficulty: "Standard", resetCycle: "Monthly",
      repeatable: true, maxPerCycle: 1, rewardText: "+1 Star per month",
      history: [
        { period: "Dec 2025", date: "2025-12-31", stars: 1 },
        { period: "Mar 2026", date: "2026-03-31", stars: 1 },
        { period: "Apr 2026", date: "2026-04-30", stars: 1 },
        { period: "May 2026", date: "2026-05-31", stars: 1 },
      ],
    },
    {
      id: "nothing-cant-sell", name: "Nothing I Can't Sell", icon: "🗡",
      description: "Close a deal in every product line in the season.",
      type: "Season", difficulty: "Epic", resetCycle: "Seasonal",
      repeatable: true, maxPerCycle: 1, rewardText: "+1 Star per season",
      history: [
        { period: "Q1 2026", date: "2026-03-31", stars: 1 },
        { period: "Q2 2026", date: "2026-06-30", stars: 1 },
      ],
    },
    {
      id: "attention-seeker", name: "Attention Seeker", icon: "📢",
      description: "Top engagement on a guild campaign.",
      type: "Monthly", difficulty: "Standard", resetCycle: "Monthly",
      repeatable: true, maxPerCycle: 1, rewardText: "+1 Star per month",
      history: [
        { period: "Feb 2026", date: "2026-02-28", stars: 1 },
        { period: "Apr 2026", date: "2026-04-30", stars: 1 },
      ],
    },
    {
      id: "iron-man", name: "Iron Man", icon: "🛡",
      description: "12 consecutive months without a missed target.",
      type: "Annual", difficulty: "Legendary", resetCycle: "Yearly",
      repeatable: true, maxPerCycle: 1, rewardText: "+3 Stars per year",
      history: [],
    },
    {
      id: "mentorship", name: "Mentorship", icon: "🧙",
      description: "Guide a junior to their first rank up.",
      type: "Season", difficulty: "Hard", resetCycle: "Seasonal",
      repeatable: true, maxPerCycle: 2, rewardText: "+1 Star per mentee",
      history: [
        { period: "Q4 2025", date: "2025-12-15", stars: 1 },
        { period: "Q1 2026", date: "2026-03-20", stars: 2 },
        { period: "Q2 2026", date: "2026-04-10", stars: 1 },
      ],
    },
    {
      id: "game-changer", name: "Game Changer", icon: "💎",
      description: "Ship an innovation adopted guild-wide.",
      type: "One-Time", difficulty: "Legendary", resetCycle: "Never",
      repeatable: false, maxPerCycle: 1, rewardText: "+5 Stars · permanent",
      history: [],
    },
  ],
  rankProgress: {
    nextRank: "diamond",
    metric: "A Grades",
    current: 8,
    needed: 12,
    notes: [
      "Sustain Platinum-tier capability for 4 more months.",
      "Captain's nomination required for the final trial.",
      "Complete one Tier-4 Career branch.",
    ],
  },
};
