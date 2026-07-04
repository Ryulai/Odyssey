import type { PrototypeProfile } from "./types";

// Seed demo profiles. Purely for internal demonstration.
export const SEED_PROFILES: PrototypeProfile[] = [
  {
    id: "apprentice-ranger",
    label: "Apprentice Ranger",
    name: "Kai Verath",
    rankKey: "apprentice",
    primaryClass: "ranger",
    primaryRole: "hunter",
    secondaries: [],
    monthlyGrade: "C",
    legacyStars: 3,
    legacyTitle: "Wanderer",
    collections: ["default-portrait"],
    businessUnit: "Fleet Alpha",
    fleet: "Harbor One",
    manager: "Master Kira",
    motto: "Every voyage begins with a first step.",
  },
  {
    id: "gold-mage-scholar",
    label: "Gold Mage · Scholar",
    name: "Selene Marquez",
    rankKey: "gold",
    primaryClass: "mage",
    primaryRole: "spellcaster",
    secondaries: [
      { id: "s-scholar", className: "Scholar", role: "Cartographer", rankKey: "silver", progress: 40 },
    ],
    monthlyGrade: "A",
    legacyStars: 84,
    legacyTitle: "Rising Star",
    collections: ["portrait-arcane", "frame-gold"],
    businessUnit: "Fleet Bravo",
    fleet: "Silverport",
    manager: "Captain Ono",
    motto: "Knowledge is the truest map.",
  },
  {
    id: "legend-guardian",
    label: "Legend Guardian · 3 Secondaries",
    name: "Alaric Thorne",
    rankKey: "legend",
    primaryClass: "guardian",
    primaryRole: "priest",
    secondaries: [
      { id: "s-navigator", className: "Navigator", role: "Stargazer",  rankKey: "diamond",  progress: 62 },
      { id: "s-alchemist", className: "Alchemist", role: "Brewmaster", rankKey: "platinum", progress: 80 },
      { id: "s-bard",      className: "Bard",      role: "Chronicler", rankKey: "gold",     progress: 25 },
    ],
    monthlyGrade: "S",
    legacyStars: 1240,
    legacyTitle: "Legend of the Fleet",
    collections: [
      "portrait-legend", "frame-obsidian", "background-nebula", "title-legend", "emblem-fleetmark",
    ],
    businessUnit: "Guild Council",
    fleet: "Flagship Odyssey",
    manager: "The Shipbuilder",
    motto: "My story guides the next voyage.",
  },
];

export function makeBlankProfile(id: string): PrototypeProfile {
  return {
    id,
    label: "New Demo Profile",
    name: "New Character",
    rankKey: "bronze",
    primaryClass: "ranger",
    primaryRole: "hunter",
    secondaries: [],
    monthlyGrade: "—",
    legacyStars: 0,
    legacyTitle: "Wanderer",
    collections: [],
    businessUnit: "",
    fleet: "",
    manager: "",
    motto: "",
  };
}
