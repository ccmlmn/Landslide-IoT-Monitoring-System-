"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

/** Inject the pulse keyframe animation once into the document. */
function injectPulseStyle() {
  if (typeof document === "undefined") return;
  if (document.getElementById("sensor-map-pulse-style")) return;
  const style = document.createElement("style");
  style.id = "sensor-map-pulse-style";
  style.textContent = `
    @keyframes sensorPulse {
      0%   { transform: scale(1);   opacity: 0.85; }
      100% { transform: scale(3.2); opacity: 0; }
    }
    .sensor-pulse {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2.5px solid currentColor;
      animation: sensorPulse 1.4s ease-out infinite;
      position: absolute;
      top: 18px;
      left: 18px;
      margin-top: -8px;
      margin-left: -8px;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

interface NodeData {
  id: string;
  label: string;
  location: string;
  lat: number;
  lng: number;
  risk: string;
  riskScore?: number;
  tilt?: number;
  soil?: number;
  rain?: number;
  updatedAt?: string;
}

interface SensorMapProps {
  nodes: NodeData[];
}

const RISK_COLOR: Record<string, string> = {
  High: "#ef4444",
  Moderate: "#f59e0b",
  Low: "#22c55e",
  Unknown: "#9ca3af",
};

/** Build the divIcon HTML: pulsing ring + SVG pin. */
function makeMarkerHtml(color: string): string {
  const pin = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48" style="display:block">
      <filter id="dropshadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#00000033"/>
      </filter>
      <path d="M18,2 C9.2,2 2,9.2 2,18 C2,30 18,46 18,46 C18,46 34,30 34,18 C34,9.2 26.8,2 18,2 Z"
            fill="${color}" filter="url(#dropshadow)"/>
      <circle cx="18" cy="18" r="8" fill="white" opacity="0.95"/>
      <circle cx="18" cy="18" r="4" fill="${color}"/>
    </svg>`;
  return `<div style="position:relative;width:36px;height:48px;">
    <div class="sensor-pulse" style="color:${color}"></div>
    ${pin}
  </div>`;
}

/** Build popup HTML for a node. */
function makePopupHtml(node: NodeData, color: string): string {
  return `
    <div style="font-family:sans-serif;min-width:200px;padding:4px 0">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></span>
        <strong style="font-size:14px;color:#111">${node.label}</strong>
        <span style="margin-left:auto;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;
                     background:${color}22;color:${color};border:1px solid ${color}55">
          ${node.risk} Risk
        </span>
      </div>
      <p style="font-size:11px;color:#6b7280;margin:0 0 8px">${node.location}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px">
        <div style="background:#f0fdf4;border-radius:6px;padding:6px;text-align:center">
          <div style="color:#9ca3af;font-size:10px">Rain</div>
          <strong>${node.rain !== undefined ? node.rain.toFixed(1) : "\u2014"}</strong>
        </div>
        <div style="background:#fef3c7;border-radius:6px;padding:6px;text-align:center">
          <div style="color:#9ca3af;font-size:10px">Soil</div>
          <strong>${node.soil !== undefined ? node.soil.toFixed(1) + "%" : "\u2014"}</strong>
        </div>
        <div style="background:#f5f3ff;border-radius:6px;padding:6px;text-align:center">
          <div style="color:#9ca3af;font-size:10px">Tilt</div>
          <strong>${node.tilt !== undefined ? node.tilt.toFixed(1) + "\u00b0" : "\u2014"}</strong>
        </div>
        <div style="background:#fff7ed;border-radius:6px;padding:6px;text-align:center">
          <div style="color:#9ca3af;font-size:10px">Risk Score</div>
          <strong style="color:${color}">${node.riskScore !== undefined ? node.riskScore.toFixed(1) + "%" : "\u2014"}</strong>
        </div>
      </div>
      ${node.updatedAt
        ? `<p style="font-size:10px;color:#d1d5db;margin:8px 0 0;text-align:right">Updated ${node.updatedAt}</p>`
        : ""}
    </div>`;
}

/** Clear and re-draw all markers into a LayerGroup. */
function renderMarkers(L: any, group: any, nodes: NodeData[]) {
  group.clearLayers();
  nodes.forEach((node) => {
    const color = RISK_COLOR[node.risk] ?? RISK_COLOR.Unknown;

    // Static background ring
    L.circle([node.lat, node.lng], {
      radius: 28,
      color,
      fillColor: color,
      fillOpacity: 0.08,
      weight: 1.5,
      opacity: 0.35,
    }).addTo(group);

    const icon = L.divIcon({
      html: makeMarkerHtml(color),
      className: "",
      iconSize: [36, 48],
      iconAnchor: [18, 46],
      popupAnchor: [0, -46],
    });

    const marker = L.marker([node.lat, node.lng], { icon });
    marker.bindPopup(makePopupHtml(node, color), { maxWidth: 240, minWidth: 220 });
    marker.addTo(group);
  });
}

export default function SensorMap({ nodes }: SensorMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  // ── Initialize map once on mount ──────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    injectPulseStyle();

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const avgLat = nodes.reduce((s, n) => s + n.lat, 0) / nodes.length;
      const avgLng = nodes.reduce((s, n) => s + n.lng, 0) / nodes.length;

      const map = L.map(mapRef.current!, {
        center: [avgLat, avgLng],
        zoom: 16,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const group = L.layerGroup().addTo(map);
      layerGroupRef.current = group;
      mapInstanceRef.current = map;

      renderMarkers(L, group, nodes);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerGroupRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-draw markers whenever risk data changes ────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    import("leaflet").then((L) => {
      renderMarkers(L, layerGroupRef.current, nodes);
    });
  }, [nodes]);

  return <div ref={mapRef} className="w-full h-full rounded-b-2xl z-0" />;
}
