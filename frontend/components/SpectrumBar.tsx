"use client";

import { useState } from "react";
import { SPECTRUM_TOOLTIPS } from "@/lib/spectrumTooltips";

const SPECTRUM_POSITIONS: Record<string, number> = {
  left: 0,
  "center-left": 25,
  center: 50,
  "center-right": 75,
  right: 100,
  "far-right": 100,
};

export const SPECTRUM_LABELS: Record<string, string> = {
  left:           "Izquierda",
  "center-left":  "Centro-izquierda",
  center:         "Centro",
  "center-right": "Centro-derecha",
  right:          "Derecha",
  "far-right":    "Derecha radical",
};

export function SpectrumBar({
  spectrum,
  candidateId,
}: {
  spectrum: string;
  candidateId?: string;
}) {
  const pct   = SPECTRUM_POSITIONS[spectrum] ?? 50;
  const label = SPECTRUM_LABELS[spectrum]    ?? spectrum;
  const tip   = candidateId ? SPECTRUM_TOOLTIPS[candidateId] : undefined;

  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="flex flex-col gap-1 w-full relative"
      onMouseEnter={() => tip && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => {
        if (!tip) return;
        e.stopPropagation();
        setShowTooltip((v) => !v);
      }}
      style={{ cursor: tip ? "help" : "default" }}
    >
      {/* Tooltip card */}
      {tip && showTooltip && (
        <div
          className="absolute bottom-full mb-2 left-0 z-50 rounded-xl shadow-lg p-3"
          style={{
            backgroundColor: "#fff",
            border: "1px solid var(--border)",
            maxWidth: "280px",
            minWidth: "200px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.13)",
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs font-bold mb-1" style={{ color: "var(--foreground)" }}>
            {tip.name} · <span style={{ color: "var(--secondary)" }}>{label}</span>
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
            {tip.text}
          </p>
        </div>
      )}

      {/* Track + dot */}
      <div
        className="relative h-1 rounded-full"
        style={{
          background: "linear-gradient(to right, #CBD5E0, #A0AEC0, #CBD5E0)",
        }}
      >
        {/* Position dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
          style={{
            width: 10,
            height: 10,
            left: `calc(${pct}% - 5px)`,
            backgroundColor: "#1A1A1A",
          }}
        />
      </div>

      {/* 3 tick labels */}
      <div className="flex justify-between text-[9px]" style={{ color: "var(--muted)" }}>
        <span>Izquierda</span>
        <span>Centro</span>
        <span>Derecha</span>
      </div>
    </div>
  );
}
