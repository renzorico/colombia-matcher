"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { Result } from "@/lib/api";

// ---------------------------------------------------------------------------
// Label maps (matches the 7 canonical topic IDs used by the backend)
// ---------------------------------------------------------------------------

const TOPIC_SHORT: Record<string, string> = {
  security:           "Seguridad",
  economy:            "Economía",
  health:             "Salud",
  energy_environment: "Medio Amb.",
  fiscal:             "Fiscal",
  foreign_policy:     "Ext.",
  anticorruption:     "Anticor.",
};

const CANDIDATE_COLORS = [
  "#F5C400", // primary yellow — top candidate
  "#1a2e6b", // dark blue
  "#4A6FA5", // blue
  "#C4622D", // accent orange-red
  "#7B5EA7", // purple
  "#5C8A6B", // teal
];

// ---------------------------------------------------------------------------
// Radar — compares top 2 candidates across topics
// ---------------------------------------------------------------------------

function buildRadarData(results: Result[]): Record<string, string | number>[] {
  const top = results.slice(0, 2);
  const topics = Object.keys(top[0]?.breakdown ?? {});
  return topics.map((t) => {
    const row: Record<string, string | number> = { topic: TOPIC_SHORT[t] ?? t };
    for (const r of top) {
      row[r.candidate] = r.breakdown[t] ?? 0;
    }
    return row;
  });
}

// ---------------------------------------------------------------------------
// Bar — all candidates' total score
// ---------------------------------------------------------------------------

function buildBarData(results: Result[]) {
  return results.map((r) => ({ name: r.candidate, score: r.score }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  results: Result[];
}

export default function ResultsCharts({ results }: Props) {
  if (results.length === 0) return null;

  const radarData = buildRadarData(results);
  const barData   = buildBarData(results);
  const top2      = results.slice(0, 2);

  return (
    <div className="w-full max-w-2xl flex flex-col gap-10 mt-8">

      {/* ── RadarChart ─────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
      >
        <h3 className="text-sm font-bold mb-1" style={{ color: "var(--foreground)" }}>
          Afinidad por tema — {top2.length > 1 ? "comparación" : "tu candidato top"}
        </h3>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
          Comparación entre tus dos candidatos más afines
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={radarData} margin={{ top: 35, right: 80, bottom: 25, left: 80 }}>
            <PolarGrid stroke="var(--border)" strokeDasharray="4 4" strokeOpacity={0.5} />
            <PolarAngleAxis
              dataKey="topic"
              tick={{ fill: "var(--foreground)", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
              tickCount={4}
            />
            {top2.map((r, i) => (
              <Radar
                key={r.id}
                name={r.candidate}
                dataKey={r.candidate}
                stroke={CANDIDATE_COLORS[i]}
                fill={CANDIDATE_COLORS[i]}
                fillOpacity={i === 0 ? 0.18 : 0.08}
                strokeWidth={2}
              />
            ))}
            <Legend
              wrapperStyle={{ fontSize: 11, color: "var(--muted)" }}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, ""]}
              contentStyle={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* ── BarChart (horizontal bars) ───────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
      >
        <h3 className="text-sm font-bold mb-4" style={{ color: "var(--foreground)" }}>
          Afinidad total — todos los candidatos
        </h3>
        <ResponsiveContainer width="100%" height={barData.length * 52}>
          <BarChart
            data={barData}
            layout="vertical"
            margin={{ top: 0, right: 48, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "var(--foreground)", fontSize: 11 }}
              width={140}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, "Afinidad"]}
              contentStyle={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="score" radius={[0, 6, 6, 0]} label={{ position: "right", fontSize: 11, formatter: (v: unknown) => `${v}%`, fill: "var(--muted)" }}>
              {barData.map((_, i) => (
                <Cell key={i} fill={CANDIDATE_COLORS[i] ?? "#6B6B6B"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
