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
      case "seasonal": return 7;
      case "solid": return frame.id === "none" ? 0 : 3;
      default: return 3;
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
    case "seasonal":
      outerStyle = {
        ...outerStyle,
        border: `1px solid ${ringColor}`,
        background:
          frame.seasonalId === "emperor-fortune"
            ? `conic-gradient(from 210deg, #E8B84A, #7A4A22, #E8B84A, #3A0A0A, #E8B84A)`
            : `conic-gradient(from 0deg, #F5D07A, #1a2547, #F5D07A, #0A1A3A, #F5D07A)`,
        padding: innerPad,
        overflow: "visible",
      };
      break;
  }

  const innerStyle: React.CSSProperties = {
    width: size - innerPad * 2,
    height: size - innerPad * 2,
    borderRadius: "9999px",
    background:
      frame.style === "seasonal" && frame.seasonalId === "winter-king"
        ? "linear-gradient(to bottom, #0A1A3A, #050912)"
        : frame.style === "seasonal" && frame.seasonalId === "emperor-fortune"
        ? "linear-gradient(to bottom, #2a0808, #0a0505)"
        : "linear-gradient(to bottom, #1a1f35, #0A0F1E)",
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
      <div style={innerStyle}>
        {children}
        {frame.style === "seasonal" && frame.seasonalId === "winter-king" && (
          <SnowLayer size={size - innerPad * 2} />
        )}
      </div>
      {frame.style === "seasonal" && (
        <SeasonalDecor frame={frame} size={size} />
      )}
    </div>
  );
}

/* ─── Seasonal decorations ─────────────────────────────────────────── */

function SeasonalDecor({ frame, size }: { frame: FrameOption; size: number }) {
  if (frame.seasonalId === "winter-king") return <WinterKingDecor size={size} />;
  if (frame.seasonalId === "emperor-fortune") return <EmperorFortuneDecor size={size} />;
  return null;
}

function SnowLayer({ size }: { size: number }) {
  const flakes = [
    { left: 10, delay: 0,   dur: 6.5, s: 3 },
    { left: 26, delay: 1.4, dur: 5.2, s: 2 },
    { left: 42, delay: 3.0, dur: 7.4, s: 4 },
    { left: 58, delay: 0.8, dur: 6.1, s: 2 },
    { left: 72, delay: 2.3, dur: 5.8, s: 3 },
    { left: 86, delay: 4.1, dur: 6.9, s: 2 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {flakes.map((f, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${f.left}%`,
            top: 0,
            width: f.s,
            height: f.s,
            borderRadius: "9999px",
            background: "#F5F9FF",
            boxShadow: "0 0 6px #E6F0FF, 0 0 12px rgba(200,220,255,0.6)",
            animation: `frame-snow-fall ${f.dur}s linear ${f.delay}s infinite`,
          }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 30%, rgba(245,208,122,0.10), transparent 60%)`,
          animation: "frame-golden-spin 18s linear infinite",
        }}
      />
      <div style={{ width: size, height: 0 }} />
    </div>
  );
}

function WinterKingDecor({ size }: { size: number }) {
  const star = size * 0.14;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden style={{ overflow: "visible" }}>
      {/* Corner frost crystals */}
      {[
        { top: -4, left: -4 },
        { top: -4, right: -4 },
        { bottom: -4, left: -4 },
        { bottom: -4, right: -4 },
      ].map((pos, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            ...pos,
            color: "#CFE6FF",
            fontSize: size * 0.12,
            textShadow: "0 0 8px #A9D3FF, 0 0 14px rgba(140,190,255,0.65)",
            fontFamily: "'Cinzel', serif",
            lineHeight: 1,
          }}
        >
          ❋
        </span>
      ))}
      {/* Holly bunches (NW/NE/SW/SE) */}
      {[
        { top: size * 0.08, left: size * 0.08 },
        { top: size * 0.08, right: size * 0.08 },
        { bottom: size * 0.08, left: size * 0.08 },
        { bottom: size * 0.08, right: size * 0.08 },
      ].map((pos, i) => (
        <span
          key={`h${i}`}
          style={{
            position: "absolute",
            ...pos,
            fontSize: size * 0.08,
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#2E7D3A", textShadow: "0 0 4px #1B4D22" }}>❦</span>
          <span
            style={{
              display: "inline-block",
              width: size * 0.03,
              height: size * 0.03,
              marginLeft: 1,
              borderRadius: "9999px",
              background: "radial-gradient(circle at 30% 30%, #FF5A5A, #8B0000)",
              boxShadow: "0 0 4px rgba(255,60,60,0.7)",
            }}
          />
        </span>
      ))}
      {/* Christmas star at top */}
      <span
        style={{
          position: "absolute",
          top: -star * 0.75,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: star,
          color: "#FFE58A",
          lineHeight: 1,
          animation: "frame-twinkle 3.2s ease-in-out infinite",
        }}
      >
        ★
      </span>
    </div>
  );
}

function EmperorFortuneDecor({ size }: { size: number }) {
  const knot = size * 0.16;
  const dust = [
    { left: 20, delay: 0.2, dur: 5.5 },
    { left: 40, delay: 1.6, dur: 6.4 },
    { left: 60, delay: 3.0, dur: 5.9 },
    { left: 80, delay: 4.2, dur: 6.7 },
    { left: 50, delay: 2.1, dur: 5.2 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden style={{ overflow: "visible" }}>
      {/* Rotating gold light behind rim */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, rgba(232,184,74,0), rgba(232,184,74,0.45), rgba(232,184,74,0))`,
          animation: "frame-golden-spin 14s linear infinite",
          mixBlendMode: "screen",
          opacity: 0.7,
        }}
      />
      {/* Cloud patterns at 4 corners (stylised) */}
      {[
        { top: size * 0.06, left: size * 0.06, rot: 0 },
        { top: size * 0.06, right: size * 0.06, rot: 90 },
        { bottom: size * 0.06, left: size * 0.06, rot: 270 },
        { bottom: size * 0.06, right: size * 0.06, rot: 180 },
      ].map((pos, i) => {
        const { rot, ...p } = pos;
        return (
          <span
            key={`c${i}`}
            style={{
              position: "absolute",
              ...p,
              color: "#E8B84A",
              fontSize: size * 0.10,
              transform: `rotate(${rot}deg)`,
              textShadow: "0 0 6px rgba(232,184,74,0.7)",
              fontFamily: "'Cinzel', serif",
              lineHeight: 1,
            }}
          >
            ☁
          </span>
        );
      })}
      {/* Dragon engravings left/right */}
      {[
        { top: "50%", left: -size * 0.02, rot: -90 },
        { top: "50%", right: -size * 0.02, rot: 90 },
      ].map((pos, i) => {
        const { rot, ...p } = pos;
        return (
          <span
            key={`d${i}`}
            style={{
              position: "absolute",
              ...p,
              transform: `translateY(-50%) rotate(${rot}deg)`,
              color: "#F5D07A",
              fontSize: size * 0.11,
              textShadow: "0 0 8px rgba(245,208,122,0.8)",
              lineHeight: 1,
            }}
          >
            🐉
          </span>
        );
      })}
      {/* Red gems N/S/E/W */}
      {[
        { top: 2, left: "50%", tx: "-50%" },
        { bottom: 2, left: "50%", tx: "-50%" },
        { left: 2, top: "50%", ty: "-50%" },
        { right: 2, top: "50%", ty: "-50%" },
      ].map((pos, i) => {
        const { tx, ty, ...p } = pos as Record<string, number | string>;
        return (
          <span
            key={`g${i}`}
            style={{
              position: "absolute",
              ...p,
              width: size * 0.05,
              height: size * 0.05,
              borderRadius: "9999px",
              background: "radial-gradient(circle at 30% 30%, #FF6A6A, #7B0A0A)",
              boxShadow: "0 0 6px rgba(255,80,80,0.85), 0 0 12px rgba(232,184,74,0.5)",
              transform: `translate(${tx ?? 0}, ${ty ?? 0})`,
            }}
          />
        );
      })}
      {/* Gold coin details on diagonals */}
      {[
        { top: size * 0.20, right: size * 0.16 },
        { bottom: size * 0.20, left: size * 0.16 },
      ].map((pos, i) => (
        <span
          key={`co${i}`}
          style={{
            position: "absolute",
            ...pos,
            width: size * 0.06,
            height: size * 0.06,
            borderRadius: "9999px",
            background: "radial-gradient(circle at 30% 30%, #FFE58A, #8A5A1A)",
            boxShadow: "0 0 6px rgba(245,208,122,0.9)",
            border: "1px solid #7A4A22",
          }}
        />
      ))}
      {/* Hanging Chinese knot + tassels below */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: -knot * 0.95,
          transform: "translateX(-50%)",
          textAlign: "center",
          transformOrigin: "top center",
          animation: "frame-tassel-sway 4s ease-in-out infinite",
        }}
      >
        <div
          style={{
            fontSize: knot * 0.55,
            color: "#C9302C",
            textShadow: "0 0 6px rgba(232,184,74,0.9), 0 0 2px #7B0A0A",
            lineHeight: 1,
          }}
        >
          ❈
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 1 }}>
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: knot * 0.7,
              background: "linear-gradient(to bottom, #E8B84A, #7A4A22)",
              borderRadius: 2,
            }}
          />
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: knot * 0.9,
              background: "linear-gradient(to bottom, #F5D07A, #7A4A22)",
              borderRadius: 2,
            }}
          />
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: knot * 0.7,
              background: "linear-gradient(to bottom, #E8B84A, #7A4A22)",
              borderRadius: 2,
            }}
          />
        </div>
      </div>
      {/* Floating golden dust */}
      {dust.map((d, i) => (
        <span
          key={`du${i}`}
          style={{
            position: "absolute",
            left: `${d.left}%`,
            bottom: 6,
            width: 3,
            height: 3,
            borderRadius: "9999px",
            background: "#FFE58A",
            boxShadow: "0 0 6px #F5D07A, 0 0 10px rgba(245,208,122,0.7)",
            animation: `frame-dust-float ${d.dur}s ease-in-out ${d.delay}s infinite`,
          }}
        />
      ))}
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
