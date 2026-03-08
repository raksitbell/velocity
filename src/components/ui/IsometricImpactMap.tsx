"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface IsometricImpactMapProps {
  lat: number;
  lon: number;
  isWater: boolean;
  fireballKm?: number;
  evacuKm?: number;
}

export function IsometricImpactMap({ lat, lon, isWater, fireballKm = 50, evacuKm = 200 }: IsometricImpactMapProps) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const initDone    = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Fix Leaflet icon paths in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      // If map already exists, fly to new coordinates and update circles
      if (instanceRef.current) {
        instanceRef.current.flyTo([lat, lon], 3, { duration: 1.2 });
        return;
      }

      // Clean up leftover leaflet state from React strict-mode double mount
      const el = mapRef.current as any;
      if (el && el._leaflet_id) el._leaflet_id = null;

      const map = L.map(mapRef.current as HTMLElement, {
        center: [lat, lon],
        zoom: 3,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
        dragging: true,
      });

      // Zoom control — bottomright so it doesn't clash with the label overlay
      L.control.zoom({ position: "bottomright" }).addTo(map);

      instanceRef.current = map;

      // Dark satellite-style basemap (CartoDB Dark Matter)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      // Ground zero marker (custom dot, not the default pin)
      const groundZeroIcon = L.divIcon({
        className: "",
        html: `<div style="width:12px;height:12px;background:red;border-radius:50%;border:2px solid white;box-shadow:0 0 12px 4px rgba(239,68,68,0.7)"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      L.marker([lat, lon], { icon: groundZeroIcon }).addTo(map);

      // Fireball ring (red inner)
      L.circle([lat, lon], {
        color: "#ef4444",
        fillColor: "#ef4444",
        fillOpacity: 0.25,
        weight: 2,
        radius: (fireballKm || 50) * 1000,
      }).addTo(map);

      // Shockwave / evacuation ring (cyan outer)
      L.circle([lat, lon], {
        color: "#22d3ee",
        fillColor: "#22d3ee",
        fillOpacity: 0.08,
        weight: 2,
        radius: (evacuKm || 200) * 1000,
        dashArray: "6 4",
      }).addTo(map);

      // Force map to recognize its container size
      setTimeout(() => map.invalidateSize(), 150);
    };

    if (!initDone.current) {
      initDone.current = true;
      initMap();
    } else if (instanceRef.current) {
      // On re-render (e.g. coords changed), fly to new center
      instanceRef.current.flyTo([lat, lon], 8, { duration: 1.2 });
    }

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
        initDone.current = false;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon]);

  return (
    <div className="relative w-full h-56 rounded-xl overflow-hidden border border-red-500/30 bg-zinc-900">
      {/* Leaflet map fills the whole container */}
      <div ref={mapRef} className="absolute inset-0 z-10" />

      {/* Dark vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)] z-20 pointer-events-none" />
    </div>
  );
}
