# Velocity — Asteroid Impact Simulator

> An interactive, scientifically-grounded asteroid impact simulation built with Next.js. Fetches real near-Earth object (NEO) data from NASA's NeoWs API and simulates the full impact sequence: atmospheric entry → kinetic energy release → crater formation → shockwave → seismic event → tsunami.

---

## ✨ Features

| Feature | Description |
|---|---|
| **3D/2D D3 Globe** | Interactive globe rendered with D3.js + TopoJSON; morphs between 3D orthographic and 2D equirectangular views |
| **Cinematic Camera** | Globe auto-rotates toward impact, zooms out during flight, and tracks the asteroid in real time |
| **Zoom Controls** | `+` / `−` buttons and scroll-wheel zoom (40 %–400 %); drag to rotate in idle mode |
| **Real NASA NEO Data** | Live feed via NASA NeoWs API with `localStorage` cache; auto-selects the closest approach window daily |
| **Offline Fallback** | Automatically falls back to the bundled offline dataset when NASA rate limits hit (HTTP 429) with a non-blocking amber banner |
| **Asteroid Selector** | Compact floating dropdown with live search, diameter, velocity, and hazard badge per object |
| **Live Telemetry HUD** | Floats next to the asteroid dot during flight; shows altitude, velocity, mass, hull temperature, atmospheric entry warning, and **estimated target city** (reverse-geocoded from impact coordinates) |
| **Flight Timeline** | Compact scrubber strip pinned to the bottom of the left panel — play / pause / scrub / reset |
| **Devastation Report** | After impact: geographic 2D map, ground zero coordinates, energy, crater dimensions, fireball radius, shockwave / tsunami, casualty estimate, seismic magnitude |
| **Tactical Impact Map** | Leaflet dark-matter map centred on impact lat/lon with fireball and shockwave overlay circles; starts zoomed out (level 3) for continental context |
| **AI Scientific Assistant** | Ollama-powered chat about asteroid physics; works locally or via configurable tunnel URL |
| **Settings Panel** | Configure data source (live / offline), NASA API key, daily auto-fetch; shows last sync time and manual pull button |
| **Mobile UX** | Dropdown selector and bottom-sheet impact report; all panels adapt to small screens |

---

## 🧮 Physics & Mathematics

All calculations live in [`src/lib/impactCalculator.ts`](src/lib/impactCalculator.ts).

### 1. Atmospheric Ablation

Smaller bodies lose mass to aerodynamic heating:

| Diameter | Mass loss |
|---|---|
| $d < 50\,\text{m}$ | 70–95 % |
| $50\,\text{m} \leq d < 100\,\text{m}$ | 30–50 % |
| $100\,\text{m} \leq d < 1\,\text{km}$ | 5–15 % |
| $d \geq 1\,\text{km}$ | < 2 % |

### 2. Asteroid Mass

$$V = \tfrac{4}{3}\pi r^3,\quad m = V \cdot \rho \quad [\rho = 3{,}000\,\text{kg/m}^3,\ \text{rocky S-type}]$$

### 3. Kinetic Energy

$$E = \tfrac{1}{2}mv^2 \qquad E_{\text{MT}} = \frac{E}{4.184\times10^{15}} \quad [\text{Megatons TNT}]$$

### 4. Crater Diameter (Collins–Melosh scaling)

$$D_{\text{crater}} = 1.16\cdot E_{\text{MT}}^{1/3} \quad [\text{km}]$$

### 5. Fireball & Shockwave Radii

$$R_{\text{fireball}} = \max(0.5,\ 0.2\cdot E_{\text{MT}}^{0.4})\quad R_{\text{shockwave}} = 15\cdot R_{\text{fireball}} \quad [\text{km}]$$

### 6. Seismic Magnitude & Radius

$$M_w = \frac{\log_{10}(E_J) - 4.8}{1.5} \qquad R_{\text{seismic}} = 10^{(M_w - 3.5)/1.2} \quad [\text{km}]$$

### 7. Tsunami Wave Height (ocean impacts)

$$H_{\text{max}} = \min(3{,}000,\ r_m \times 1.5) \quad [\text{metres}]$$

### 8. Recurrence Period

$$T_{\text{years}} = E_{\text{MT}}^{0.8} \times 100$$

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Root layout & state orchestration
│   └── api/
│       ├── nasa/                   # Next.js proxy → NASA NeoWs API
│       └── ollama/generate/        # Next.js proxy → Ollama instance
├── components/ui/
│   ├── AsteroidPanel.tsx           # Floating dropdown asteroid selector
│   ├── SimulationControls.tsx      # Left panel — devastation report + inline timeline
│   ├── D3GlobeMap.tsx              # D3 orthographic / equirectangular globe with cinematic camera
│   ├── FlightTelemetryHUD.tsx      # Floating HUD anchored to the asteroid dot during flight
│   ├── IsometricImpactMap.tsx      # Leaflet tactical impact map (post-impact)
│   ├── MobileBottomBar.tsx         # Mobile asteroid selector + launch bar
│   ├── ScientificQA.tsx            # Ollama AI chat assistant
│   └── SettingsDialog.tsx          # API key, data source, auto-fetch controls
├── hooks/
│   ├── useSimulation.ts            # Central simulation state + rAF animation loops
│   └── useSettings.tsx             # Settings context (localStorage-persisted)
├── lib/
│   └── impactCalculator.ts         # All physics & scaling-law calculations
└── services/
    ├── nasaService.ts              # NASA NeoWs API + localStorage cache + offline fallback
    └── ollamaService.ts            # Dual-channel Ollama (direct browser + server proxy)
```

---

## 🛠️ Tech Stack

| Layer | Library |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Globe / Maps | [D3.js](https://d3js.org/), [TopoJSON](https://github.com/topojson/topojson), [Leaflet](https://leafletjs.com/) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| AI | [Ollama](https://ollama.com/) (any local model, e.g. `llama3`) |
| Data | [NASA NeoWs API](https://api.nasa.gov/) + bundled offline JSON |

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js ≥ 18

### 1. Clone & Install

```bash
git clone <repository-url>
cd velocity
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
# Optional — free key at https://api.nasa.gov/ (defaults to DEMO_KEY with rate limits)
NEXT_PUBLIC_NASA_API_KEY=your_nasa_api_key_here

# Optional — Ollama base URL for the server-side proxy
OLLAMA_BASE_URL=https://your-ollama-tunnel.example.com

# Optional — Ollama URL exposed to the browser (for direct calls)
NEXT_PUBLIC_OLLAMA_URL=https://your-ollama-tunnel.example.com
```

> **Tip:** If you don't set a NASA API key the app uses `DEMO_KEY`, which has tight hourly rate limits. When the limit is hit the app automatically switches to the bundled offline dataset and shows a banner. You can always set your own key in the in-app **Settings** panel without redeploying.

### 3. Run

```bash
npm run dev      # development (Turbopack)
npm run build    # production build
npm run start    # serve production build
```

Visit [http://localhost:3000](http://localhost:3000).

### 4. AI Assistant (optional)

```bash
# Install Ollama: https://ollama.com/download
ollama run llama3
```

---

## 🌐 Deploying with Local Ollama

Expose your local Ollama via a tunnel so the deployed app can reach it:

```bash
ngrok http 11434
# or
cloudflared tunnel --url http://localhost:11434
```

Paste the tunnel URL into **Settings → Ollama URL** in the app — it's saved in `localStorage`, no redeploy needed.

---

## 📄 License

MIT

## 👤 Author

Raksit
