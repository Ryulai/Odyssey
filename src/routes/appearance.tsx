import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { getStaffDashboard } from "@/lib/workflow.functions";
import {
  DEFAULT_AVATARS, GUILD_EMBLEMS, LOCKED_COSMETICS, PORTRAIT_FRAMES,
  usePortrait, setPortrait, resetPortrait,
  useFrame, setFrame, findFrame,
} from "@/lib/appearance";
import { PortraitBadge, FrameWrap } from "@/components/portrait";
import { rankLabel } from "@/lib/rpg";

export const Route = createFileRoute("/appearance")({
  head: () => ({
    meta: [
      { title: "Character Appearance — The Odyssey Guide" },
      { name: "description", content: "Customize your Odyssey character: portrait, avatars, guild emblems and future cosmetics." },
    ],
  }),
  component: () => <AuthGate><AppearancePage /></AuthGate>,
});

function AppearancePage() {
  const { data } = useQuery({
    queryKey: ["dashboard", "me", "appearance"],
    queryFn: () => getStaffDashboard({ data: {} }),
  });

  const s = data?.staff;
  const rankKey = s?.current_rank_key ?? s?.rpg?.rank_key ?? s?.rank?.key ?? null;
  const rankName = rankLabel(rankKey) || "Unranked";
  const initials = (s?.name ?? "")
    .split(/\s+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join("") || "—";
  const rankColor = "#D4A84B";
  const rankGlow = "#D4A84B80";
  const portrait = usePortrait();
  const frameId = useFrame();
  const currentFrame = findFrame(frameId);

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.35em] text-gold/70">System · Customization</div>
            <h1
              className="mt-1 text-2xl uppercase tracking-wide sm:text-3xl"
              style={{ fontFamily: "'Cinzel', serif", color: "#E5E7EB", textShadow: "0 0 30px rgba(212,168,75,0.35)" }}
            >
              Character Appearance
            </h1>
            <p className="mt-1 text-xs italic text-muted-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              The Character belongs to the employee. The Rank belongs to the Guild. The Appearance belongs to you.
            </p>
          </div>
          <Link
            to="/profile"
            className="rounded-md border border-border px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold"
          >
            ← Profile
          </Link>
        </header>

        {/* Live preview */}
        <section
          className="mb-10 flex flex-col items-center gap-4 rounded-md border p-8"
          style={{ borderColor: "rgba(197,160,89,0.20)", background: "#0A0F1E" }}
        >
          <PortraitBadge
            size={160}
            rankColor={rankColor}
            rankGlow={rankGlow}
            initials={initials}
            linkTo={null}
          />
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Preview</div>
            <div className="mt-1 font-display text-sm text-foreground/90">{s?.name ?? "Adventurer"}</div>
            <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: rankColor }}>{rankName}</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Frame · <span style={{ color: currentFrame.ring }}>{currentFrame.label}</span>
            </div>
          </div>
          {(portrait.kind !== "default" || frameId !== "none") && (
            <button
              onClick={() => { resetPortrait(); setFrame("none"); }}
              className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-gold"
            >
              Reset to default
            </button>
          )}
        </section>

        {/* 1 · Portrait upload */}
        <Section
          number="I"
          title="Portrait"
          blurb="Upload a photo. Crop it square, zoom to frame, then set it as your portrait."
        >
          <PhotoUploader />
        </Section>

        {/* 2 · Default Avatars */}
        <Section
          number="II"
          title="Default Avatars"
          blurb="Curated character marks. More will appear as the Odyssey art library grows."
        >
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {DEFAULT_AVATARS.map((a) => {
              const active = portrait.kind === "avatar" && portrait.id === a.id;
              return (
                <SelectTile
                  key={a.id}
                  label={a.label}
                  glyph={a.glyph}
                  tone={a.tone}
                  active={active}
                  onClick={() => setPortrait({ kind: "avatar", id: a.id })}
                />
              );
            })}
          </div>
        </Section>

        {/* 3 · Guild Emblems */}
        <Section
          number="III"
          title="Guild Emblems"
          blurb="Wear the sigil of a guild in place of a portrait. Full emblem artwork ships with each guild's expansion."
        >
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {GUILD_EMBLEMS.map((e) => {
              const active = portrait.kind === "emblem" && portrait.id === e.id;
              return (
                <SelectTile
                  key={e.id}
                  label={e.label}
                  glyph={e.glyph}
                  tone={e.tone}
                  active={active}
                  onClick={() => setPortrait({ kind: "emblem", id: e.id })}
                />
              );
            })}
          </div>
        </Section>

        {/* 4 · Portrait Frames */}
        <Section
          number="IV"
          title="Portrait Frames"
          blurb="A frame surrounds your portrait wherever it appears. Tap to try one on — the preview updates immediately."
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {PORTRAIT_FRAMES.map((f) => {
              const active = frameId === f.id;
              const ring = f.id === "none" ? "rgba(197,160,89,0.35)" : f.ring;
              return (
                <button
                  key={f.id}
                  onClick={() => setFrame(f.id)}
                  className="group flex flex-col items-center gap-3 rounded-md border p-4 transition-all"
                  style={{
                    borderColor: active ? ring : "rgba(197,160,89,0.15)",
                    background: active ? `${ring}12` : "rgba(10,15,30,0.6)",
                    boxShadow: active ? `0 0 24px ${f.glow}` : undefined,
                  }}
                >
                  <FrameWrap frame={f} ringColor={ring} glow={f.glow} size={84} linkTo={null}>
                    <span
                      className="font-bold tracking-widest"
                      style={{
                        color: ring,
                        fontFamily: "'Cinzel', serif",
                        fontSize: 22,
                      }}
                    >
                      {initials}
                    </span>
                  </FrameWrap>
                  <div className="text-center">
                    <div
                      className="text-[10px] uppercase tracking-[0.3em]"
                      style={{ color: active ? ring : undefined, fontFamily: "'Cinzel', serif" }}
                    >
                      {f.label}
                    </div>
                    {active && (
                      <div className="mt-0.5 text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                        Equipped
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* 5 · Future Customization */}
        <Section
          number="V"
          title="Future Customization"
          blurb="Reserved for Odyssey's expanding cosmetic economy. Earned through rank, seasons, and legendary deeds."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {LOCKED_COSMETICS.map((c) => (
              <LockedTile key={c.id} label={c.label} category={c.category} hint={c.hint} />
            ))}
          </div>
        </Section>


        <footer className="mt-12 border-t border-border pt-6 text-center text-[10px] uppercase tracking-[0.4em] text-muted-foreground/60">
          The Appearance belongs to the Player
        </footer>
      </div>
    </div>
  );
}

// ─── Layout primitives ─────────────────────────────────────────────────

function Section({
  number, title, blurb, children,
}: { number: string; title: string; blurb?: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-baseline gap-3">
        <span
          className="text-[10px] uppercase tracking-[0.4em]"
          style={{ color: "#C5A059", fontFamily: "'Cinzel', serif" }}
        >
          {number}
        </span>
        <h2
          className="text-lg uppercase tracking-wide"
          style={{ fontFamily: "'Cinzel', serif", color: "#E5E7EB" }}
        >
          {title}
        </h2>
      </div>
      {blurb && (
        <p className="mb-4 text-xs italic text-muted-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {blurb}
        </p>
      )}
      <div
        className="rounded-md border p-5"
        style={{ borderColor: "rgba(197,160,89,0.18)", background: "rgba(10,15,30,0.55)" }}
      >
        {children}
      </div>
    </section>
  );
}

function SelectTile({
  label, glyph, tone, active, onClick,
}: { label: string; glyph: string; tone: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 rounded-md border p-3 transition-all"
      style={{
        borderColor: active ? tone : "rgba(197,160,89,0.15)",
        background: active ? `${tone}12` : "rgba(10,15,30,0.6)",
        boxShadow: active ? `0 0 24px ${tone}55` : undefined,
      }}
    >
      <div
        className="grid h-16 w-16 place-items-center rounded-full border"
        style={{
          borderColor: tone,
          background: "linear-gradient(to bottom, #1a1f35, #0A0F1E)",
          boxShadow: `0 0 18px ${tone}40`,
        }}
      >
        <span style={{ color: tone, fontFamily: "'Cinzel', serif", fontSize: 28, lineHeight: 1 }}>{glyph}</span>
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground">
        {label}
      </div>
    </button>
  );
}

function LockedTile({ label, category, hint }: { label: string; category: string; hint: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-md border p-4"
      style={{ borderColor: "rgba(197,160,89,0.12)", background: "rgba(10,15,30,0.7)" }}
    >
      <div className="mb-3 grid h-16 place-items-center opacity-50">
        <span style={{ color: "#C5A059", fontFamily: "'Cinzel', serif", fontSize: 26 }}>✦</span>
      </div>
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/70">{category}</div>
      <div className="mt-0.5 font-display text-sm text-foreground/85" style={{ fontFamily: "'Cinzel', serif" }}>
        {label}
      </div>
      <div className="mt-1 text-[10px] italic text-muted-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        {hint}
      </div>
      <div
        className="mt-3 inline-block rounded border px-2 py-0.5 text-[9px] uppercase tracking-[0.3em]"
        style={{ color: "#C5A059", borderColor: "rgba(197,160,89,0.35)" }}
      >
        Coming Soon
      </div>
    </div>
  );
}

// ─── Photo uploader (crop + zoom) ──────────────────────────────────────

function PhotoUploader() {
  const [src, setSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const STAGE = 240;

  const onPick = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(String(reader.result));
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onPick(f);
    e.target.value = ""; // allow re-picking same file
  };

  const onDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setOffset({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  };
  const onUp = () => { dragRef.current = null; };

  const commit = useCallback(async () => {
    if (!src) return;
    const img = new Image();
    img.src = src;
    await img.decode().catch(() => {});
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    const scale = Math.max(STAGE / img.width, STAGE / img.height) * zoom;
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const cx = STAGE / 2 + offset.x - drawW / 2;
    const cy = STAGE / 2 + offset.y - drawH / 2;
    const k = 512 / STAGE;
    ctx.fillStyle = "#0A0F1E";
    ctx.fillRect(0, 0, 512, 512);
    ctx.drawImage(img, cx * k, cy * k, drawW * k, drawH * k);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    setPortrait({ kind: "photo", dataUrl });
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  }, [src, zoom, offset]);


  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
      {/* Stage */}
      <div className="flex flex-col items-center gap-3">
        <div
          ref={stageRef}
          className="relative overflow-hidden rounded-full border-2"
          style={{
            width: STAGE, height: STAGE,
            borderColor: "#D4A84B",
            background: "linear-gradient(to bottom, #1a1f35, #0A0F1E)",
            boxShadow: "0 0 30px rgba(212,168,75,0.35)",
            touchAction: "none",
            cursor: src ? "grab" : "default",
          }}
          onPointerDown={src ? onDown : undefined}
          onPointerMove={src ? onMove : undefined}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {src ? (
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(-50%,-50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                minWidth: "100%",
                minHeight: "100%",
                objectFit: "cover",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-center">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
                Awaiting Portrait
              </div>
            </div>
          )}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {src ? "Drag to reposition" : "No image loaded"}
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 space-y-4">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Upload Photo</label>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-md border border-gold bg-gold/10 px-4 py-2 font-display text-[10px] uppercase tracking-widest text-gold hover:bg-gold/20"
          >
            {src ? "Replace Photo" : "Choose Photo…"}
          </button>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Zoom</label>
            <span className="text-[10px] text-muted-foreground">{zoom.toFixed(2)}×</span>
          </div>
          <input
            type="range"
            min={1} max={3} step={0.01}
            value={zoom}
            disabled={!src}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-[#D4A84B] disabled:opacity-40"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={commit}
            disabled={!src}
            className="rounded-md border border-gold bg-gold/20 px-4 py-2 font-display text-[10px] uppercase tracking-widest text-gold hover:bg-gold/30 disabled:opacity-40"
          >
            Set as Portrait
          </button>
          <button
            onClick={() => { setSrc(null); setZoom(1); setOffset({ x: 0, y: 0 }); }}
            disabled={!src}
            className="rounded-md border border-border px-4 py-2 font-display text-[10px] uppercase tracking-widest text-muted-foreground hover:border-gold/40 hover:text-gold disabled:opacity-40"
          >
            Discard
          </button>
          <button
            onClick={() => resetPortrait()}
            className="rounded-md border border-border px-4 py-2 font-display text-[10px] uppercase tracking-widest text-muted-foreground hover:border-red-400/50 hover:text-red-300"
          >
            Reset to Default
          </button>
        </div>
        {saved && (
          <div
            className="animate-fade-in inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[10px] uppercase tracking-[0.3em]"
            style={{ borderColor: "#D4A84B", color: "#D4A84B", background: "rgba(212,168,75,0.10)" }}
          >
            ✓ Portrait Saved — Live on Profile & Home
          </div>
        )}
      </div>
    </div>
  );
}
