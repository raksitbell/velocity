# Velocity: Asteroid Impact Simulator - Agent Context Handover

This document provides a comprehensive summary of the project state, recent work, and conversation history for any AI agent continuing the development.

## 🌌 Project Overview
**Velocity** is a photorealistic, scientifically-grounded 3D asteroid impact simulator built with **Next.js 15**, **Three.js**, and **React Three Fiber**. It fetches real-time Near-Earth Object (NEO) data from NASA's NeoWs API and allows users to simulate the devastating effects of an impact anywhere on Earth.

## 🛠 Tech Stack
- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS 4, Lucide React.
- **3D Engine:** Three.js, React Three Fiber, Drei.
- **Animation:** Framer Motion (used for UI transitions and the mobile bottom sheet).
- **2D Mapping:** Leaflet with Dark Matter tiles.
- **AI Integration:** Support for Ollama (local or via configurable proxy).
- **Data Source:** NASA NeoWs API (proxied via `/api/nasa`).

## 🗺️ Key Features & UX Flow

### Mobile-First UX (The "Globe-First" Flow)
1. **Selection:** User opens the left sidebar (auto-closes on selection) to pick an asteroid.
2. **Targeting:** User taps the globe to set an impact point. A `TargetMarker` (3D crosshair) appears.
3. **Launch:** A floating bottom bar appears with a "Confirm Target & Launch" button.
4. **Animation:** During flight, a floating **Telemetry HUD** shows real-time Mass, Velocity, Diameter, and T-minus countdown. The globe is fully visible and unobstructed.
5. **Impact:** At impact, a post-processing flash occurs, followed by expanding particle rings (fireball/shockwave).
6. **Results:** `SimulationControls` slides up as a bottom sheet (max 75vh) containing 7 tabs of devastation data.

### Desktop UX
- Permanent tri-panel layout: [Left: Asteroid List] | [Center: 3D Globe] | [Right: Results/Controls].
- Panels are fixed overlays; the globe fills the background.

## 🧮 Physics & Math Engine
Located in `src/lib/impactCalculator.ts`.
- **Spherical to Lat/Lon:** Uses `Math.atan2` and `Math.asin` to convert 3D coordinates to geographic points.
- **Atmospheric Ablation:** Simulates mass loss based on initial diameter (smaller rocks burn more).
- **Kinetic Energy:** $E = \frac{1}{2}mv^2$, converted to Megatons TNT.
- **Crater Scaling:** Simplified Collins-Melosh law ($D \propto E^{1/3}$).
- **Devastation Radii:** Exponential scaling for fireball, shockwave, and seismic effects.
- **Tsunami:** Logic for ocean-based impacts.

## 🕒 Recent Work Summary

### 🛡️ Conflict Resolution (CRITICAL)
- **Problem:** An Angular 19 project template was accidentally merged/injected into the codebase, overwriting `README.md`, `tsconfig.json`, and creating numerous Angular-specific folders (`features/`, `core/`, `supabase/`).
- **Solution:** Surgically removed all Angular artifacts, cleaned up `src/app` to a pure Next.js state, and restored the original `tsconfig.json` and `README.md`.

### 💅 UI Fixes
- Fixed a desktop layout issue where the right panel was truncated due to mobile `max-h` constraints.
- Resolved "z-fighting" on the Earth globe by adjusting sphere layers (clouds, day, night) and adding `polygonOffset`.
- Corrected asteroid scaling: Visual size is now log-scaled and capped at $0.12$ units (Earth is $2.0$) to ensure visual realism.

### 📝 Documentation
- Updated `README.md` with full LaTeX-rendered physics formulas and the actual TypeScript implementation snippets for each.

## 🚦 Current State & Next Steps
- **Build Status:** Passing. `npm run dev` is active.
- **NASA API:** Successfully proxied and cached (1 hour TTL in `localStorage`).
- **Ollama:** Dual-channel implementation (direct browser via `localStorage` URL or fallback to server proxy).
- **Next Step suggestions:**
    - Implement a "save/share" feature for specific impact scenarios.
    - Enhance the AI assistant (`ScientificQA`) with knowledge about the specific impact currently being viewed.
    - Add visual depth to the crater (decals or bump maps on the Earth texture post-impact).

---
*Date: 2026-03-06*
*Context captured by: Antigravity*
