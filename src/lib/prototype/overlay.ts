// Merges an active demo profile over a real dashboard payload for display.
// Never mutates the input. Returns the same shape getStaffDashboard returns
// so consumers can render without conditional branching.

import type { PrototypeProfile } from "./types";

export function overlayDashboard(real: any, demo: PrototypeProfile | null) {
  if (!demo) return real;

  const s = real?.staff ?? {};
  const rpg = s.rpg ?? {};

  const overlaid = {
    ...real,
    __prototype: true,
    __prototypeProfile: demo,
    staff: {
      ...s,
      id: s.id ?? demo.id,
      name: demo.name || s.name,
      profession: demo.primaryRole ?? s.profession,
      business_unit: demo.businessUnit || s.business_unit,
      current_rank_key: demo.rankKey,
      location: demo.fleet ? { ...(s.location ?? {}), name: demo.fleet } : s.location,
      manager: demo.manager ? { ...(s.manager ?? {}), name: demo.manager } : s.manager,
      rpg: {
        ...rpg,
        primary_class: demo.primaryClass,
        primary_role: demo.primaryRole ?? rpg.primary_role,
        current_rank_key: demo.rankKey,
        secondary_class: demo.secondaries[0]?.className?.toLowerCase() ?? rpg.secondary_class,
      },
    },
    totals: {
      ...(real?.totals ?? { starsPerMoon: 10, moonsPerSun: 5 }),
      stars: demo.legacyStars,
      moons: Math.floor(demo.legacyStars / (real?.totals?.starsPerMoon ?? 10)),
      suns: Math.floor(
        Math.floor(demo.legacyStars / (real?.totals?.starsPerMoon ?? 10)) /
          (real?.totals?.moonsPerSun ?? 5)
      ),
      starsRemainder: demo.legacyStars % (real?.totals?.starsPerMoon ?? 10),
      moonsRemainder: 0,
    },
    legacy: {
      ...(real?.legacy ?? {}),
      currentTitle: { name: demo.legacyTitle ?? "Wanderer", flavor: demo.motto ?? "" },
    },
    grades:
      demo.monthlyGrade && demo.monthlyGrade !== "—"
        ? [{ month: "current", grade: demo.monthlyGrade, composite_score: 0 }, ...(real?.grades ?? [])]
        : real?.grades ?? [],
  };

  return overlaid;
}
