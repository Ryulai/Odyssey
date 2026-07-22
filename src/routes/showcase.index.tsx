import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/showcase/")({
  head: () => ({ meta: [{ title: "Welcome — Odyssey Showcase" }] }),
  component: Welcome,
});

function Welcome() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(600px 600px at 50% 45%, rgba(212,175,55,0.18), transparent 60%), radial-gradient(900px 700px at 50% 90%, rgba(120,60,180,0.15), transparent 70%)",
        }}
      />
      {/* Faint constellation */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 12% 22%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 80% 30%, rgba(255,255,255,0.5), transparent), radial-gradient(1.5px 1.5px at 65% 70%, rgba(212,175,55,0.7), transparent), radial-gradient(1px 1px at 30% 80%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 90% 85%, rgba(255,255,255,0.4), transparent)",
        }}
      />

      <div className="relative z-10 max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4af37]/30 text-[10px] uppercase tracking-[0.4em] text-[#d4af37]/80 mb-10 animate-in fade-in duration-1000">
          <Sparkles className="w-3 h-3" />
          A Personal Growth Operating System
        </div>

        <h1 className="font-display text-6xl md:text-8xl leading-[0.95] tracking-wide text-parchment animate-in fade-in slide-in-from-bottom-4 duration-1000">
          Every person <br />
          is on a <span className="text-[#d4af37]">journey</span>.
        </h1>

        <p className="mt-8 text-lg md:text-xl text-white/60 font-light max-w-xl mx-auto leading-relaxed animate-in fade-in duration-1000 delay-200">
          Odyssey turns work into a story worth telling — where every rank earned, every
          mentee raised, and every year served becomes part of a life's legacy.
        </p>

        <div className="mt-14 flex flex-col items-center gap-4 animate-in fade-in duration-1000 delay-500">
          <Link
            to="/showcase/choose-hunter"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f0d78c] text-black font-display tracking-[0.2em] uppercase text-sm shadow-[0_0_60px_-10px_rgba(212,175,55,0.8)] hover:shadow-[0_0_80px_-5px_rgba(212,175,55,1)] transition-all"
          >
            Begin the Journey
            <ArrowRight className="w-4 h-4 transition group-hover:translate-x-1" />
          </Link>
          <div className="text-[10px] uppercase tracking-[0.4em] text-white/30">
            12 Acts · A Hunter's Story
          </div>
        </div>
      </div>

      {/* Exit */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-20 text-[10px] uppercase tracking-[0.3em] text-white/30 hover:text-white/70 transition"
      >
        ← Exit
      </Link>
    </div>
  );
}
