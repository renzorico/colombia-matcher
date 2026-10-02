"use client";

import { useState } from "react";
import { CANDIDATE_COLORS, REGIONS, marginPoints, type RegionResult } from "@/lib/election";
import { useLanguage } from "@/lib/i18n";

const COLLAPSED_ROWS = 10;

type SortKey = "margin" | "votes";

interface RegionTableProps {
  formatNumber: (value: number) => string;
  formatPct: (value: number) => string;
  formatPoints: (value: number) => string;
}

const SORTERS: Record<SortKey, (a: RegionResult, b: RegionResult) => number> = {
  margin: (a, b) => marginPoints(b) - marginPoints(a),
  votes: (a, b) => b.valid - a.valid,
};

/** Every region with a split bar of the two candidates' shares. */
export default function RegionTable({ formatNumber, formatPct, formatPoints }: RegionTableProps) {
  const { t } = useLanguage();
  const [sortKey, setSortKey] = useState<SortKey>("votes");
  const [expanded, setExpanded] = useState(false);

  const rows = [...REGIONS].sort(SORTERS[sortKey]);
  const visible = expanded ? rows : rows.slice(0, COLLAPSED_ROWS);

  return (
    <div>
      <div className="mb-3 flex gap-2" role="group">
        {(["votes", "margin"] as SortKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSortKey(key)}
            aria-pressed={sortKey === key}
            className="rounded-full px-3 py-1 text-xs font-medium transition"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: sortKey === key ? "var(--foreground)" : "var(--surface)",
              color: sortKey === key ? "var(--surface)" : "var(--foreground)",
            }}
          >
            {key === "votes" ? t.election.tableSortVotes : t.election.tableSortMargin}
          </button>
        ))}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs" style={{ color: "var(--muted)" }}>
            <th className="pb-2 font-medium">{t.election.tableRegion}</th>
            <th className="pb-2 font-medium hidden sm:table-cell">De la Espriella · Cepeda</th>
            <th className="pb-2 text-right font-medium">{t.election.tableLead}</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((region) => {
            const lead = marginPoints(region);
            const leader = lead >= 0 ? CANDIDATE_COLORS.espriella : CANDIDATE_COLORS.cepeda;
            return (
              <tr key={region.name} style={{ borderTop: "1px solid var(--border)" }}>
                <td className="py-2 pr-3 align-top">
                  <span className="font-medium" style={{ color: "var(--foreground)" }}>
                    {region.name}
                    {region.abroad && <span aria-hidden="true"> *</span>}
                  </span>
                  <span className="block text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                    {formatNumber(region.valid)} {t.election.votesUnit}
                  </span>
                  <SplitBar region={region} formatPct={formatPct} className="mt-1.5 sm:hidden" />
                </td>
                <td className="py-2 pr-3 align-middle hidden sm:table-cell" style={{ width: "50%" }}>
                  <SplitBar region={region} formatPct={formatPct} />
                </td>
                <td className="py-2 text-right align-top tabular-nums whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: "var(--foreground)" }}>
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: leader }} aria-hidden="true" />
                    +{formatPoints(Math.abs(lead))}
                  </span>
                  <span className="block text-xs" style={{ color: "var(--muted)" }}>
                    {lead >= 0 ? "De la Espriella" : "Cepeda"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs" style={{ color: "var(--muted)" }}>* {t.election.tableAbroadNote}</p>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-xs font-semibold underline underline-offset-2"
          style={{ color: "var(--secondary)" }}
        >
          {expanded ? t.election.showLess : t.election.showAll}
        </button>
      </div>
    </div>
  );
}

function SplitBar({
  region, formatPct, className = "",
}: {
  region: RegionResult;
  formatPct: (value: number) => string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-sm">
        <span style={{ flex: `${region.espriella.pct} 1 0`, backgroundColor: CANDIDATE_COLORS.espriella }} />
        <span style={{ flex: `${region.blank.pct} 1 0`, backgroundColor: "#d6d4cf" }} />
        <span style={{ flex: `${region.cepeda.pct} 1 0`, backgroundColor: CANDIDATE_COLORS.cepeda }} />
      </div>
      <div className="mt-0.5 flex justify-between text-[11px] tabular-nums" style={{ color: "var(--muted)" }}>
        <span>{formatPct(region.espriella.pct)}</span>
        <span>{formatPct(region.cepeda.pct)}</span>
      </div>
    </div>
  );
}
