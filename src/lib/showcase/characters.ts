// Static demo fixture for Showcase Mode. Read-only, no persistence.

export type ShowcaseRank =
  | "Apprentice"
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Master"
  | "Legend";

export const RANK_ORDER: ShowcaseRank[] = [
  "Apprentice",
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Master",
  "Legend",
];

export type Achievement = {
  id: string;
  name: string;
  description: string;
  quote: string;
  unlockedOn: string | null; // null = locked
  progress: number; // 0-100
  icon: string; // emoji
  rare?: boolean;
};

export type TimelineEvent = {
  date: string;
  title: string;
  icon: string;
  kind: "join" | "rank" | "achievement" | "mission" | "unlock" | "future";
};

export type SecondaryTree = {
  key: string;
  name: string;
  icon: string;
  level: number;
  progress: number;
  nextUnlock: string;
  description: string;
  unlocked: boolean;
};

export type Mentee = {
  name: string;
  rank: ShowcaseRank;
  since: string;
  growth: number; // 0-100
  note: string;
};

export type OwnershipStage =
  | "Explorer"
  | "Guardian"
  | "Partner Candidate"
  | "Partner"
  | "Business Partner"
  | "Shareholder";

export const OWNERSHIP_ORDER: OwnershipStage[] = [
  "Explorer",
  "Guardian",
  "Partner Candidate",
  "Partner",
  "Business Partner",
  "Shareholder",
];

export type ShowcaseCharacter = {
  id: string;
  name: string;
  title: string;
  tenure: string;
  rank: ShowcaseRank;
  portraitGradient: string; // css gradient for placeholder
  portraitInitial: string;
  season: string;
  currentMission: string;
  currentGoal: string;
  performance: {
    overall: number;
    behaviour: number;
    direction: number;
    contribution: number;
    result: number;
    trend: number[]; // 6 months
    focus: string;
  };
  mentorship: {
    score: number;
    peopleHelped: number;
    influence: number;
    mentees: Mentee[];
  };
  ownership: OwnershipStage;
  achievements: Achievement[];
  timeline: TimelineEvent[];
  secondaryTrees: SecondaryTree[];
  unlockedBranches: string[]; // journey map branches
  titles: string[];
  bio: string;
};

export const JOURNEY_TREE = {
  secondaryClass: ["Trainer", "Leader", "Content Creator", "Mixologist"],
  mentorship: ["Mentorship"],
  ownership: ["Partner Candidate", "Partner", "Shareholder"],
} as const;

const ALL_BRANCHES: string[] = [
  ...JOURNEY_TREE.secondaryClass,
  ...JOURNEY_TREE.mentorship,
  ...JOURNEY_TREE.ownership,
];


const baseAchievements = (unlocked: string[]): Achievement[] => [
  {
    id: "first-blood",
    name: "First Blood",
    description: "Closed your very first sale.",
    quote: "Every legend begins with one.",
    unlockedOn: unlocked.includes("first-blood") ? "Week 1" : null,
    progress: unlocked.includes("first-blood") ? 100 : 0,
    icon: "🩸",
  },
  {
    id: "thank-you",
    name: "Thank You",
    description: "Received a written appreciation from a customer.",
    quote: "The customer remembers how you made them feel.",
    unlockedOn: unlocked.includes("thank-you") ? "Month 3" : null,
    progress: unlocked.includes("thank-you") ? 100 : 40,
    icon: "💌",
  },
  {
    id: "top-sales",
    name: "Top Sales",
    description: "Reached #1 in monthly sales.",
    quote: "You didn't chase the number — the number followed you.",
    unlockedOn: unlocked.includes("top-sales") ? "Month 6" : null,
    progress: unlocked.includes("top-sales") ? 100 : 62,
    icon: "🏆",
    rare: true,
  },
  {
    id: "silver-hunter",
    name: "Silver Hunter",
    description: "Earned the Silver Rank.",
    quote: "Trust, earned quietly.",
    unlockedOn: unlocked.includes("silver-hunter") ? "Month 6" : null,
    progress: unlocked.includes("silver-hunter") ? 100 : 20,
    icon: "🥈",
  },
  {
    id: "gold-hunter",
    name: "Gold Hunter",
    description: "Earned the Gold Rank — Secondary Class unlocked.",
    quote: "You are no longer the arrow. You are the bow.",
    unlockedOn: unlocked.includes("gold-hunter") ? "Year 1" : null,
    progress: unlocked.includes("gold-hunter") ? 100 : 0,
    icon: "🥇",
    rare: true,
  },
  {
    id: "mentor",
    name: "The Mentor",
    description: "Guided a Bronze Hunter to Silver.",
    quote: "Teaching is the highest form of contribution.",
    unlockedOn: unlocked.includes("mentor") ? "Year 1" : null,
    progress: unlocked.includes("mentor") ? 100 : 30,
    icon: "🧭",
  },
  {
    id: "platinum",
    name: "Platinum Ascension",
    description: "Reached Platinum Rank.",
    quote: "Excellence, made habitual.",
    unlockedOn: unlocked.includes("platinum") ? "Year 2" : null,
    progress: unlocked.includes("platinum") ? 100 : 0,
    icon: "💠",
    rare: true,
  },
  {
    id: "legend",
    name: "Legend",
    description: "The highest recognition in Odyssey.",
    quote: "Legacy, not status.",
    unlockedOn: unlocked.includes("legend") ? "Year 5" : null,
    progress: unlocked.includes("legend") ? 100 : 0,
    icon: "👑",
    rare: true,
  },
];

const baseSecondary = (unlockedGold: boolean, extra: Partial<Record<string, Partial<SecondaryTree>>> = {}): SecondaryTree[] => {
  const trees: SecondaryTree[] = [
    { key: "trainer", name: "Trainer", icon: "🎓", level: 0, progress: 0, nextUnlock: "Coach first Apprentice", description: "Develop future Hunters.", unlocked: unlockedGold },
    { key: "mixologist", name: "Mixologist", icon: "🍸", level: 0, progress: 0, nextUnlock: "Complete Bar Certification", description: "Master the craft of the bar.", unlocked: unlockedGold },
    { key: "content", name: "Content Creator", icon: "🎬", level: 0, progress: 0, nextUnlock: "Publish 3 pieces", description: "Shape the guild's public voice.", unlocked: unlockedGold },
    { key: "leader", name: "Leader", icon: "⚔️", level: 0, progress: 0, nextUnlock: "Lead a shift", description: "Command with clarity.", unlocked: unlockedGold },
    { key: "ambassador", name: "Brand Ambassador", icon: "🎗️", level: 0, progress: 0, nextUnlock: "Host a partner event", description: "Represent Odyssey abroad.", unlocked: unlockedGold },
    { key: "operations", name: "Operations", icon: "⚙️", level: 0, progress: 0, nextUnlock: "Own a weekly report", description: "Run the machine.", unlocked: unlockedGold },
  ];
  return trees.map((t) => ({ ...t, ...(extra[t.key] ?? {}) }));
};

export const SHOWCASE_CHARACTERS: ShowcaseCharacter[] = [
  {
    id: "ben",
    name: "Ben",
    title: "Bronze Hunter",
    tenure: "Joined 2 weeks ago",
    rank: "Bronze",
    portraitGradient: "linear-gradient(135deg,#5a3a1d,#2a1a0d)",
    portraitInitial: "B",
    season: "Season I · Foundations",
    currentMission: "Complete your first 10 customer conversations",
    currentGoal: "Reach Silver in 6 months",
    performance: {
      overall: 62, behaviour: 70, direction: 55, contribution: 48, result: 52,
      trend: [40, 45, 52, 58, 60, 62],
      focus: "Building daily rhythm and product knowledge.",
    },
    mentorship: { score: 0, peopleHelped: 0, influence: 5, mentees: [] },
    ownership: "Explorer",
    achievements: baseAchievements(["first-blood"]),
    timeline: [
      { date: "Week 0", title: "Joined Odyssey", icon: "⚓", kind: "join" },
      { date: "Week 1", title: "First Sale", icon: "🩸", kind: "achievement" },
      { date: "Week 2", title: "Bronze Hunter", icon: "🥉", kind: "rank" },
      { date: "Next", title: "Reach Silver", icon: "🥈", kind: "future" },
    ],
    secondaryTrees: baseSecondary(false),
    unlockedBranches: [],
    titles: ["Newcomer"],
    bio: "Two weeks into the journey. Every hunter starts here.",
  },
  {
    id: "bull",
    name: "Bull",
    title: "Silver Hunter",
    tenure: "Joined 8 months ago",
    rank: "Silver",
    portraitGradient: "linear-gradient(135deg,#8a8a95,#3a3a45)",
    portraitInitial: "B",
    season: "Season II · Momentum",
    currentMission: "Sustain 3 consecutive A-grade months",
    currentGoal: "Reach Gold and unlock Secondary Class",
    performance: {
      overall: 78, behaviour: 82, direction: 74, contribution: 76, result: 80,
      trend: [55, 62, 68, 72, 75, 78],
      focus: "Consistency and reliability.",
    },
    mentorship: { score: 24, peopleHelped: 1, influence: 30, mentees: [
      { name: "Ben", rank: "Bronze", since: "2 weeks", growth: 35, note: "Sharing daily rituals." },
    ]},
    ownership: "Explorer",
    achievements: baseAchievements(["first-blood", "thank-you", "silver-hunter"]),
    timeline: [
      { date: "Month 0", title: "Joined Odyssey", icon: "⚓", kind: "join" },
      { date: "Month 1", title: "First Sale", icon: "🩸", kind: "achievement" },
      { date: "Month 2", title: "Bronze Hunter", icon: "🥉", kind: "rank" },
      { date: "Month 4", title: "Thank You letter", icon: "💌", kind: "achievement" },
      { date: "Month 6", title: "Silver Hunter", icon: "🥈", kind: "rank" },
      { date: "Next", title: "Reach Gold", icon: "🥇", kind: "future" },
    ],
    secondaryTrees: baseSecondary(false),
    unlockedBranches: [],
    titles: ["Reliable", "Team Player"],
    bio: "Eight months of steady growth. Trust is being earned.",
  },
  {
    id: "ryan",
    name: "Ryan",
    title: "Gold Hunter",
    tenure: "Joined 2 years ago",
    rank: "Gold",
    portraitGradient: "linear-gradient(135deg,#c9a54c,#5a3a10)",
    portraitInitial: "R",
    season: "Season III · Expansion",
    currentMission: "Choose and commit to a Secondary Class",
    currentGoal: "Reach Platinum and lead a shift",
    performance: {
      overall: 85, behaviour: 88, direction: 84, contribution: 82, result: 86,
      trend: [70, 74, 78, 82, 84, 85],
      focus: "Cross-functional growth begins.",
    },
    mentorship: { score: 48, peopleHelped: 2, influence: 55, mentees: [
      { name: "Ben", rank: "Bronze", since: "2 weeks", growth: 40, note: "Weekly 1:1." },
      { name: "Mira", rank: "Apprentice", since: "1 month", growth: 62, note: "Fast learner." },
    ]},
    ownership: "Guardian",
    achievements: baseAchievements(["first-blood", "thank-you", "top-sales", "silver-hunter", "gold-hunter", "mentor"]),
    timeline: [
      { date: "Year 0", title: "Joined Odyssey", icon: "⚓", kind: "join" },
      { date: "Month 2", title: "Bronze Hunter", icon: "🥉", kind: "rank" },
      { date: "Month 4", title: "First Achievement", icon: "🎖️", kind: "achievement" },
      { date: "Month 9", title: "Top Sales", icon: "🏆", kind: "achievement" },
      { date: "Month 11", title: "Silver Hunter", icon: "🥈", kind: "rank" },
      { date: "Year 2", title: "Gold Hunter", icon: "🥇", kind: "rank" },
      { date: "Now", title: "Trainer branch unlocked", icon: "🎓", kind: "unlock" },
      { date: "Mentored", title: "Guided Ben", icon: "🧭", kind: "mission" },
      { date: "Future", title: "Platinum Ascension", icon: "💠", kind: "future" },
    ],
    secondaryTrees: baseSecondary(true, {
      trainer: { level: 1, progress: 40, nextUnlock: "Coach 3 hunters to Bronze" },
    }),
    unlockedBranches: fullBranches(3),
    titles: ["Gold Hunter", "Mentor", "Trainer I"],
    bio: "Two years in. Ranked Gold. The first branch of the journey is open.",
  },
  {
    id: "ethan",
    name: "Ethan",
    title: "Platinum Hunter · Team Leader",
    tenure: "Joined 4 years ago",
    rank: "Platinum",
    portraitGradient: "linear-gradient(135deg,#dfe7f2,#4a5a72)",
    portraitInitial: "E",
    season: "Season IV · Leadership",
    currentMission: "Grow two Silver hunters to Gold this quarter",
    currentGoal: "Reach Diamond and cross into Business",
    performance: {
      overall: 91, behaviour: 93, direction: 90, contribution: 92, result: 89,
      trend: [80, 83, 86, 88, 90, 91],
      focus: "Multiplying others.",
    },
    mentorship: { score: 82, peopleHelped: 6, influence: 78, mentees: [
      { name: "Ryan", rank: "Gold", since: "1 year", growth: 88, note: "Ready for Platinum." },
      { name: "Bull", rank: "Silver", since: "6 months", growth: 70, note: "On track for Gold." },
      { name: "Mira", rank: "Apprentice", since: "3 months", growth: 55, note: "Coachable." },
    ]},
    ownership: "Partner Candidate",
    achievements: baseAchievements(["first-blood", "thank-you", "top-sales", "silver-hunter", "gold-hunter", "mentor", "platinum"]),
    timeline: [
      { date: "Year 0", title: "Joined Odyssey", icon: "⚓", kind: "join" },
      { date: "Year 1", title: "Silver Hunter", icon: "🥈", kind: "rank" },
      { date: "Year 2", title: "Gold Hunter", icon: "🥇", kind: "rank" },
      { date: "Year 3", title: "Trainer II", icon: "🎓", kind: "unlock" },
      { date: "Year 3", title: "Leader I", icon: "⚔️", kind: "unlock" },
      { date: "Year 4", title: "Platinum Hunter", icon: "💠", kind: "rank" },
      { date: "Now", title: "Team Leader", icon: "🛡️", kind: "mission" },
      { date: "Future", title: "Diamond", icon: "💎", kind: "future" },
    ],
    secondaryTrees: baseSecondary(true, {
      trainer: { level: 3, progress: 70, nextUnlock: "Certify a Trainer II" },
      leader: { level: 2, progress: 55, nextUnlock: "Own a full shift" },
      operations: { level: 1, progress: 30, nextUnlock: "Publish weekly report x4" },
    }),
    unlockedBranches: fullBranches(6),
    titles: ["Platinum Hunter", "Team Leader", "Trainer III", "Partner Candidate"],
    bio: "Four years. Leads a team. Grows the next generation.",
  },
  {
    id: "alex",
    name: "Alex",
    title: "Legend Hunter · Partner",
    tenure: "Joined 7 years ago",
    rank: "Legend",
    portraitGradient: "linear-gradient(135deg,#e8464a,#3a0a10)",
    portraitInitial: "A",
    season: "Season V · Legacy",
    currentMission: "Establish the second Odyssey location",
    currentGoal: "Elevate a hunter to Master",
    performance: {
      overall: 98, behaviour: 99, direction: 98, contribution: 98, result: 97,
      trend: [92, 94, 96, 97, 98, 98],
      focus: "Protecting and expanding the guild.",
    },
    mentorship: { score: 100, peopleHelped: 18, influence: 100, mentees: [
      { name: "Ethan", rank: "Platinum", since: "4 years", growth: 98, note: "Successor in training." },
      { name: "Ryan", rank: "Gold", since: "2 years", growth: 92, note: "Future leader." },
      { name: "Kai", rank: "Diamond", since: "3 years", growth: 95, note: "Runs the second wing." },
    ]},
    ownership: "Shareholder",
    achievements: baseAchievements(["first-blood", "thank-you", "top-sales", "silver-hunter", "gold-hunter", "mentor", "platinum", "legend"]),
    timeline: [
      { date: "Year 0", title: "Joined Odyssey", icon: "⚓", kind: "join" },
      { date: "Year 1", title: "Silver Hunter", icon: "🥈", kind: "rank" },
      { date: "Year 2", title: "Gold Hunter", icon: "🥇", kind: "rank" },
      { date: "Year 3", title: "Platinum", icon: "💠", kind: "rank" },
      { date: "Year 4", title: "Diamond", icon: "💎", kind: "rank" },
      { date: "Year 5", title: "Master", icon: "🌟", kind: "rank" },
      { date: "Year 6", title: "Partner", icon: "🤝", kind: "unlock" },
      { date: "Year 7", title: "Legend", icon: "👑", kind: "rank" },
      { date: "Now", title: "Shareholder", icon: "🏛️", kind: "mission" },
      { date: "Future", title: "Second Location", icon: "🗺️", kind: "future" },
    ],
    secondaryTrees: baseSecondary(true, {
      trainer: { level: 5, progress: 100, nextUnlock: "Mastered" },
      leader: { level: 5, progress: 100, nextUnlock: "Mastered" },
      operations: { level: 4, progress: 80, nextUnlock: "Regional oversight" },
      ambassador: { level: 4, progress: 90, nextUnlock: "International partner event" },
      content: { level: 3, progress: 60, nextUnlock: "Publish playbook" },
      mixologist: { level: 2, progress: 40, nextUnlock: "Signature menu" },
    }),
    unlockedBranches: BRANCHES,
    titles: ["Legend", "Partner", "Shareholder", "Founder Circle"],
    bio: "Seven years. Legend rank. Building the guild's future.",
  },
];

export function getCharacter(id: string): ShowcaseCharacter {
  return SHOWCASE_CHARACTERS.find((c) => c.id === id) ?? SHOWCASE_CHARACTERS[0];
}

export const JOURNEY_BRANCHES = BRANCHES;
