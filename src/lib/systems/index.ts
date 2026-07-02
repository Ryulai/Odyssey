/**
 * ODYSSEY — THE FIVE SYSTEMS
 * ─────────────────────────────────────────────────────────────
 * A "System" is a progression / calculation engine, NOT a page.
 * One page may host multiple systems.
 *
 *   System 1 · Main Career Performance   (ABCD monthly scoring)
 *   System 2 · Main Career Ranking       (Bronze → Silver → Gold → Black …)
 *   System 3 · Secondary Career          (independent second profession)
 *   System 4 · Mentorship                (reserved — architecture only)
 *   System 5 · Ownership                 (reserved — architecture only)
 *
 * Page hosting map (current):
 *   /                → overview only
 *   /performance     → System 1
 *   /career          → System 1 (summary) + System 2
 *   /secondary-career → System 3
 *   (future)         → System 4
 *   (future)         → System 5
 *
 * IMPORTANT: The old "Five Growth Trees" concept is retired.
 * Do not reintroduce Career / Partner / Mentor / Leadership / Secondary
 * "trees" as a unified UI surface.
 */

export type SystemId =
  | "performance"
  | "ranking"
  | "secondary_career"
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
    name: "Main Career Performance",
    purpose: "Monthly ABCD grade + composite score for the primary profession.",
    status: "active",
    hostedOn: ["/performance", "/career", "/evaluations"],
    engineModules: ["src/lib/evaluations.functions.ts"],
  },
  ranking: {
    id: "ranking",
    ordinal: 2,
    name: "Main Career Ranking",
    purpose: "Long-term rank progression (Bronze → Silver → Gold → Black → …) for the primary profession.",
    status: "active",
    hostedOn: ["/career", "/promotions"],
    engineModules: ["src/lib/workflow.functions.ts"],
  },
  secondary_career: {
    id: "secondary_career",
    ordinal: 3,
    name: "Secondary Career",
    purpose:
      "A complete second profession, tracked independently of the main career. Has its own performance, ranking, promotion history, and career progress. Future: multiple secondaries.",
    status: "active",
    hostedOn: ["/secondary-career"],
    engineModules: ["src/lib/secondary-career.functions.ts"],
  },
  mentorship: {
    id: "mentorship",
    ordinal: 4,
    name: "Mentorship",
    purpose:
      "Reserved. Will track mentors, students, mentor rank, mentorship history, and mentorship achievements. Do NOT build pages or UI yet.",
    status: "reserved",
    hostedOn: [],
    engineModules: [],
  },
  ownership: {
    id: "ownership",
    ordinal: 5,
    name: "Ownership",
    purpose:
      "Reserved. Will track ownership, shares, investment, business responsibility, and decision rights. Do NOT build pages or UI yet.",
    status: "reserved",
    hostedOn: [],
    engineModules: [],
  },
};

export const SYSTEM_ORDER: SystemId[] = [
  "performance",
  "ranking",
  "secondary_career",
  "mentorship",
  "ownership",
];
