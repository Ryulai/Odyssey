import { Link } from "@tanstack/react-router";
import { usePortrait, findAvatar, findEmblem, type Portrait } from "@/lib/appearance";

type Props = {
  size?: number;              // px
  rankColor: string;
  rankGlow: string;
  initials: string;
  isShipbuilder?: boolean;
  linkTo?: string | null;     // default "/appearance"; pass null to disable
  className?: string;
};

/**
 * The player's portrait. Clickable — taps into /appearance.
 * Renders whichever portrait mode the player chose (photo, avatar, emblem, default).
 */
export function PortraitBadge({
  size = 128,
  rankColor,
  rankGlow,
  initials,
  isShipbuilder = false,
  linkTo = "/appearance",
  className = "",
}: Props) {
  const portrait = usePortrait();
  const inner = <PortraitInner portrait={portrait} rankColor={rankColor} initials={initials} isShipbuilder={isShipbuilder} size={size} />;

  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderColor: rankColor,
    background: "linear-gradient(to bottom, #1a1f35, #0A0F1E)",
    boxShadow: `0 0 40px ${rankGlow}, 0 0 20px ${rankGlow}`,
  };

  const shell = (
    <div
      className={`group relative grid place-items-center overflow-hidden rounded-full border-2 transition-transform duration-300 ease-out ${linkTo ? "cursor-pointer hover:scale-[1.04] active:scale-[0.96]" : ""} ${className}`}
      style={style}
      title={linkTo ? "Customize Character Appearance" : undefined}
    >
      {inner}
      {linkTo && (
        <div
          className="pointer-events-none absolute inset-0 grid place-items-center rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
          style={{ background: "rgba(10,15,30,0.6)" }}
        >
          <span
            className="text-[9px] uppercase tracking-[0.35em]"
            style={{ color: rankColor, fontFamily: "'Cinzel', serif" }}
          >
            Customize
          </span>
        </div>
      )}
    </div>
  );

  return linkTo ? (
    <Link
      to={linkTo}
      aria-label="Customize character appearance"
      className="inline-block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1E]"
      style={{ WebkitTapHighlightColor: "transparent", outlineColor: rankColor }}
    >
      {shell}
    </Link>
  ) : (
    shell
  );
}

function PortraitInner({
  portrait, rankColor, initials, isShipbuilder, size,
}: { portrait: Portrait; rankColor: string; initials: string; isShipbuilder: boolean; size: number }) {
  if (portrait.kind === "photo") {
    return <img src={portrait.dataUrl} alt="" className="h-full w-full object-cover" />;
  }
  if (portrait.kind === "avatar") {
    const a = findAvatar(portrait.id);
    if (a) return <GlyphMark glyph={a.glyph} color={a.tone} size={size} />;
  }
  if (portrait.kind === "emblem") {
    const e = findEmblem(portrait.id);
    if (e) return <GlyphMark glyph={e.glyph} color={e.tone} size={size} />;
  }
  // default
  return (
    <span
      className="font-bold tracking-widest"
      style={{
        color: rankColor,
        fontFamily: "'Cinzel', serif",
        fontSize: Math.round(size * 0.32),
      }}
    >
      {isShipbuilder ? "⚓" : initials}
    </span>
  );
}

function GlyphMark({ glyph, color, size }: { glyph: string; color: string; size: number }) {
  return (
    <span
      style={{
        color,
        fontSize: Math.round(size * 0.55),
        lineHeight: 1,
        textShadow: `0 0 20px ${color}80`,
        fontFamily: "'Cinzel', serif",
      }}
    >
      {glyph}
    </span>
  );
}
