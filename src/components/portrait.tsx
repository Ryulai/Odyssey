import { Link } from "@tanstack/react-router";
import { usePortrait, useFrame, findAvatar, findEmblem, findFrame, type Portrait, type FrameOption } from "@/lib/appearance";

type Props = {
  size?: number;              // px
  rankColor: string;
  rankGlow: string;
  initials: string;
  isShipbuilder?: boolean;
  linkTo?: string | null;     // default "/appearance"; pass null to disable
  className?: string;
  frameOverride?: FrameOption; // preview a specific frame without changing state
};

/**
 * The player's portrait. Clickable — taps into /appearance.
 * Renders whichever portrait mode the player chose (photo, avatar, emblem, default),
 * wrapped in the selected cosmetic frame.
 */
export function PortraitBadge({
  size = 128,
  rankColor,
  rankGlow,
  initials,
  isShipbuilder = false,
  linkTo = "/appearance",
  className = "",
  frameOverride,
}: Props) {
  const portrait = usePortrait();
  const frameId = useFrame();
  const frame = frameOverride ?? findFrame(frameId);
  const useFrameStyle = frame.id !== "none";
  const ringColor = useFrameStyle ? frame.ring : rankColor;
  const glow = useFrameStyle ? frame.glow : rankGlow;

  const inner = (
    <PortraitInner
      portrait={portrait}
      rankColor={ringColor}
      initials={initials}
      isShipbuilder={isShipbuilder}
      size={size}
    />
  );

  const shell = (
    <FrameWrap frame={frame} ringColor={ringColor} glow={glow} size={size} className={className} linkTo={linkTo}>
      {inner}
      {linkTo && (
        <div
          className="pointer-events-none absolute inset-0 grid place-items-center rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
          style={{ background: "rgba(10,15,30,0.6)" }}
        >
          <span
            className="text-[9px] uppercase tracking-[0.35em]"
            style={{ color: ringColor, fontFamily: "'Cinzel', serif" }}
          >
            Customize
          </span>
        </div>
      )}
    </FrameWrap>
  );

  return linkTo ? (
    <Link
      to={linkTo}
      aria-label="Customize character appearance"
      className="inline-block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1E]"
      style={{ WebkitTapHighlightColor: "transparent", outlineColor: ringColor }}
    >
      {shell}
    </Link>
  ) : (
    shell
  );
}

/**
 * Renders the circular frame around the portrait. Each frame style paints a
 * different border treatment while preserving the underlying portrait circle.
 * Exported so preview tiles can reuse the exact same treatment.
 */
export function FrameWrap({
  frame, ringColor, glow, size, className = "", linkTo, children,
}: {
  frame: FrameOption;
  ringColor: string;
  glow: string;
  size: number;
  className?: string;
  linkTo?: string | null;
  children: React.ReactNode;
}) {
  const innerPad = (() => {
    switch (frame.style) {
      case "double": return 6;
      case "engraved": return 5;
      case "prismatic": return 6;
      case "solid": return frame.id === "none" ? 0 : 3;
    }
  })();

  const outerBase: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "9999px",
    display: "grid",
    placeItems: "center",
    boxShadow: `0 0 40px ${glow}, 0 0 20px ${glow}`,
  };

  let outerStyle: React.CSSProperties = { ...outerBase };

  switch (frame.style) {
    case "solid":
      outerStyle = {
        ...outerStyle,
        border: `2px solid ${ringColor}`,
        background:
          frame.id === "none"
            ? "transparent"
            : `radial-gradient(circle at 30% 20%, ${frame.accent}55, transparent 65%)`,
        padding: innerPad,
      };
      break;
    case "double":
      outerStyle = {
        ...outerStyle,
        border: `2px solid ${ringColor}`,
        outline: `2px solid ${frame.accent}`,
        outlineOffset: `-6px`,
        padding: innerPad,
      };
      break;
    case "engraved":
      outerStyle = {
        ...outerStyle,
        border: `1px solid ${ringColor}`,
        background: `conic-gradient(from 0deg, ${ringColor}, ${frame.accent}, ${ringColor}, ${frame.accent}, ${ringColor})`,
        padding: innerPad,
      };
      break;
    case "prismatic":
      outerStyle = {
        ...outerStyle,
        border: `1px solid ${ringColor}`,
        background: `conic-gradient(from 0deg, #B9F2FF, #C9A6FF, #F5C46B, #8FBF7A, #B9F2FF)`,
        padding: innerPad,
      };
      break;
  }

  const innerStyle: React.CSSProperties = {
    width: size - innerPad * 2,
    height: size - innerPad * 2,
    borderRadius: "9999px",
    background: "linear-gradient(to bottom, #1a1f35, #0A0F1E)",
    overflow: "hidden",
    position: "relative",
    display: "grid",
    placeItems: "center",
  };

  return (
    <div
      className={`group relative transition-transform duration-300 ease-out ${linkTo ? "cursor-pointer hover:scale-[1.04] active:scale-[0.96]" : ""} ${className}`}
      style={outerStyle}
      title={linkTo ? "Customize Character Appearance" : undefined}
    >
      <div style={innerStyle}>{children}</div>
    </div>
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
