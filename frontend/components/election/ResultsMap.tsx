"use client";

import { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import {
  CANDIDATE_COLORS,
  DOMESTIC_REGIONS,
  LEGEND_RAMPS,
  MARGIN_BINS,
  marginColor,
  marginPoints,
  netVotes,
  type RegionResult,
} from "@/lib/election";
import { useLanguage } from "@/lib/i18n";

const GEO_URL = "/data/colombia-departments.json";
// Portrait viewBox that frames mainland Colombia; scales with container width.
const MAP_WIDTH = 520;
const MAP_HEIGHT = 620;
const MAP_MAX_HEIGHT_PX = 560;
const NO_DATA_FILL = "#e5e3df";
const HOVER_STROKE = "#1A1A1A";

interface TooltipState {
  region: RegionResult;
  x: number;
  y: number;
}

interface ResultsMapProps {
  formatNumber: (value: number) => string;
  formatPct: (value: number) => string;
  formatPoints: (value: number) => string;
}

/** Choropleth of the runoff: hue = winner, lightness = margin bin. */
export default function ResultsMap({ formatNumber, formatPct, formatPoints }: ResultsMapProps) {
  const { t } = useLanguage();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const byGeoName = useMemo(
    () => new Map(DOMESTIC_REGIONS.map((r) => [r.geoName ?? "", r])),
    [],
  );

  // A tapped tooltip is position: fixed, so drop it once the page scrolls.
  const hasTooltip = tooltip !== null;
  useEffect(() => {
    if (!hasTooltip) return;
    const close = () => setTooltip(null);
    window.addEventListener("scroll", close, { passive: true, once: true });
    return () => window.removeEventListener("scroll", close);
  }, [hasTooltip]);

  function showTooltip(region: RegionResult, event: React.MouseEvent) {
    setTooltip({ region, x: event.clientX, y: event.clientY });
  }

  return (
    <div className="relative select-none" onMouseLeave={() => setTooltip(null)}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [-73.3, 4.0], scale: 2300 }}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        style={{ width: "100%", height: "auto", maxHeight: MAP_MAX_HEIGHT_PX, display: "block", margin: "0 auto" }}
        aria-label={t.election.mapTitle}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const region = byGeoName.get(geo.properties?.NOMBRE_DPT ?? "");
              const isHovered = region !== undefined && tooltip?.region === region;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={region ? marginColor(marginPoints(region)) : NO_DATA_FILL}
                  stroke={isHovered ? HOVER_STROKE : "#FFFFFF"}
                  strokeWidth={isHovered ? 1.4 : 0.6}
                  onMouseEnter={(e) => region && showTooltip(region, e)}
                  onMouseMove={(e) => region && showTooltip(region, e)}
                  onClick={(e) => region && showTooltip(region, e)}
                  style={{
                    default: { outline: "none", cursor: region ? "pointer" : "default" },
                    hover: { outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      <MapLegend />

      {tooltip && (
        <div
          role="tooltip"
          className="pointer-events-none rounded-xl px-3 py-2.5 shadow-lg"
          style={{
            position: "fixed",
            left: Math.min(tooltip.x + 14, window.innerWidth - 240),
            top: tooltip.y + 14,
            zIndex: 300,
            width: 224,
            backgroundColor: "#1A1A1A",
            color: "#FAFAF7",
          }}
        >
          <p className="text-sm font-bold">{tooltip.region.name}</p>
          <TooltipRow color={CANDIDATE_COLORS.espriella} name="De la Espriella" share={tooltip.region.espriella} formatNumber={formatNumber} formatPct={formatPct} />
          <TooltipRow color={CANDIDATE_COLORS.cepeda} name="Cepeda" share={tooltip.region.cepeda} formatNumber={formatNumber} formatPct={formatPct} />
          <p className="mt-1.5 text-xs" style={{ color: "rgba(250,250,247,0.7)" }}>
            {t.election.tooltipLead}: {formatPoints(Math.abs(marginPoints(tooltip.region)))} {t.election.legendPoints}
            {" · "}
            {formatNumber(Math.abs(netVotes(tooltip.region)))} {t.election.tooltipNet}
          </p>
        </div>
      )}
    </div>
  );
}

function TooltipRow({
  color, name, share, formatNumber, formatPct,
}: {
  color: string;
  name: string;
  share: { votes: number; pct: number };
  formatNumber: (value: number) => string;
  formatPct: (value: number) => string;
}) {
  return (
    <p className="mt-1 flex items-center gap-2 text-xs tabular-nums">
      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      <span className="flex-1">{name}</span>
      <span className="font-semibold">{formatPct(share.pct)}</span>
      <span style={{ color: "rgba(250,250,247,0.7)" }}>{formatNumber(share.votes)}</span>
    </p>
  );
}

function MapLegend() {
  const { t } = useLanguage();
  const arms = [
    { label: t.election.legendCepeda, ramp: [...LEGEND_RAMPS.cepeda].reverse(), bins: [...MARGIN_BINS].reverse() },
    { label: t.election.legendEspriella, ramp: [...LEGEND_RAMPS.espriella], bins: [...MARGIN_BINS] },
  ];
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-x-8 gap-y-3">
      {arms.map((arm) => (
        <div key={arm.label} className="flex flex-col items-center gap-1">
          <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
            {arm.label}
          </span>
          <div className="flex gap-[2px]">
            {arm.ramp.map((color, i) => (
              <div key={color} className="flex flex-col items-center">
                <span className="block h-3 w-10" style={{ backgroundColor: color }} />
                <span className="mt-0.5 text-[10px] tabular-nums" style={{ color: "var(--muted)" }}>
                  {arm.bins[i].label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <span className="self-end pb-3 text-[10px]" style={{ color: "var(--muted)" }}>
        {t.election.legendPoints}
      </span>
    </div>
  );
}
