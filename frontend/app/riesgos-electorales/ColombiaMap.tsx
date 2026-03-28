"use client";

import { useState, useCallback, useEffect } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { MUNICIPIOS } from "@/lib/riesgo-electoral";

const GEO_URL = "/data/colombia-departments.json";

// Item 10: updated risk labels
const NIVEL_LABELS = {
  accion_inmediata: "Riesgo crítico",
  accion_urgente:   "Riesgo alto",
};
const NIVEL_COLORS = {
  accion_inmediata: "#DC2626",
  accion_urgente:   "#EA580C",
};

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

// The GeoJSON uses "SANTAFE DE BOGOTA D.C" for Bogotá D.C.
const GEO_NAME_ALIASES: Record<string, string> = {
  "santafe de bogota d c": "bogota d c",
};

function normalizeGeoName(s: string): string {
  const n = normalize(s);
  return GEO_NAME_ALIASES[n] ?? n;
}

interface DeptMunicipio {
  nombre: string;
  nivel: "accion_inmediata" | "accion_urgente";
}

interface DeptInfo {
  nImm: number;
  nUrg: number;
  groups: string[];
  municipios: DeptMunicipio[];
}

function buildDeptMap(): Record<string, DeptInfo> {
  const map: Record<
    string,
    { nImm: number; nUrg: number; groups: Set<string>; municipios: DeptMunicipio[] }
  > = {};
  for (const m of MUNICIPIOS) {
    const key = normalize(m.departamento);
    if (!map[key]) map[key] = { nImm: 0, nUrg: 0, groups: new Set(), municipios: [] };
    if (m.nivel_defensoria === "accion_inmediata") map[key].nImm++;
    else map[key].nUrg++;
    m.grupos_armados.forEach((g) => map[key].groups.add(g));
    map[key].municipios.push({ nombre: m.municipio, nivel: m.nivel_defensoria });
  }
  return Object.fromEntries(
    Object.entries(map).map(([k, v]) => [k, { ...v, groups: [...v.groups] }])
  );
}

const DEPT_MAP = buildDeptMap();

function getRiskColor(geoName: string): string {
  const data = DEPT_MAP[normalizeGeoName(geoName)];
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

interface TooltipState {
  name: string;
  nImm: number;
  nUrg: number;
  groups: string[];
  municipios: DeptMunicipio[];
  x: number;
  y: number;
}

export default function ColombiaMap() {
  const [mounted, setMounted] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

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
      const key = normalizeGeoName(name);
      const data = DEPT_MAP[key];
      setHovered(name);
      setTooltip({
        name,
        nImm: data?.nImm ?? 0,
        nUrg: data?.nUrg ?? 0,
        groups: data?.groups ?? [],
        municipios: data?.municipios ?? [],
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

  if (!mounted) {
    return (
      <div
        className="w-full flex items-center justify-center rounded-xl"
        style={{
          minHeight: 480,
          backgroundColor: "var(--border)",
          opacity: 0.3,
        }}
      >
        <span className="text-sm" style={{ color: "var(--muted)" }}>Cargando mapa…</span>
      </div>
    );
  }

  return (
    <div className="relative select-none" onMouseMove={handleMouseMove}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [-74, 4.5], scale: 1750 }}
        style={{ width: "100%", height: "480px", display: "block" }}
        height={480}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name: string =
                geo.properties?.NOMBRE_DPT ??
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
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {[
          { color: "#DC2626", label: "≥5 municipios — riesgo crítico" },
          { color: "#EA580C", label: "1-4 municipios — riesgo crítico" },
          { color: "#CA8A04", label: "Solo riesgo alto" },
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
          className="pointer-events-none rounded-xl px-3 py-3 shadow-lg"
          style={{
            position: "fixed",
            left: tooltip.x + 14,
            top: tooltip.y - 14,
            zIndex: 300,
            backgroundColor: "#1A1A1A",
            color: "#FAFAF7",
            maxWidth: 280,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <p className="text-sm font-bold mb-2">{tooltip.name}</p>

          {tooltip.municipios.length > 0 ? (
            <div className="flex flex-col gap-1.5 mb-2">
              {tooltip.municipios.slice(0, 6).map((m) => (
                <div key={m.nombre} className="flex items-center justify-between gap-2">
                  <span className="text-xs" style={{ color: "#E5E7EB" }}>{m.nombre}</span>
                  <span
                    className="text-xs font-semibold rounded-full px-1.5 py-0.5 whitespace-nowrap flex-shrink-0"
                    style={{ backgroundColor: `${NIVEL_COLORS[m.nivel]}22`, color: NIVEL_COLORS[m.nivel] }}
                  >
                    {NIVEL_LABELS[m.nivel]}
                  </span>
                </div>
              ))}
              {tooltip.municipios.length > 6 && (
                <p className="text-xs" style={{ color: "#9CA3AF" }}>
                  +{tooltip.municipios.length - 6} más
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>Sin municipios en alerta</p>
          )}

          {tooltip.groups.length > 0 && (
            <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
              {tooltip.groups.join(" · ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
