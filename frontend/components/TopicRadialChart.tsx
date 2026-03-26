"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { CandidateTopic } from "@/lib/api";
import { TOPIC_COLORS } from "@/lib/topics";
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

  const data = topics.map((t) => ({
    name: t.topic_label,
    value: 1,
    topic: t,
    color: TOPIC_COLORS[t.topic_id] ?? "#4A4A4A",
    hasData: t.stance_score != null,
  }));

  const activeTopic = activeIdx != null ? topics[activeIdx] : null;
  const centerName = activeTopic?.topic_label ?? "Temas";
  const centerScore =
    activeTopic?.stance_score != null
      ? STANCE_LABELS[activeTopic.stance_score] ?? ""
      : "";

  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={110}
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
                  opacity={
                    activeIdx == null
                      ? d.hasData ? 1 : 0.28
                      : i === activeIdx ? 1 : 0.3
                  }
                  style={{ transition: "opacity 0.2s ease" }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label via absolute-positioned div (SVG text within recharts is unreliable) */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="flex flex-col items-center px-6">
            <span
              className="text-sm font-semibold text-center leading-tight"
              style={{ color: "var(--foreground)" }}
            >
              {centerName}
            </span>
            {centerScore && (
              <span
                className="text-xs mt-0.5 text-center"
                style={{ color: "var(--muted)" }}
              >
                {centerScore}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
