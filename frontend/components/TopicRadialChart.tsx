"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { CandidateTopic } from "@/lib/api";
import { TOPIC_COLORS, TOPICS } from "@/lib/topics";
import EmptyState from "./EmptyState";

const STANCE_LABELS: Record<number, string> = {
  1: "Muy progresista",
  2: "Centro-izquierda",
  3: "Centro",
  4: "Centro-derecha",
  5: "Muy conservador/a",
};

export interface TopicRadialChartProps {
  topics: CandidateTopic[];
}

export default function TopicRadialChart({ topics }: TopicRadialChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (topics.length === 0) {
    return (
      <EmptyState message="Aún no hay perfiles temáticos curados para este candidato." />
    );
  }

  // Build a lookup from topic_id → CandidateTopic
  const topicMap = new Map<string, CandidateTopic>(
    topics.map((t) => [t.topic_id, t])
  );

  // Use canonical topic order from TOPICS, sized by quiz weight
  const data = TOPICS.map((topicDef) => {
    const t = topicMap.get(topicDef.id);
    return {
      id: topicDef.id,
      name: topicDef.labelEs,
      value: topicDef.quizWeight,
      topic: t ?? null,
      color: TOPIC_COLORS[topicDef.id] ?? "#4A4A4A",
      hasData: t?.stance_score != null,
    };
  });

  const activeEntry = activeIdx != null ? data[activeIdx] : null;
  const activeTopic = activeEntry?.topic ?? null;
  const centerName = activeEntry?.name ?? "Posiciones";
  const centerScore =
    activeTopic?.stance_score != null
      ? STANCE_LABELS[activeTopic.stance_score] ?? `${activeTopic.stance_score}/5`
      : activeEntry != null ? "Sin datos" : "";
  const centerSummary =
    activeTopic?.plain_language_summary ?? activeTopic?.summary ?? null;

  return (
    <div className="flex flex-col gap-4">
      {/* Donut chart */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={112}
              dataKey="value"
              strokeWidth={2}
              stroke="var(--surface)"
              onMouseEnter={(_, idx) => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
              style={{ cursor: "pointer" }}
            >
              {data.map((d, i) => (
                <Cell
                  key={d.id}
                  fill={d.color}
                  opacity={
                    activeIdx == null
                      ? d.hasData ? 1 : 0.3
                      : i === activeIdx ? 1 : 0.25
                  }
                  style={{ transition: "opacity 0.15s ease" }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center px-8 text-center">
            <span
              className="text-sm font-bold leading-tight"
              style={{ color: "var(--foreground)" }}
            >
              {centerName}
            </span>
            {centerScore && (
              <span
                className="text-xs mt-0.5"
                style={{ color: activeEntry?.color ?? "var(--muted)" }}
              >
                {centerScore}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover detail card */}
      {activeIdx != null && activeTopic && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            border: `1px solid ${activeEntry?.color ?? "var(--border)"}`,
            borderLeftWidth: 4,
            backgroundColor: "var(--surface)",
          }}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <span className="font-semibold" style={{ color: "var(--foreground)" }}>
              {centerName}
            </span>
            {activeTopic.stance_score != null && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${activeEntry?.color}18`,
                  color: activeEntry?.color,
                }}
              >
                {centerScore} · {activeTopic.stance_score}/5
              </span>
            )}
          </div>
          {centerSummary && (
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
              {centerSummary.length > 180
                ? centerSummary.slice(0, 180) + "…"
                : centerSummary}
            </p>
          )}
        </div>
      )}

      {/* Legend — 2-column grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {data.map((d) => (
          <div key={d.id} className="flex items-center gap-2 min-w-0">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: d.color, opacity: d.hasData ? 1 : 0.3 }}
            />
            <span
              className="text-xs truncate"
              style={{ color: d.hasData ? "var(--foreground)" : "var(--muted)" }}
            >
              {d.name}
            </span>
            {d.topic?.stance_score != null && (
              <span
                className="text-[10px] font-semibold ml-auto flex-shrink-0"
                style={{ color: d.color }}
              >
                {d.topic.stance_score}/5
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
