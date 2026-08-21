/**
 * Odyssey environment resolution.
 *
 * There are exactly two live environments today:
 *
 *  - PROTOTYPE  → the Lovable preview/dev deployment. Director + Lovable change
 *                 it continuously. Prototype Mode sandbox tools are available.
 *  - BETA V1    → the published deployment used by real Hunters. It only changes
 *                 when a Prototype freeze is explicitly promoted (Publish/Update).
 *
 * PRODUCTION is reserved and intentionally not implemented yet.
 *
 * IMPORTANT: this module labels the *release channel* only. It does not, and
 * cannot, create database isolation. See
 * docs/odyssey-freeze/environment-separation-v1.md for the current data status.
 */

export type OdysseyEnvironment = "prototype" | "beta" | "production";

export const BETA_VERSION_LABEL = "ODYSSEY BETA · V1";
export const PROTOTYPE_LABEL = "PROTOTYPE";

/** Hostnames that serve the frozen Beta release. */
const BETA_HOSTS = ["star-rank-craft.lovable.app"];

export function resolveEnvironment(hostname?: string | null): OdysseyEnvironment {
  const host = (hostname ?? "").toLowerCase();
  if (!host) return "prototype";
  if (BETA_HOSTS.includes(host)) return "beta";
  // Any preview / sandbox / localhost host is Prototype.
  return "prototype";
}

export function environmentLabel(env: OdysseyEnvironment): string {
  switch (env) {
    case "beta":
      return BETA_VERSION_LABEL;
    case "production":
      return "PRODUCTION";
    default:
      return PROTOTYPE_LABEL;
  }
}

/** Prototype sandbox tooling (test profiles, overlays) is dev-only. */
export function allowsPrototypeSandbox(env: OdysseyEnvironment): boolean {
  return env === "prototype";
}
