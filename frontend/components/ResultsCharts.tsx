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
  "#2D5016", // dark green
  "#4A6FA5", // blue
  "#C4622D", // accent orange-red
  "#5C8A6B", // teal green
  "#7B5EA7", // purple
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
        <h3 className="text-sm font-bold mb-4" style={{ color: "var(--foreground)" }}>
          Afinidad por tema — {top2.length > 1 ? "comparación" : "tu candidato top"}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="topic"
              tick={{ fill: "var(--muted)", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "var(--muted)", fontSize: 9 }}
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

      {/* ── BarChart ───────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
      >
        <h3 className="text-sm font-bold mb-4" style={{ color: "var(--foreground)" }}>
          Afinidad total — todos los candidatos
        </h3>
        <ResponsiveContainer width="100%" height={results.length * 52 + 20}>
          <BarChart
            layout="vertical"
            data={barData}
            margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
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
              width={130}
              tick={{ fill: "var(--foreground)", fontSize: 12 }}
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
            <Bar dataKey="score" radius={[0, 6, 6, 0]}>
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
