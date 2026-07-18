/**
 * ODYSSEY — THE FIVE SYSTEMS
 * ─────────────────────────────────────────────────────────────
 * A "System" is a progression / calculation engine, NOT a page.
 * One page may host multiple systems.
 *
 *   System 1 · Class Performance        (ABCD monthly scoring)
 *   System 2 · Class Ranking            (Bronze → Silver → Gold → Black …)
 *   System 3 · Secondary Class          (independent second profession)
 *   System 4 · Mentorship               (reserved — architecture only)
 *   System 5 · Ownership                (reserved — architecture only)
 *
 * Page hosting map (current):
 *   /                → dashboard summaries only
 *   /performance     → System 1
 *   /career          → System 1 (summary) + System 2  — the "Class" page
 *   /secondary-class → System 3
 *   (future)         → System 4 · Mentorship
 *   (future)         → System 5 · Ownership
 *
 * IMPORTANT: The old "Five Growth Trees" concept — including Career Tree,
 * Partner Tree, Mentor Tree, Leadership Tree, Navigator Tree, Captain Tree,
 * Shipbuilder Tree, "Path of Navigator", "Path of Captain", "Main Career",
 * "Primary Career", "Secondary Career" — is fully retired. Do not
 * reintroduce those pages, UI surfaces, or terminology.
 */

export type SystemId =
  | "performance"
  | "ranking"
  | "secondary_class"
  | "mentorship"
  | "ownership";

export type SystemStatus = "active" | "reserved";

export interface SystemDef {
  id: SystemId;
  ordinal: 1 | 2 | 3 | 4 | 5;
  name: string;
  purpose: string;
  status: SystemStatus;
  /** Pages that currently host any part of this system. */
  hostedOn: string[];
  /** Server-function / engine modules that implement the system. */
  engineModules: string[];
}

export const SYSTEMS: Record<SystemId, SystemDef> = {
  performance: {
    id: "performance",
    ordinal: 1,
    name: "Class Performance",
    purpose: "Monthly ABCD grade + composite score for the Class.",
    status: "active",
    hostedOn: ["/performance", "/career", "/professional-performance"],
    engineModules: ["src/routes/professional-performance.tsx"],
  },
  ranking: {
    id: "ranking",
    ordinal: 2,
    name: "Class Ranking",
    purpose: "Long-term rank progression (Bronze → Silver → Gold → Black → …) for the Class.",
    status: "active",
    hostedOn: ["/career", "/promotions"],
    engineModules: ["src/lib/workflow.functions.ts"],
  },
  secondary_class: {
    id: "secondary_class",
    ordinal: 3,
    name: "Secondary Class",
    purpose:
      "A complete second profession, tracked independently of the Class. Has its own performance, ranking, promotion history, and progress. Future: multiple secondaries.",
    status: "active",
    hostedOn: ["/secondary-class"],
    engineModules: ["src/lib/secondary-class.functions.ts"],
  },
  mentorship: {
    id: "mentorship",
    ordinal: 4,
    name: "Mentorship",
    purpose:
      "Reserved. Will track mentors, students, mentor rank, mentorship history, and mentorship achievements. Do NOT build pages or UI yet — homepage shows Coming Soon only.",
    status: "reserved",
    hostedOn: [],
    engineModules: [],
  },
  ownership: {
    id: "ownership",
    ordinal: 5,
    name: "Ownership",
    purpose:
      "Reserved. Will track ownership, shares, investment, business responsibility, and decision rights. Do NOT build pages or UI yet — homepage shows Coming Soon only.",
    status: "reserved",
    hostedOn: [],
    engineModules: [],
  },
};

export const SYSTEM_ORDER: SystemId[] = [
  "performance",
  "ranking",
  "secondary_class",
  "mentorship",
  "ownership",
];
