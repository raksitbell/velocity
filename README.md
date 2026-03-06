# Velocity — Asteroid Impact Simulator

> An interactive, scientifically-grounded 3D asteroid impact simulation built with Next.js and Three.js. Fetches real near-Earth object (NEO) data from NASA's NeoWs API and simulates the full impact sequence: atmospheric ablation → kinetic energy release → crater formation → shockwave → seismic event → tsunami.

---

## ✨ Features

| Feature | Description |
|---|---|
| **3D Photorealistic Globe** | Multi-layered Earth (Blue Marble, bump, specular, night-lights, clouds) rendered with Three.js |
| **Real NASA Data** | Live NEO feed via NASA NeoWs API, cached in `localStorage` for 1 hour to avoid rate limits |
| **Clickable Impact Target** | Click anywhere on the globe surface to set a custom impact point before launch |
| **Asteroid Telemetry HUD** | Floating label on the asteroid during flight showing velocity, mass, diameter, and T-minus countdown |
| **Full Impact Sequence** | Flash → particle burst → expanding fireball ring → shockwave ring → persistent crater glow |
| **7-Tab Devastation Report** | Overview, Thermal, Wave Blast, Life Effects, Crater, Seismic, Tsunami |
| **Tactical Impact Map** | 2D dark-mode Leaflet map centered on computed impact lat/lon with fireball & shockwave circles |
| **Scientific QA (AI)** | Ollama-powered chat assistant, works locally and via configurable URL when deployed online |
| **Mobile-First UX** | Sidebar auto-closes on selection; floating bottom bar for Confirm → Play → Results |

---

## 🧮 Physics & Mathematics

All calculations are in [`src/lib/impactCalculator.ts`](src/lib/impactCalculator.ts).

### 1. 3D Sphere → Geographic Coordinates

Converts a `THREE.Vector3` surface point to (lat, lon) using the actual `SphereGeometry` vertex equations:

$$x = -\cos(\phi)\sin(\theta), \quad z = \sin(\phi)\sin(\theta), \quad y = \cos(\theta)$$

$$\phi = \text{atan2}(z,\ -x)$$

$$\text{lat} = \arcsin(y) \cdot \frac{180}{\pi}, \qquad \text{lon} = \phi \cdot \frac{180}{\pi} - 180 \quad [\text{normalised to } {-180°…180°}]$$

**Implementation:**
```typescript
const normalized = impactPoint.clone().normalize();
const latRads = Math.asin(Math.max(-1, Math.min(1, normalized.y)));
let lon = Math.atan2(normalized.z, -normalized.x) * (180 / Math.PI) - 180;
if (lon <= -180) lon += 360;  // normalise from (-360, 0] to (-180, 180]
const lat = latRads * (180 / Math.PI);
```

---

### 2. Atmospheric Ablation

Smaller bodies lose mass to aerodynamic heating before reaching the surface:

$$d_{\text{final}} = d_0 \cdot (1 - f_{\text{burn}})$$

| Diameter | Mass loss $f_{\text{burn}}$ |
|---|---|
| $d < 50\,\text{m}$ | 70 – 95 % |
| $50\,\text{m} \leq d < 100\,\text{m}$ | 30 – 50 % |
| $100\,\text{m} \leq d < 1\,\text{km}$ | 5 – 15 % |
| $d \geq 1\,\text{km}$ | < 2 % |

**Implementation:**
```typescript
const originalDiameterKm = asteroid.estimated_diameter.kilometers.estimated_diameter_max;
let finalDiameterKm = originalDiameterKm;
let burnPercentage = 0;

if (originalDiameterKm < 0.05) {
  burnPercentage = 70 + (Math.random() * 25); 
} else if (originalDiameterKm < 0.1) {
  burnPercentage = 30 + (Math.random() * 20);
} else if (originalDiameterKm < 1.0) {
  burnPercentage = 5 + (Math.random() * 10);
} else {
  burnPercentage = Math.random() * 2;
}

finalDiameterKm = originalDiameterKm * (1 - (burnPercentage / 100));
```

---

### 3. Asteroid Mass

$$r = \frac{d_{\text{final}}}{2} \quad [\text{metres}]$$

$$V = \frac{4}{3}\pi r^3 \qquad m = V \cdot \rho \quad [\rho = 3000\,\text{kg/m}^3\ \text{rocky S-type}]$$

**Implementation:**
```typescript
let radiusMeters = (finalDiameterKm * 1000) / 2;
const volumeCubicMeters = (4 / 3) * Math.PI * Math.pow(radiusMeters, 3);
let massKg = volumeCubicMeters * ASTEROID_DENSITY; // ASTEROID_DENSITY = 3000
```

---

### 4. Kinetic Energy

$$E = \frac{1}{2}mv^2 \quad [\text{Joules}]$$

$$E_{\text{MT}} = \frac{E}{4.184 \times 10^{15}} \quad [\text{Megatons TNT}]$$

**Implementation:**
```typescript
const velocityKmh = parseFloat(asteroid.close_approach_data[0]?.relative_velocity.kilometers_per_hour || "0");
const velocityMs = (velocityKmh * 1000) / 3600;

let kineticEnergyJoules = 0.5 * massKg * Math.pow(velocityMs, 2);
let kineticEnergyMegatons = kineticEnergyJoules / 4.184e15;
```

---

### 5. Crater Diameter

Collins–Melosh impact scaling (simplified):

$$D_{\text{crater}} = 1.16 \cdot E_{\text{MT}}^{1/3} \quad [\text{km}]$$

**Implementation:**
```typescript
const craterDiameterKm = 1.16 * Math.pow(kineticEnergyMegatons, 1/3);
```

---

### 6. Fireball & Shockwave Radii

$$R_{\text{fireball}} = \max\!\left(0.5,\ 0.2 \cdot E_{\text{MT}}^{0.4}\right) \quad [\text{km}]$$

$$R_{\text{shockwave}} = 15 \cdot R_{\text{fireball}} \quad [\text{km, structural collapse zone}]$$

**Implementation:**
```typescript
const fireballRadiusKm = Math.max(0.5, 0.2 * Math.pow(kineticEnergyMegatons, 0.4));
const evacuationRadiusKm = fireballRadiusKm * 15;
```

---

### 7. Seismic Magnitude & Radius

$$M_w = \frac{\log_{10}(E_J) - 4.8}{1.5}$$

$$R_{\text{seismic}} = 10^{(M_w - 3.5)\,/\,1.2} \quad [\text{km}]$$

**Implementation:**
```typescript
const richterMagnitude = kineticEnergyJoules > 0 
  ? parseFloat(((Math.log10(kineticEnergyJoules) - 4.8) / 1.5).toFixed(1))
  : 0;
const seismicRadiusKm = Math.max(0, Math.pow(10, (richterMagnitude - 3.5) / 1.2));
```

---

### 8. Tsunami Wave Height (ocean impacts)

$$H_{\text{max}} = \min(3000,\ r_m \times 1.5) \quad [\text{metres}]$$

**Implementation:**
```typescript
if (isWater) {
  tsunamiHeightMeters = Math.min(3000, radiusMeters * 1.5); 
}
```

---

### 9. Recurrence Period

$$T_{\text{years}} = E_{\text{MT}}^{0.8} \times 100$$

**Implementation:**
```typescript
const recurrencePeriodYears = kineticEnergyMegatons > 0
  ? Math.round(Math.pow(kineticEnergyMegatons, 0.8) * 100)
  : 1;
```

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Root page — state orchestration
│   └── api/
│       ├── nasa/                   # Next.js proxy → NASA NeoWs API
│       └── ollama/generate/        # Next.js proxy → Ollama instance
├── components/
│   ├── scene/
│   │   ├── Earth.tsx               # Photorealistic globe (multi-layer)
│   │   ├── GlobeScene.tsx          # R3F Canvas + OrbitControls
│   │   ├── AsteroidPath.tsx        # Trajectory + telemetry HUD
│   │   ├── Asteroids.tsx           # NEO swarm visualisation
│   │   ├── ImpactEffect.tsx        # Rings, flash, particles post-impact
│   │   └── TargetMarker.tsx        # 3D crosshair before launch
│   └── ui/
│       ├── AsteroidPanel.tsx       # Left sidebar — asteroid list + launch
│       ├── SimulationControls.tsx  # Right panel — 7-tab devastation report
│       ├── IsometricImpactMap.tsx  # Leaflet 2D tactical map
│       └── ScientificQA.tsx        # Ollama AI chat assistant
├── lib/
│   └── impactCalculator.ts         # All physics calculations
└── services/
    ├── nasaService.ts              # NASA API + localStorage cache (1 h TTL)
    └── ollamaService.ts            # Dual-channel Ollama (direct + proxy)
```

---

## 🛠️ Tech Stack

| Layer | Library / Tool |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router, Turbopack) |
| 3D Rendering | [Three.js](https://threejs.org/), [React Three Fiber](https://docs.pmnd.rs/react-three-fiber), [Drei](https://github.com/pmndrs/drei) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| 2D Map | [Leaflet](https://leafletjs.com/) + CartoDB Dark Matter tiles |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| AI | [Ollama](https://ollama.com/) (`llama3` or any local model) |
| Data Source | [NASA NeoWs API](https://api.nasa.gov/) |

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js ≥ 18
- npm / yarn / pnpm

### 1. Clone & Install

```bash
git clone <repository-url>
cd velocity
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
# Required — free key at https://api.nasa.gov/
NEXT_PUBLIC_NASA_API_KEY=your_nasa_api_key_here

# Optional — Ollama base URL for server-side proxy
OLLAMA_BASE_URL=https://your-ollama-tunnel.example.com

# Optional — Ollama URL exposed to the browser (for direct calls)
NEXT_PUBLIC_OLLAMA_URL=https://your-ollama-tunnel.example.com
```

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### 4. Ollama Setup (AI Assistant)

```bash
# Install Ollama: https://ollama.com/download
ollama run llama3
```

---

## 🌐 Online Deployment + Local Ollama

When deployed online but Ollama runs locally:

```bash
# Expose local Ollama via ngrok
ngrok http 11434
# or Cloudflare Tunnel
cloudflared tunnel --url http://localhost:11434
```

Then set `OLLAMA_BASE_URL` in your hosting environment (e.g. Vercel → Settings → Environment Variables), or paste the tunnel URL directly in the in-app AI settings — it's stored in `localStorage` and used for direct browser calls without needing a redeploy.

---

## 🧪 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint check |

---

## 📄 License

MIT

## 👤 Author

Raksit