// DEV ONLY — internal candidate-profile debugger. Not linked from public nav.
// Returns 404 when NODE_ENV is not "development".

import { notFound } from "next/navigation";
import Link from "next/link";
import { getCandidateProfile } from "@/services/profiles";

const CANDIDATES = ["ivan-cepeda", "german-vargas-lleras"];

// Show sources from the last 60 days so the program/older sources are included.
const TIME_WINDOW_DAYS = 60;

export default async function DebugProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();

  const { candidateId: rawId } = await searchParams;
  const candidateId = typeof rawId === "string" ? rawId : "ivan-cepeda";

  const profile = await getCandidateProfile(
    candidateId,
    undefined,
    TIME_WINDOW_DAYS,
  );

  return (
    <main style={{ fontFamily: "monospace", padding: "1.5rem", maxWidth: "960px" }}>
      <h1 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
        🛠 Debug: Candidate Profile{" "}
        <span style={{ color: "#888", fontSize: "0.9rem" }}>(DEV ONLY)</span>
      </h1>

      {/* Candidate switcher */}
      <nav style={{ marginBottom: "1rem", display: "flex", gap: "0.75rem" }}>
        {CANDIDATES.map((id) => (
          <Link
            key={id}
            href={`/debug/profile?candidateId=${id}`}
            style={{
              padding: "0.3rem 0.7rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              textDecoration: "none",
              background: id === candidateId ? "#000" : "#f5f5f5",
              color: id === candidateId ? "#fff" : "#000",
            }}
          >
            {id}
          </Link>
        ))}
      </nav>

      <p style={{ marginBottom: "0.25rem" }}>
        <strong>Candidate:</strong> {candidateId}
      </p>
      <p style={{ marginBottom: "1rem", color: "#555", fontSize: "0.85rem" }}>
        Updated: {profile.updatedAt} · {TIME_WINDOW_DAYS}-day window ·{" "}
        {profile.topicScores.length} topic(s)
      </p>

      {profile.topicScores.length === 0 ? (
        <p style={{ color: "#c00" }}>No topic scores found for this candidate.</p>
      ) : (
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            fontSize: "0.82rem",
          }}
        >
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              {["Topic", "Dimension", "Score", "Confidence", "Evidence URL", "Quote (≤100 chars)"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      border: "1px solid #ddd",
                      padding: "0.4rem 0.6rem",
                      textAlign: "left",
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {profile.topicScores.map((ts) => {
              const ev = ts.evidenceSamples[0];
              const quote = ev
                ? ev.quote.length > 100
                  ? ev.quote.slice(0, 100) + "…"
                  : ev.quote
                : "—";
              return (
                <tr key={`${ts.topic}::${ts.dimension}`}>
                  <td style={cell}>{ts.topic}</td>
                  <td style={cell}>{ts.dimension}</td>
                  <td style={{ ...cell, color: ts.score >= 0 ? "#007700" : "#cc0000" }}>
                    {ts.score.toFixed(1)}
                  </td>
                  <td style={cell}>{ts.confidence.toFixed(2)}</td>
                  <td style={cell}>
                    {ev ? (
                      <a
                        href={ev.url}
                        style={{ color: "#00c", wordBreak: "break-all" }}
                      >
                        {ev.url}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ ...cell, color: "#555" }}>{quote}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}

const cell: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "0.4rem 0.6rem",
  verticalAlign: "top",
};
