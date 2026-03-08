"use client";

import type { Metadata } from "next";
import Link from "next/link";
import { useState } from "react";

// ── Data ────────────────────────────────────────────────────
const features = [
  { icon: "🌍", title: "3D / 2D D3 Globe", desc: "Interactive orthographic globe built with D3.js that morphs seamlessly into a flat 2D equirectangular map." },
  { icon: "🎥", title: "Cinematic Camera", desc: "Auto-rotates toward the impact site, zooms out during flight, and tracks the asteroid dot via a single rAF loop." },
  { icon: "🛰️", title: "Real NASA NEO Data", desc: "Live near-Earth object feed from NASA NeoWs, cached in localStorage. Auto-falls back to offline data on rate limits." },
  { icon: "📡", title: "Live Telemetry HUD", desc: "Floating panel anchored to the asteroid: altitude, velocity, mass, hull temp, and reverse-geocoded target city." },
  { icon: "💥", title: "Devastation Report", desc: "Post-impact: energy in megatons, fireball radius, shockwave, tsunami, crater topology, seismic magnitude, casualties." },
  { icon: "🗺️", title: "Tactical Impact Map", desc: "Leaflet dark-matter map centered on impact coordinates with fireball and shockwave circles at continental zoom." },
  { icon: "🤖", title: "AI Scientific Assistant", desc: "Ollama-powered chat that answers asteroid physics questions using any locally-running LLM." },
  { icon: "⚙️", title: "Configurable Settings", desc: "Switch live / offline data, set your NASA API key, toggle daily auto-fetch — all stored in localStorage." },
];

const formulas = [
  { id: "ablation",   label: "1 · Atmospheric Ablation", accent: "text-orange-400", border: "border-orange-500/20", bg: "bg-orange-500/10",  latex: "d_{\\text{final}} = d_0 \\cdot (1 - f_{\\text{burn}})",                                             desc: "Smaller bodies lose 70–95 % of their mass to aerodynamic heating before reaching the surface." },
  { id: "mass",       label: "2 · Asteroid Mass",        accent: "text-blue-400",   border: "border-blue-500/20",   bg: "bg-blue-500/10",    latex: "V = \\tfrac{4}{3}\\pi r^3,\\quad m = V \\cdot \\rho \\;(\\rho = 3{,}000\\,\\text{kg/m}^3)",          desc: "Spherical rocky S-type body at chondrite density." },
  { id: "energy",     label: "3 · Kinetic Energy",       accent: "text-yellow-400", border: "border-yellow-500/20", bg: "bg-yellow-500/10",  latex: "E = \\tfrac{1}{2}mv^2,\\quad E_{\\text{MT}} = E \\,/\\, 4.184{\\times}10^{15}",                     desc: "Energy in Megatons TNT-equivalent, used as input for all downstream scaling laws." },
  { id: "crater",     label: "4 · Crater Diameter",      accent: "text-red-400",    border: "border-red-500/20",    bg: "bg-red-500/10",     latex: "D_{\\text{crater}} = 1.16 \\cdot E_{\\text{MT}}^{1/3} \\;[\\text{km}]",                              desc: "Collins–Melosh π-group scaling relation for transient crater diameter." },
  { id: "fireball",   label: "5 · Fireball & Shockwave", accent: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/10",  latex: "R_{\\text{fb}} = \\max(0.5,\\,0.2\\cdot E_{\\text{MT}}^{0.4}),\\quad R_{\\text{sw}} = 15 R_{\\text{fb}}", desc: "Fireball radius for 3rd-degree burns; shockwave for structural collapse (5 psi)." },
  { id: "seismic",    label: "6 · Seismic Magnitude",    accent: "text-green-400",  border: "border-green-500/20",  bg: "bg-green-500/10",   latex: "M_w = (\\log_{10}E_J - 4.8)\\,/\\,1.5,\\quad R_{\\text{seis}} = 10^{(M_w-3.5)/1.2}",              desc: "Collins–Melosh energy-magnitude scaling and seismic radius." },
  { id: "tsunami",    label: "7 · Tsunami Wave Height",  accent: "text-cyan-400",   border: "border-cyan-500/20",   bg: "bg-cyan-500/10",    latex: "H_{\\text{max}} = \\min(3{,}000,\\;r_m \\times 1.5) \\;[\\text{m}]",                                 desc: "Maximum displaced water wave height for ocean impacts." },
  { id: "recurrence", label: "8 · Recurrence Period",    accent: "text-pink-400",   border: "border-pink-500/20",   bg: "bg-pink-500/10",    latex: "T_{\\text{yr}} = E_{\\text{MT}}^{0.8} \\times 100",                                                  desc: "Statistical return period in years for an impact of this energy." },
];

const stack = [
  ["Framework", "Next.js 16 (App Router, Turbopack)"],
  ["Globe", "D3.js + TopoJSON"],
  ["Tactical Map", "Leaflet + CartoDB Dark Matter"],
  ["Animation", "Framer Motion"],
  ["Styling", "Tailwind CSS"],
  ["AI", "Ollama (any local LLM)"],
  ["Data", "NASA NeoWs API + offline JSON"],
];

// ── Nav links ────────────────────────────────────────────────
const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#physics", label: "Physics" },
  { href: "#stack", label: "Stack" },
];

// ── Page ────────────────────────────────────────────────────
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* MathJax CDN */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" />

      <main className="min-h-screen bg-[#020510] text-white font-sans overflow-x-hidden">

        {/* Background glows */}
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(900px,100vw)] h-[400px] bg-cyan-600/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[350px] bg-indigo-700/10 blur-[100px] rounded-full" />
        </div>

        {/* ── Nav ────────────────────────────────────────── */}
        <nav className="sticky top-0 z-30 border-b border-white/5 backdrop-blur-xl bg-[#020510]/80">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/landing" className="flex items-center gap-2 shrink-0">
              <span className="text-xl">☄️</span>
              <span className="font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent">
                Velocity
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden sm:flex items-center gap-6 text-sm text-zinc-400">
              {navLinks.map(l => (
                <a key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</a>
              ))}
              <Link href="/" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-xs uppercase tracking-wider transition-colors shadow-[0_0_16px_rgba(6,182,212,0.3)]">
                Launch →
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="sm:hidden p-2 text-zinc-400 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                {menuOpen
                  ? <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                  : <path fillRule="evenodd" clipRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                }
              </svg>
            </button>
          </div>

          {/* Mobile drawer */}
          {menuOpen && (
            <div className="sm:hidden border-t border-white/5 px-5 py-4 flex flex-col gap-3 bg-[#020510]">
              {navLinks.map(l => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-zinc-400 hover:text-white py-1 transition-colors text-sm">
                  {l.label}
                </a>
              ))}
              <Link href="/" className="mt-1 py-3 bg-cyan-600 text-white font-bold rounded-xl text-sm uppercase tracking-widest text-center transition-colors hover:bg-cyan-500">
                🚀 Launch Simulator
              </Link>
            </div>
          )}
        </nav>

        {/* ── Hero ────────────────────────────────────────── */}
        <section className="relative z-10 text-center px-5 pt-20 pb-20 sm:pt-28 sm:pb-24 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-5">
            <span className="bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              Asteroid Impact
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Simulator
            </span>
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            Velocity is a scientifically-grounded simulation of near-Earth asteroid impacts — built with Next.js and D3.js, powered by real NASA data. Watch the full sequence from lunar approach to crater formation with live physics telemetry.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="w-full sm:w-auto px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] text-sm uppercase tracking-widest text-center">
              🚀 Launch Simulator
            </Link>
            <a href="https://github.com/raksitbell/velocity" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all text-sm uppercase tracking-widest text-center">
              View on GitHub
            </a>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────── */}
        <section id="features" className="relative z-10 px-5 sm:px-8 py-16 sm:py-20 max-w-6xl mx-auto">
          <SectionHeader title="Everything in one simulation" sub="Features" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(f => (
              <div key={f.title} className="p-5 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 transition-all">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-white text-sm mb-2">{f.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Physics ──────────────────────────────────────── */}
        <section id="physics" className="relative z-10 px-5 sm:px-8 py-16 sm:py-20 max-w-5xl mx-auto">
          <SectionHeader
            title="Physics & Scaling Laws"
            sub={<>All formulas from <code className="text-cyan-500 text-[11px]">src/lib/impactCalculator.ts</code></>}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formulas.map(f => (
              <div key={f.id} className={`rounded-2xl border ${f.border} ${f.bg} p-5 sm:p-6`}>
                <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${f.accent}`}>{f.label}</div>
                {/* MathJax renders \(...\) at runtime */}
                <div className="text-white text-sm mb-3 overflow-x-auto py-1 leading-loose">
                  {`\\(${f.latex}\\)`}
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tech Stack ───────────────────────────────────── */}
        <section id="stack" className="relative z-10 px-5 sm:px-8 py-16 sm:py-20 max-w-3xl mx-auto">
          <SectionHeader title="Tech Stack" sub="Built with" />
          <div className="rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5">
            {stack.map(([layer, lib]) => (
              <div key={layer} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 hover:bg-white/[0.03] transition-colors">
                <span className="text-zinc-500 text-sm">{layer}</span>
                <span className="text-white text-sm font-mono">{lib}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Quick Start ──────────────────────────────────── */}
        <section className="relative z-10 px-5 sm:px-8 py-16 sm:py-20 max-w-2xl mx-auto">
          <SectionHeader title="Quick Start" />
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="text-zinc-600 text-xs ml-2 font-mono">bash</span>
            </div>
            <pre className="px-5 py-5 text-xs sm:text-sm text-zinc-300 font-mono leading-7 overflow-x-auto whitespace-pre-wrap break-words sm:whitespace-pre sm:break-normal">{
`git clone https://github.com/raksitbell/velocity
cd velocity && npm install

# Optional: free NASA API key → api.nasa.gov
echo "NEXT_PUBLIC_NASA_API_KEY=your_key" > .env.local

npm run dev   # → http://localhost:3000`
            }</pre>
          </div>
          <p className="text-center text-zinc-600 text-xs mt-4">
            No key? The app uses DEMO_KEY and silently falls back to offline data when rate-limited.
          </p>
        </section>

        {/* ── CTA ──────────────────────────────────────────── */}
        <section className="relative z-10 px-5 sm:px-8 py-20 sm:py-24">
          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full pointer-events-none" />
            <div className="relative border border-cyan-500/20 bg-white/[0.03] backdrop-blur-2xl rounded-3xl px-8 sm:px-14 py-12 sm:py-14 text-center">
              <div className="text-5xl mb-6">☄️</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">Ready to simulate?</h2>
              <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                Select an asteroid from NASA&apos;s live NEO feed, lock on to a target, and watch the physics unfold.
              </p>
              <Link href="/" className="inline-flex items-center gap-2 px-8 sm:px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-[0_0_40px_rgba(6,182,212,0.35)] text-sm uppercase tracking-widest">
                🚀 Launch Simulator
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────── */}
        <footer className="relative z-10 border-t border-white/5 px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-600">
          <span>© 2025 Raksit · Velocity</span>
          <span>MIT License</span>
        </footer>
      </main>
    </>
  );
}

// ── Shared section header ────────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub?: React.ReactNode }) {
  return (
    <div className="text-center mb-10 sm:mb-14">
      <h2 className="text-2xl sm:text-3xl font-bold mb-2">{title}</h2>
      {sub && <p className="text-zinc-500 text-xs sm:text-sm uppercase tracking-widest font-mono">{sub}</p>}
    </div>
  );
}
