"use client";

import type React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import { Asteroid } from "@/services/nasaService";
import { ZoomIn, ZoomOut } from "lucide-react";

interface GeoFeature { type: string; geometry: any; properties: any; }

function interpolateProjection(raw0: any, raw1: any) {
  const mutate: any = d3.geoProjectionMutator((t: number) => (x: number, y: number) => {
    const [x0, y0] = raw0(x, y);
    const [x1, y1] = raw1(x, y);
    return [x0 + t * (x1 - x0), y0 + t * (y1 - y0)];
  });
  let t = 0;
  return Object.assign((mutate as any)(t), {
    alpha(_: number) { return arguments.length ? (mutate as any)((t = +_)) : t; },
  });
}

interface D3GlobeMapProps {
  asteroids: Asteroid[];
  selectedAsteroid: Asteroid | null;
  progress: number;
  mapProgress: number;
  mapMode: "3d" | "2d";
  onMapModeChange: (mode: "3d" | "2d") => void;
  impactPoint: { lat: number; lon: number } | null;
  onAsteroidScreenPos?: (x: number, y: number) => void;
  simComplete?: boolean;
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 4.0;

export function D3GlobeMap({
  selectedAsteroid, progress, mapProgress, mapMode, onMapModeChange, impactPoint, onAsteroidScreenPos, simComplete,
}: D3GlobeMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [worldData, setWorldData] = useState<GeoFeature[]>([]);

  // Rotation: state drives D3 render, ref is updated by rAF loop
  const [rotation, setRotation] = useState<[number, number]>([0, 0]);
  const rotRef = useRef<[number, number]>([0, 0]);

  // Drag state
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef([0, 0]);

  // User zoom
  const [userZoom, setUserZoom] = useState(1.0);
  const userZoomRef = useRef(1.0);
  useEffect(() => { userZoomRef.current = userZoom; }, [userZoom]);

  // Window dimensions
  const [dimensions, setDimensions] = useState({ width: 800, height: 800 });
  const dimensionsRef = useRef(dimensions);
  useEffect(() => { dimensionsRef.current = dimensions; }, [dimensions]);

  // Props as refs — so the single rAF loop can read them without re-creating
  const progressRef = useRef(progress);
  const mapProgressRef = useRef(mapProgress);
  const impactPointRef = useRef(impactPoint);
  const selectedAsteroidRef = useRef(selectedAsteroid);
  const onAsteroidScreenPosRef = useRef(onAsteroidScreenPos);
  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { mapProgressRef.current = mapProgress; }, [mapProgress]);
  useEffect(() => { impactPointRef.current = impactPoint; }, [impactPoint]);
  useEffect(() => { selectedAsteroidRef.current = selectedAsteroid; }, [selectedAsteroid]);
  useEffect(() => { onAsteroidScreenPosRef.current = onAsteroidScreenPos; }, [onAsteroidScreenPos]);

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(r => r.json())
      .then((world: any) => {
        const countries = (feature(world, world.objects.countries as any) as any).features;
        setWorldData(countries as GeoFeature[]);
        // Force initial D3 render by nudging rotation state
        setRotation([0.001, 0]);
      }).catch(console.error);
  }, []);

  // ──────────────────────────────────────────────────────────────
  // Single rAF loop — handles camera AND rotation interpolation.
  // Camera is applied via direct DOM mutation (no React setState).
  // setRotation is called only when rotation meaningfully changes.
  // ──────────────────────────────────────────────────────────────
  const camScaleAnim = useRef(1);
  const camTxAnim = useRef(0);
  const camTyAnim = useRef(0);

  useEffect(() => {
    let rafId: number;

    const buildProjection = (w: number, h: number, rot: [number, number], mp: number, zoom: number) => {
      const t = mp / 100;
      const alpha = Math.pow(t, 0.5);
      const baseScale = d3.scaleLinear().domain([0, 1]).range([Math.min(w, h) / 2.2, w / 6.5])(alpha) * zoom;
      const proj = interpolateProjection(d3.geoOrthographicRaw, d3.geoEquirectangularRaw)
        .scale(baseScale).translate([w / 2, h / 2]).rotate([rot[0], rot[1]]).precision(0.1);
      proj.alpha(alpha);
      return proj;
    };

    const tick = () => {
      const p = progressRef.current;
      const ip = impactPointRef.current;
      const { width: w, height: h } = dimensionsRef.current;
      const mp = mapProgressRef.current;
      const zoom = userZoomRef.current;

      // 1. Interpolate rotation toward impact lat/lon during flight
      let rotChanged = false;
      if (ip && p > 0 && p < 1) {
        const tr: [number, number] = [-ip.lon, -ip.lat * 0.4];
        const nr: [number, number] = [
          rotRef.current[0] + (tr[0] - rotRef.current[0]) * 0.025,
          rotRef.current[1] + (tr[1] - rotRef.current[1]) * 0.025,
        ];
        if (Math.abs(nr[0] - rotRef.current[0]) > 0.01 || Math.abs(nr[1] - rotRef.current[1]) > 0.01) {
          rotRef.current = nr;
          rotChanged = true;
        }
      }
      if (rotChanged) setRotation([rotRef.current[0], rotRef.current[1]]);

      // 2. Compute camera targets
      let targetScale = 1, targetTx = 0, targetTy = 0;
      if (ip && p > 0 && p < 1) {
        if (p < 0.08) targetScale = 1 - p * (0.38 / 0.08);
        else if (p < 0.85) targetScale = 0.62;
        else targetScale = 0.62 + ((p - 0.85) / 0.15) * 0.38;

        const proj = buildProjection(w, h, rotRef.current, mp, zoom);
        const ic = proj([ip.lon, ip.lat]);
        const ix = ic ? ic[0] : w / 2;
        const iy = ic ? ic[1] : h / 2;
        const astX = w * 0.85 + (ix - w * 0.85) * p;
        const astY = -h * 0.08 + (iy - (-h * 0.08)) * p;

        const followStr = 0.3;
        targetTx = (w / 2 - astX) * followStr;
        targetTy = (h / 2 - astY) * followStr;

        // Emit true screen position accounting for camera transform
        const cs = camScaleAnim.current;
        const screenX = w / 2 + (astX + camTxAnim.current - w / 2) * cs;
        const screenY = h / 2 + (astY + camTyAnim.current - h / 2) * cs;
        onAsteroidScreenPosRef.current?.(screenX, screenY);
      }

      // 3. Lerp camera values
      camScaleAnim.current += (targetScale - camScaleAnim.current) * 0.08;
      camTxAnim.current += (targetTx - camTxAnim.current) * 0.06;
      camTyAnim.current += (targetTy - camTyAnim.current) * 0.06;

      // 4. Apply camera directly to DOM (zero React setState for camera)
      if (svgRef.current) {
        svgRef.current.style.transform =
          `scale(${camScaleAnim.current}) translate(${camTxAnim.current}px, ${camTyAnim.current}px)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []); // Intentionally empty — reads everything from refs

  // Scroll wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    setUserZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * delta)));
  }, []);

  // Drag to rotate (disabled during flight)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (progressRef.current > 0 && progressRef.current < 1) return;
    isDraggingRef.current = true;
    lastMouseRef.current = [e.clientX, e.clientY];
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current[0];
    const dy = e.clientY - lastMouseRef.current[1];
    const t = mapProgressRef.current / 100;
    const sens = t < 0.5 ? 0.5 : 0.25;
    rotRef.current = [
      rotRef.current[0] + dx * sens,
      Math.max(-90, Math.min(90, rotRef.current[1] - dy * sens)),
    ];
    setRotation([rotRef.current[0], rotRef.current[1]]);
    lastMouseRef.current = [e.clientX, e.clientY];
  };
  const handleMouseUp = () => { isDraggingRef.current = false; };

  // D3 render — runs when rotation, zoom, progress etc. change (for visual update)
  useEffect(() => {
    if (!svgRef.current || worldData.length === 0) return;
    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll(".map-layer").remove();

    const t = mapProgress / 100;
    const alpha = Math.pow(t, 0.5);
    const baseScale = d3.scaleLinear().domain([0, 1]).range([Math.min(width, height) / 2.2, width / 6.5])(alpha) * userZoom;

    const projection = interpolateProjection(d3.geoOrthographicRaw, d3.geoEquirectangularRaw)
      .scale(baseScale).translate([width / 2, height / 2])
      .rotate([rotation[0], rotation[1]]).precision(0.1);
    projection.alpha(alpha);
    const path = d3.geoPath(projection);
    const mapLayer = svg.append("g").attr("class", "map-layer");

    // Sphere
    try {
      const s = path({ type: "Sphere" });
      if (s) mapLayer.append("path").datum({ type: "Sphere" }).attr("d", s)
        .attr("fill", "#020513").attr("stroke", "#1e293b").attr("stroke-width", 1);
    } catch {}

    // Graticule
    try {
      const graticule = d3.geoGraticule();
      mapLayer.append("path").datum(graticule()).attr("d", path(graticule()))
        .attr("fill", "none").attr("stroke", "#334155").attr("stroke-width", 0.5).attr("opacity", 0.3);
    } catch {}

    // Countries
    mapLayer.selectAll(".country").data(worldData).enter().append("path")
      .attr("class", "country")
      .attr("d", (d) => { try { const ps = path(d as any); return typeof ps === "string" && (ps.includes("NaN") || ps.includes("Infinity")) ? "" : ps || ""; } catch { return ""; } })
      .attr("fill", "#0f172a").attr("stroke", "#334155").attr("stroke-width", 1)
      .style("visibility", function () { const pd = d3.select(this).attr("d"); return pd && pd.length > 0 && !pd.includes("NaN") ? "visible" : "hidden"; });

    // Crosshair
    if (impactPoint && progress < 1) {
      const coords = projection([impactPoint.lon, impactPoint.lat]);
      if (coords && path({ type: "Point", coordinates: [impactPoint.lon, impactPoint.lat] })) {
        const [ix, iy] = coords;
        const tg = mapLayer.append("g").attr("transform", `translate(${ix},${iy})`);
        tg.append("circle").attr("r", 8).attr("fill", "none").attr("stroke", "#06b6d4").attr("stroke-width", 2);
        tg.append("line").attr("x1", -12).attr("y1", 0).attr("x2", 12).attr("y2", 0).attr("stroke", "#06b6d4").attr("stroke-width", 1);
        tg.append("line").attr("x1", 0).attr("y1", -12).attr("x2", 0).attr("y2", 12).attr("stroke", "#06b6d4").attr("stroke-width", 1);
      }
    }

    // Impact rings
    if (progress >= 1 && impactPoint) {
      const coords = projection([impactPoint.lon, impactPoint.lat]);
      if (coords && path({ type: "Point", coordinates: [impactPoint.lon, impactPoint.lat] })) {
        const [ix, iy] = coords;
        const ep = mapLayer.append("g").attr("transform", `translate(${ix},${iy})`);
        ep.append("circle").attr("r", 3).attr("fill", "#ef4444");
        ep.append("circle").attr("r", 15).attr("fill", "rgba(239,68,68,0.4)").attr("stroke", "#ef4444").attr("stroke-width", 2);
        ep.append("circle").attr("r", 45).attr("fill", "rgba(234,179,8,0.1)").attr("stroke", "#eab308").attr("stroke-dasharray", "4,4").attr("stroke-width", 1);
      }
    }

    // Asteroid approach
    if (selectedAsteroid && progress > 0 && progress < 1 && impactPoint) {
      const impactProj = projection([impactPoint.lon, impactPoint.lat]);
      if (impactProj) {
        const [ix, iy] = impactProj;
        const startX = width * 0.85, startY = -height * 0.08;
        const astX = startX + (ix - startX) * progress;
        const astY = startY + (iy - startY) * progress;
        mapLayer.append("line").attr("x1", startX).attr("y1", startY).attr("x2", astX).attr("y2", astY)
          .attr("stroke", "url(#asteroidTrail)").attr("stroke-width", 3);
        const isHaz = selectedAsteroid.is_potentially_hazardous_asteroid;
        const col = isHaz ? "#f97316" : "#22d3ee";
        mapLayer.append("circle").attr("cx", astX).attr("cy", astY).attr("r", isHaz ? 18 : 14)
          .attr("fill", "none").attr("stroke", col).attr("stroke-width", 1).attr("opacity", 0.35);
        mapLayer.append("circle").attr("cx", astX).attr("cy", astY).attr("r", isHaz ? 7 : 5)
          .attr("fill", col).attr("stroke", "#ffffff").attr("stroke-width", 1.5)
          .attr("filter", `drop-shadow(0 0 8px ${col})`);
      }
    }
  }, [worldData, progress, rotation, dimensions, mapProgress, impactPoint, selectedAsteroid, userZoom]);

  return (
    <div className={`absolute inset-0 bg-black flex items-center justify-center overflow-hidden transition-[padding] duration-300 ${
      simComplete ? 'pb-[50vh] md:pb-0' : ''
    }`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ transformOrigin: "center center", willChange: "transform" }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={(e) => {
          const t = e.touches[0];
          lastMouseRef.current = [t.clientX, t.clientY];
          isDraggingRef.current = true;
        }}
        onTouchMove={(e) => {
          if (!isDraggingRef.current) return;
          const t = e.touches[0];
          const dx = t.clientX - lastMouseRef.current[0];
          const dy = t.clientY - lastMouseRef.current[1];
          lastMouseRef.current = [t.clientX, t.clientY];
          rotRef.current = [rotRef.current[0] + dx * 0.3, Math.max(-90, Math.min(90, rotRef.current[1] - dy * 0.3))];
          setRotation([...rotRef.current]);
        }}
        onTouchEnd={() => { isDraggingRef.current = false; }}
      >
        <defs>
          <linearGradient id="asteroidTrail" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>

      {/* Zoom Controls — bottom-right, clear of the bottom sheet on mobile */}
      <div className={`absolute right-4 z-20 flex flex-col items-center gap-1.5 transition-[bottom] duration-300 ${
        simComplete ? 'bottom-[calc(50vh+12px)] md:bottom-8' : 'bottom-8'
      }`}>
        <button
          onClick={() => setUserZoom(z => Math.min(MAX_ZOOM, z * 1.25))}
          className="w-10 h-10 md:w-9 md:h-9 bg-zinc-900/80 backdrop-blur border border-zinc-700 text-white rounded-xl hover:bg-zinc-800 flex items-center justify-center transition-colors shadow-lg"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setUserZoom(z => Math.max(MIN_ZOOM, z * 0.8))}
          className="w-10 h-10 md:w-9 md:h-9 bg-zinc-900/80 backdrop-blur border border-zinc-700 text-white rounded-xl hover:bg-zinc-800 flex items-center justify-center transition-colors shadow-lg"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="text-[9px] text-center font-mono text-zinc-500">{(userZoom * 100).toFixed(0)}%</div>
      </div>

      {/* 2D/3D Toggle — above zoom controls */}
      <div className={`absolute right-4 z-20 transition-[bottom] duration-300 ${
        simComplete ? 'bottom-[calc(50vh+88px)] md:bottom-36' : 'bottom-36'
      }`}>
        <button
          onClick={() => onMapModeChange(mapMode === "3d" ? "2d" : "3d")}
          className="bg-zinc-900/80 backdrop-blur border border-zinc-700 text-xs text-white px-3 py-2.5 md:px-4 rounded-full hover:bg-zinc-800 transition-colors shadow-lg whitespace-nowrap"
        >
          {mapMode === "3d" ? "→ 2D Map" : "→ 3D Globe"}
        </button>
      </div>
    </div>
  );
}
