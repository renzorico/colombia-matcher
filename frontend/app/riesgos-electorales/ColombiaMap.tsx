"use client";

import { useState, useCallback } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { MUNICIPIOS } from "@/lib/riesgo-electoral";

const GEO_URL =
  "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/colombia/colombia-departments.json";

// ── helpers ───────────────────────────────────────────────────────────────────

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[,.]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

interface DeptInfo {
  nImm: number;
  nUrg: number;
  groups: string[];
}

function buildDeptMap(): Record<string, DeptInfo> {
  const map: Record<string, { nImm: number; nUrg: number; groups: Set<string> }> = {};
  for (const m of MUNICIPIOS) {
    const key = normalize(m.departamento);
    if (!map[key]) map[key] = { nImm: 0, nUrg: 0, groups: new Set() };
    if (m.nivel_defensoria === "accion_inmediata") map[key].nImm++;
    else map[key].nUrg++;
    m.grupos_armados.forEach((g) => map[key].groups.add(g));
  }
  return Object.fromEntries(
    Object.entries(map).map(([k, v]) => [k, { ...v, groups: [...v.groups] }])
  );
}

const DEPT_MAP = buildDeptMap();

function getRiskColor(geoName: string): string {
  const data = DEPT_MAP[normalize(geoName)];
  if (!data) return "#E5E7EB";
  if (data.nImm >= 5) return "#DC2626";
  if (data.nImm >= 1) return "#EA580C";
  if (data.nUrg >= 1) return "#CA8A04";
  return "#E5E7EB";
}

function getHoverColor(base: string): string {
  const map: Record<string, string> = {
    "#DC2626": "#B91C1C",
    "#EA580C": "#C2410C",
    "#CA8A04": "#A16207",
    "#E5E7EB": "#D1D5DB",
  };
  return map[base] ?? base;
}

// ── component ─────────────────────────────────────────────────────────────────

interface Tooltip {
  name: string;
  nImm: number;
  nUrg: number;
  groups: string[];
  x: number;
  y: number;
}

export default function ColombiaMap() {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (hovered !== null) {
        setTooltip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
      }
    },
    [hovered]
  );

  const handleGeoEnter = useCallback(
    (name: string, e: React.MouseEvent<SVGPathElement>) => {
      const key = normalize(name);
      const data = DEPT_MAP[key];
      setHovered(name);
      setTooltip({
        name,
        nImm: data?.nImm ?? 0,
        nUrg: data?.nUrg ?? 0,
        groups: data?.groups ?? [],
        x: e.clientX,
        y: e.clientY,
      });
    },
    []
  );

  const handleGeoLeave = useCallback(() => {
    setHovered(null);
    setTooltip(null);
  }, []);

  return (
    <div className="relative select-none" onMouseMove={handleMouseMove}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [-74, 4.5], scale: 1750 }}
        style={{ width: "100%", height: "100%" }}
        height={450}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name: string =
                geo.properties?.NAME_1 ??
                geo.properties?.name ??
                geo.properties?.DPTO_CNMBR ??
                "";
              const base = getRiskColor(name);
              const isHov = hovered === name;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isHov ? getHoverColor(base) : base}
                  stroke="#FFFFFF"
                  strokeWidth={0.6}
                  onMouseEnter={(e) => handleGeoEnter(name, e)}
                  onMouseLeave={handleGeoLeave}
                  style={{
                    default: { outline: "none", cursor: "pointer", transition: "fill 0.15s" },
                    hover:   { outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-3">
        {[
          { color: "#DC2626", label: "≥5 municipios acción inmediata" },
          { color: "#EA580C", label: "1-4 municipios acción inmediata" },
          { color: "#CA8A04", label: "Solo acción urgente" },
          { color: "#E5E7EB", label: "Sin alerta" },
        ].map((item) => (
          <span key={item.color} className="inline-flex items-center gap-1.5 text-xs" style={{ color: "#6B6B6B" }}>
            <span
              className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: item.color, border: "1px solid rgba(0,0,0,0.1)" }}
            />
            {item.label}
          </span>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none rounded-xl px-3 py-2.5 shadow-lg"
          style={{
            position: "fixed",
            left: tooltip.x + 14,
            top: tooltip.y - 14,
            zIndex: 200,
            backgroundColor: "#1A1A1A",
            color: "#FAFAF7",
            maxWidth: 220,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <p className="text-sm font-bold mb-1">{tooltip.name}</p>
          {tooltip.nImm > 0 && (
            <p className="text-xs" style={{ color: "#FCA5A5" }}>
              {tooltip.nImm} municipio{tooltip.nImm !== 1 ? "s" : ""} · Acción Inmediata
            </p>
          )}
          {tooltip.nUrg > 0 && (
            <p className="text-xs" style={{ color: "#FDB98A" }}>
              {tooltip.nUrg} municipio{tooltip.nUrg !== 1 ? "s" : ""} · Acción Urgente
            </p>
          )}
          {tooltip.groups.length > 0 && (
            <p className="text-xs mt-1" style={{ color: "#D1D5DB" }}>
              {tooltip.groups.join(" · ")}
            </p>
          )}
          {tooltip.nImm === 0 && tooltip.nUrg === 0 && (
            <p className="text-xs" style={{ color: "#9CA3AF" }}>Sin municipios en alerta</p>
          )}
        </div>
      )}
    </div>
  );
}
