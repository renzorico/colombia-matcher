"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CandidateTopic } from "@/lib/api";
import { TOPIC_COLORS } from "@/lib/topics";
import EmptyState from "./EmptyState";

// ---------------------------------------------------------------------------
// Stance labels
// ---------------------------------------------------------------------------

const STANCE_LABELS: Record<number, string> = {
  1: "Muy progresista",
  2: "Centro-izquierda",
  3: "Centro",
  4: "Centro-derecha",
  5: "Muy conservador/a",
};

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

interface TooltipPayloadEntry {
  payload: {
    topic: CandidateTopic;
  };
}

function TopicTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload?.length) return null;
  const t = payload[0].payload.topic;
  const stanceLabel =
    t.stance_score != null ? STANCE_LABELS[t.stance_score] : "Sin datos";
  const raw = t.plain_language_summary ?? t.summary ?? "";
  const truncated = raw.length > 120 ? raw.slice(0, 120) + "…" : raw;

  return (
    <div
      className="rounded-xl px-3 py-2.5 shadow-lg max-w-[220px]"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        fontSize: 12,
      }}
    >
      <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
        {t.topic_label}
      </p>
      <p className="mt-0.5 text-xs font-medium" style={{ color: "var(--muted)" }}>
        {stanceLabel}
      </p>
      {truncated && (
        <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
          {truncated}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TopicRadialChartProps {
  topics: CandidateTopic[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TopicRadialChart({ topics }: TopicRadialChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (topics.length === 0) {
    return (
      <EmptyState message="Aún no hay perfiles temáticos curados para este candidato." />
    );
  }

  const data = topics.map((t) => ({
    name: t.topic_label,
    value: 1, // equal slices — chart shows coverage, not score size
    topic: t,
    color: TOPIC_COLORS[t.topic_id] ?? "#4A4A4A",
    hasData: t.stance_score != null,
  }));

  const activeLabel =
    activeIdx != null ? topics[activeIdx]?.topic_label : "Temas";

  return (
    <div className="flex flex-col gap-5">
      {/* Donut chart */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={112}
              dataKey="value"
              strokeWidth={2}
              stroke="var(--surface)"
              onMouseEnter={(_, idx) => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
            >
              {data.map((d, i) => (
                <Cell
                  key={d.name}
                  fill={d.color}
                  opacity={d.hasData ? 1 : 0.28}
                />
              ))}
            </Pie>
            <Tooltip content={<TopicTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <span
            className="text-sm font-semibold text-center px-6 leading-tight"
            style={{ color: "var(--foreground)" }}
          >
            {activeLabel}
          </span>
        </div>
      </div>

      {/* Legend — 2-column grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 min-w-0">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: d.color, opacity: d.hasData ? 1 : 0.28 }}
            />
            <span
              className="text-xs truncate"
              style={{ color: "var(--muted)" }}
            >
              {d.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
