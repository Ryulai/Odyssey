// Single source of truth for the Showcase "Hunter's Journey" — 12 acts, in order.
// Drives sidebar, progress ribbon, and prev/next navigation.

export type Act = {
  n: number;
  to: string;
  label: string;
  question: string;
  group: "Prologue" | "The Hunter" | "The Path" | "The Story";
  fullBleed?: boolean; // acts 1–2 are cinematic (no sidebar/header)
};

export const ACTS: Act[] = [
  { n: 1,  to: "/showcase",                 label: "Welcome",         question: "What is Odyssey?",              group: "Prologue",   fullBleed: true },
  { n: 2,  to: "/showcase/choose-hunter",   label: "Choose Hunter",   question: "Whose journey?",                group: "Prologue",   fullBleed: true },
  { n: 3,  to: "/showcase/journey-map",     label: "Journey Map",     question: "Where am I in the world?",      group: "The Hunter" },
  { n: 4,  to: "/showcase/profile",         label: "Hunter Profile",  question: "Who am I?",                      group: "The Hunter" },
  { n: 5,  to: "/showcase/performance",     label: "Performance",     question: "How am I doing right now?",     group: "The Hunter" },
  { n: 6,  to: "/showcase/achievements",    label: "Achievements",    question: "What have I earned?",           group: "The Hunter" },
  { n: 7,  to: "/showcase/rank",            label: "Class Rank",      question: "How far have I walked?",        group: "The Path" },
  { n: 8,  to: "/showcase/secondary-class", label: "Secondary Class", question: "What else am I becoming?",       group: "The Path" },
  { n: 9,  to: "/showcase/mentorship",      label: "Mentorship",      question: "Who have I helped grow?",       group: "The Path" },
  { n: 10, to: "/showcase/ownership",       label: "Ownership",       question: "What can I become?",             group: "The Path" },
  { n: 11, to: "/showcase/timeline",        label: "Journey Timeline",question: "What is my story so far?",       group: "The Story" },
  { n: 12, to: "/showcase/future-vision",   label: "Future Vision",   question: "Where is Odyssey going?",       group: "The Story" },
];

export function findAct(pathname: string): Act | undefined {
  // exact match first, then prefix (but "/showcase" must not swallow children)
  const exact = ACTS.find((a) => a.to === pathname);
  if (exact) return exact;
  return ACTS.find((a) => a.to !== "/showcase" && pathname.startsWith(a.to));
}

export function neighbors(current: Act) {
  const i = ACTS.findIndex((a) => a.n === current.n);
  return {
    prev: i > 0 ? ACTS[i - 1] : undefined,
    next: i < ACTS.length - 1 ? ACTS[i + 1] : undefined,
  };
}
