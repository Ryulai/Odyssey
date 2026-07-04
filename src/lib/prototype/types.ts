// Prototype Mode types — client-only demo state.
// These types describe what a "demo profile" overlay can look like.
// They are intentionally loose: any field the user leaves empty falls
// back to whatever the real dashboard returned.

export type PrototypeGrade = "S" | "A" | "B" | "C" | "D" | "—";

export type PrototypeSecondary = {
  id: string;
  className: string;   // e.g. "Scholar"
  role?: string;       // e.g. "Cartographer"
  rankKey: string;     // one of PROTOTYPE_RANK_KEYS
  progress: number;    // 0..100 progress to next rank
};

export type PrototypeProfile = {
  id: string;
  label: string;               // shown in profile switcher
  name: string;                // display name
  rankKey: string;             // primary rank
  primaryClass: string;        // primary class key (rpg.ts key)
  primaryRole?: string;        // primary role key
  secondaries: PrototypeSecondary[];
  monthlyGrade: PrototypeGrade;
  legacyStars: number;
  legacyTitle?: string;
  collections: string[];       // owned cosmetic keys (free-form labels)
  businessUnit?: string;
  fleet?: string;
  manager?: string;
  motto?: string;
};

export type PrototypeState = {
  enabled: boolean;
  activeProfileId: string | null;
  profiles: PrototypeProfile[];
};
