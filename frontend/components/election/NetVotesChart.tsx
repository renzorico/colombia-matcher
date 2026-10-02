"use client";

import { CANDIDATE_COLORS, netVotes, topContributors } from "@/lib/election";

const CONTRIBUTORS_PER_SIDE = 5;
const BAR_HEIGHT = 22;

interface NetVotesChartProps {
  formatNumber: (value: number) => string;
}

/**
 * Diverging bars of net votes: the regions that gave each candidate the
 * biggest raw-vote advantage. One shared scale so bars are comparable.
 */
export default function NetVotesChart({ formatNumber }: NetVotesChartProps) {
  const { espriella, cepeda } = topContributors(CONTRIBUTORS_PER_SIDE);
  const max = Math.max(...[...espriella, ...cepeda].map((r) => Math.abs(netVotes(r))));

  const sides = [
    { key: "espriella", label: "De la Espriella", color: CANDIDATE_COLORS.espriella, regions: espriella },
    { key: "cepeda", label: "Cepeda", color: CANDIDATE_COLORS.cepeda, regions: cepeda },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {sides.map((side) => (
        <div key={side.key}>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--foreground)" }}>
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: side.color }} />
            {side.label}
          </p>
          <ul className="flex flex-col gap-2">
            {side.regions.map((region) => {
              const value = Math.abs(netVotes(region));
              return (
                <li key={region.name} title={`${region.name}: +${formatNumber(value)}`}>
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span style={{ color: "var(--foreground)" }}>{region.name}</span>
                    <span className="tabular-nums font-semibold" style={{ color: "var(--foreground)" }}>
                      +{formatNumber(value)}
                    </span>
                  </div>
                  <div className="mt-1 w-full rounded-r" style={{ height: BAR_HEIGHT / 2, backgroundColor: "#f0efec" }}>
                    <div
                      className="h-full rounded-r"
                      style={{ width: `${(value / max) * 100}%`, backgroundColor: side.color }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
