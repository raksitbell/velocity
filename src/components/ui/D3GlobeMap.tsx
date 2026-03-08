"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import { Asteroid } from "@/services/nasaService";
import { ImpactMetrics } from "@/lib/impactCalculator";

// D3/TopoJSON Types
interface GeoFeature {
  type: string;
  geometry: any;
  properties: any;
}

// Map projection interpolator from globe-to-map-transform.tsx
function interpolateProjection(raw0: any, raw1: any) {
  const mutate: any = d3.geoProjectionMutator((t: number) => (x: number, y: number) => {
    const [x0, y0] = raw0(x, y);
    const [x1, y1] = raw1(x, y);
    return [x0 + t * (x1 - x0), y0 + t * (y1 - y0)];
  });
  let t = 0;
  return Object.assign((mutate as any)(t), {
    alpha(_: number) {
      return arguments.length ? (mutate as any)((t = +_)) : t;
    },
  });
}

interface D3GlobeMapProps {
  asteroids: Asteroid[];
  selectedAsteroid: Asteroid | null;
  progress: number;
  mapProgress: number; // 0 (Globe) to 100 (Map)
  onMapProgressChange: (val: number) => void;
  impactPoint: { lat: number, lon: number } | null;
}

export function D3GlobeMap({
  asteroids,
  selectedAsteroid,
  progress,
  mapProgress,
  onMapProgressChange,
  impactPoint
}: D3GlobeMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [worldData, setWorldData] = useState<GeoFeature[]>([]);
  const [rotation, setRotation] = useState([0, 0]);
  const [translation] = useState([0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState([0, 0]);

  // Window size for exact canvas fitting (D3 needs explicit px values)
  const [dimensions, setDimensions] = useState({ width: 800, height: 800 });

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
         setDimensions({ width: window.innerWidth, height: window.innerHeight });
      }
    };
    handleResize(); 
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 1. Fetch world topology data
  useEffect(() => {
    const loadWorldData = async () => {
      try {
        const response = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
        const world: any = await response.json();
        const countries = (feature(world, world.objects.countries as any) as any).features;
        setWorldData(countries as GeoFeature[]);
      } catch (error) {
        console.error("Error loading world data:", error);
      }
    };
    loadWorldData();
  }, []);

  // 2. Drag to Rotate Logic
  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse([event.clientX, event.clientY]);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging) return;
    const currentMouse = [event.clientX, event.clientY];
    const dx = currentMouse[0] - lastMouse[0];
    const dy = currentMouse[1] - lastMouse[1];

    const t = mapProgress / 100;

    if (t < 0.5) {
      // Globe mode: 3D rotation sensitivity
      const sensitivity = 0.5;
      setRotation((prev) => [
        prev[0] + dx * sensitivity,
        Math.max(-90, Math.min(90, prev[1] - dy * sensitivity))
      ]);
    } else {
      // Map mode: Equirectangular 2D pan
      const sensitivityMap = 0.25;
      setRotation((prev) => [
        prev[0] + dx * sensitivityMap,
        Math.max(-90, Math.min(90, prev[1] - dy * sensitivityMap))
      ]);
    }
    setLastMouse(currentMouse);
  };

  const handleMouseUp = () => setIsDragging(false);

  // Auto-rotate during simulation
  useEffect(() => {
    if (progress > 0 && progress < 1 && mapProgress < 50) {
       // Spin slightly during flight
       setRotation(r => [r[0] + 0.1, r[1]]);
    }
  }, [progress, mapProgress]);

  // Manual targeting removed directly map based on impactPoint hook


  // 3. Render map via D3
  useEffect(() => {
    if (!svgRef.current || worldData.length === 0) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    
    // Clear everything except base defs
    svg.selectAll(".map-layer").remove();

    const t = mapProgress / 100;
    const alpha = Math.pow(t, 0.5);

    // Scale dynamically based on window size to fill screen
    const minDim = Math.min(width, height);
    const scale = d3.scaleLinear().domain([0, 1]).range([minDim / 2.2, width / 6.5]); 
    const baseRotate = d3.scaleLinear().domain([0, 1]).range([0, 0]);

    const projection = interpolateProjection(d3.geoOrthographicRaw, d3.geoEquirectangularRaw)
      .scale(scale(alpha))
      .translate([width / 2 + translation[0], height / 2 + translation[1]])
      .rotate([baseRotate(alpha) + rotation[0], rotation[1]])
      .precision(0.1);

    projection.alpha(alpha);
    const path = d3.geoPath(projection);

    const mapLayer = svg.append("g").attr("class", "map-layer");

    // A. Ocean/Space Sphere
    try {
      const sphereOutline = path({ type: "Sphere" });
      if (sphereOutline) {
        mapLayer
          .append("path")
          .datum({ type: "Sphere" })
          .attr("d", sphereOutline)
          .attr("fill", "#020513") // Deep ocean color instead of transparent
          .attr("stroke", "#1e293b")
          .attr("stroke-width", 1);
      }
    } catch {}

    // B. Graticule
    try {
      const graticule = d3.geoGraticule();
      mapLayer
        .append("path")
        .datum(graticule())
        .attr("d", path(graticule()))
        .attr("fill", "none")
        .attr("stroke", "#334155")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.3);
    } catch {}

    // C. Countries
    mapLayer
      .selectAll(".country")
      .data(worldData)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", (d) => {
        try {
          const pathString = path(d as any);
          if (typeof pathString === "string" && (pathString.includes("NaN") || pathString.includes("Infinity"))) return "";
          return pathString || "";
        } catch { return ""; }
      })
      .attr("fill", "#0f172a") // Landmass color
      .attr("stroke", "#334155")
      .attr("stroke-width", 1)
      .style("visibility", function () {
        const pd = d3.select(this).attr("d");
        return pd && pd.length > 0 && !pd.includes("NaN") ? "visible" : "hidden";
      });

    // D. Target Marker (Crosshair)
    if (impactPoint) {
       const impactCoords = projection([impactPoint.lon, impactPoint.lat]);
       // Check if coordinates exist and are on the visible side of the globe
       if (impactCoords) {
           const [ix, iy] = impactCoords;
           const pathData = path({type: 'Point', coordinates: [impactPoint.lon, impactPoint.lat]});
           
           if (pathData) {
              const targetG = mapLayer.append("g")
                 .attr("transform", `translate(${ix},${iy})`)
                 .attr("class", progress >= 1 ? "hidden" : "");

              // Crosshair
              targetG.append("circle")
                .attr("r", 8)
                .attr("fill", "none")
                .attr("stroke", "#06b6d4")
                .attr("stroke-width", 2)
                .attr("class", "animate-pulse");

              targetG.append("line").attr("x1", -12).attr("y1", 0).attr("x2", 12).attr("y2", 0).attr("stroke", "#06b6d4").attr("stroke-width", 1);
              targetG.append("line").attr("x1", 0).attr("y1", -12).attr("x2", 0).attr("y2", 12).attr("stroke", "#06b6d4").attr("stroke-width", 1);
           }
       }
    }

    // E. Impact / Blast Rings (Only during/after impact)
    // Needs calculateImpactMetrics which is now separated from this component, but we can do a dummy scaled ring
    if (progress >= 1 && impactPoint) {
      const impactCoords = projection([impactPoint.lon, impactPoint.lat]);
      if (impactCoords && path({type: 'Point', coordinates: [impactPoint.lon, impactPoint.lat]})) {
         const [ix, iy] = impactCoords;
         const epicenter = mapLayer.append("g").attr("transform", `translate(${ix},${iy})`);

         // Ground Zero
         epicenter.append("circle")
           .attr("r", 3)
           .attr("fill", "#ef4444");

         // Fireball Ring (Simplified overlay since metrics are abstracted)
         epicenter.append("circle")
           .attr("r", 15) // Arbitrary scale for visibility
           .attr("fill", "rgba(239, 68, 68, 0.4)")
           .attr("stroke", "#ef4444")
           .attr("stroke-width", 2);

         // Shockwave Ring
         epicenter.append("circle")
           .attr("r", 45)
           .attr("fill", "rgba(234, 179, 8, 0.1)")
           .attr("stroke", "#eab308")
           .attr("stroke-dasharray", "4,4")
           .attr("stroke-width", 1);
      }
    }

    // F. Asteroid Approach Representation
    if (selectedAsteroid && progress > 0 && progress < 1 && impactPoint) {
        const impactProj = projection([impactPoint.lon, impactPoint.lat]);
        if (impactProj) {
           const [ix, iy] = impactProj;
           
           // Trajectory line from top-right down to target
           const startX = width;
           const startY = 0;
           
           const currentX = startX + (ix - startX) * progress;
           const currentY = startY + (iy - startY) * progress;

           // Trail
           mapLayer.append("line")
             .attr("x1", startX)
             .attr("y1", startY)
             .attr("x2", currentX)
             .attr("y2", currentY)
             .attr("stroke", "url(#asteroidTrail)")
             .attr("stroke-width", 3);

           // Asteroid Object
           const isHazardous = selectedAsteroid.is_potentially_hazardous_asteroid;
           mapLayer.append("circle")
             .attr("cx", currentX)
             .attr("cy", currentY)
             .attr("r", isHazardous ? 6 : 4)
             .attr("fill", isHazardous ? "#f97316" : "#22d3ee")
             .attr("stroke", "#ffffff")
             .attr("stroke-width", 1)
             .attr("filter", "drop-shadow(0px 0px 8px rgba(255,255,255,0.8))");
        }
    }

  }, [worldData, progress, rotation, translation, dimensions, mapProgress, impactPoint, selectedAsteroid]);

  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className={`w-full h-full cursor-grab active:cursor-grabbing ${progress >= 1 ? 'pointer-events-none' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
         <defs>
           <linearGradient id="asteroidTrail" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.8" />
           </linearGradient>
         </defs>
      </svg>
      
      {/* 2D/3D Mode Toggle (Only visible after impact or when just inspecting) */}
      <div className="absolute bottom-24 right-4 md:bottom-6 md:right-[480px] z-20">
         <button
           onClick={() => onMapProgressChange(mapProgress === 0 ? 100 : 0)}
           className="bg-zinc-900/80 backdrop-blur border border-zinc-700 text-xs text-white px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors shadow-lg"
         >
           {mapProgress === 0 ? "Unroll to 2D Map" : "Roll to 3D Globe"}
         </button>
      </div>
    </div>
  );
}
