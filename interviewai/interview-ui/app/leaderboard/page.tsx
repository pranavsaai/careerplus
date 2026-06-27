"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TOPICS = ["Java", "Python", "System Design", "Database", "React", "Docker", "AWS"];

const rankColors = ["#f59e0b", "#94a3b8", "#cd7c4a"];
const rankEmojis = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"global" | "topic">("global");
  const [selectedTopic, setSelectedTopic] = useState("Java");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = activeTab === "global"
      ? "/api/leaderboard/global"
      : `/api/leaderboard/topic/${encodeURIComponent(selectedTopic)}`;

    fetch(url, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeTab, selectedTopic]);

  const scoreColor = (s: number) =>
    s >= 8 ? "#34d399" : s >= 5 ? "#818cf8" : "#f87171";

  return (
    <main style={{
      minHeight: "100vh",
      background: "#05080f",
      color: "#e2e8f0",
      fontFamily: "system-ui, sans-serif",
      padding: "0 0 80px"
    }}>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(180deg, rgba(34,211,238,0.06) 0%, transparent 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "48px 48px 40px",
        maxWidth: "900px",
        margin: "0 auto"
      }}>
        <button onClick={() => router.push("/")} style={{
          background: "none", border: "1px solid rgba(255,255,255,0.1)",
          color: "#64748b", padding: "7px 16px", borderRadius: "99px",
          cursor: "pointer", fontSize: "12px", marginBottom: "28px",
          fontFamily: "monospace", letterSpacing: "1px"
        }}>← HOME</button>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.2)",
          borderRadius: "99px", padding: "6px 16px", fontSize: "11px",
          color: "#22d3ee", fontFamily: "monospace", letterSpacing: "2px",
          marginBottom: "16px"
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22d3ee" }} />
          LIVE RANKINGS
        </div>

        <h1 style={{
          fontSize: "3rem", fontWeight: 800, margin: "0 0 8px",
          background: "linear-gradient(135deg, #f8fafc, #94a3b8)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>
          Leaderboard<span style={{
            background: "linear-gradient(135deg, #22d3ee, #818cf8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>.</span>
        </h1>
        <p style={{ color: "#64748b", fontSize: "1rem", margin: 0 }}>
          Top performers across all interview topics
        </p>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 48px 0" }}>

        {/* Tab switcher */}
        <div style={{
          display: "flex", gap: "4px", background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px",
          padding: "4px", marginBottom: "24px", width: "fit-content"
        }}>
          {["global", "topic"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} style={{
              padding: "8px 20px", borderRadius: "8px", border: "none",
              background: activeTab === tab ? "rgba(255,255,255,0.08)" : "none",
              color: activeTab === tab ? "#e2e8f0" : "#64748b",
              cursor: "pointer", fontSize: "13px", fontWeight: 600,
              fontFamily: "monospace", letterSpacing: "1px", textTransform: "uppercase",
              transition: "all 0.2s"
            }}>
              {tab === "global" ? "🌍 Global" : "📚 By Topic"}
            </button>
          ))}
        </div>

        {/* Topic selector */}
        {activeTab === "topic" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
            {TOPICS.map(t => (
              <button key={t} onClick={() => setSelectedTopic(t)} style={{
                padding: "6px 16px", borderRadius: "99px",
                border: `1px solid ${selectedTopic === t ? "#22d3ee" : "rgba(255,255,255,0.08)"}`,
                background: selectedTopic === t ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.02)",
                color: selectedTopic === t ? "#22d3ee" : "#64748b",
                cursor: "pointer", fontSize: "13px", fontWeight: 600,
                transition: "all 0.2s"
              }}>
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Leaderboard table */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "20px", overflow: "hidden"
        }}>
          {/* Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "60px 1fr 100px 100px 80px",
            padding: "14px 24px",
            background: "rgba(255,255,255,0.03)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            fontSize: "11px", color: "#64748b",
            fontFamily: "monospace", letterSpacing: "1px"
          }}>
            <span>RANK</span>
            <span>PLAYER</span>
            <span style={{ textAlign: "center" }}>AVG SCORE</span>
            <span style={{ textAlign: "center" }}>ATTEMPTS</span>
            <span style={{ textAlign: "center" }}>BEST</span>
          </div>

          {loading ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#64748b", fontFamily: "monospace" }}>
              Loading rankings...
            </div>
          ) : data.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#64748b", fontFamily: "monospace" }}>
              No data yet — be the first! 🚀
            </div>
          ) : (
            data.map((entry, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "60px 1fr 100px 100px 80px",
                padding: "16px 24px",
                borderBottom: i < data.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                background: i === 0 ? "rgba(245,158,11,0.04)" :
                            i === 1 ? "rgba(148,163,184,0.03)" :
                            i === 2 ? "rgba(205,124,74,0.03)" : "transparent",
                alignItems: "center",
                transition: "background 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
              onMouseLeave={e => e.currentTarget.style.background = i === 0 ? "rgba(245,158,11,0.04)" : i === 1 ? "rgba(148,163,184,0.03)" : i === 2 ? "rgba(205,124,74,0.03)" : "transparent"}
              >
                {/* Rank */}
                <div style={{ fontSize: i < 3 ? "1.4rem" : "1rem", fontWeight: 700, color: rankColors[i] || "#64748b", fontFamily: "monospace" }}>
                  {i < 3 ? rankEmojis[i] : `#${entry.rank}`}
                </div>

                {/* Name */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#e2e8f0" }}>
                    {entry.name}
                  </div>
                  {entry.topics && (
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                      {Array.isArray(entry.topics) ? entry.topics.slice(0, 3).join(", ") : ""}
                    </div>
                  )}
                </div>

                {/* Avg Score */}
                <div style={{ textAlign: "center" }}>
                  <span style={{
                    fontSize: "1.1rem", fontWeight: 800, color: scoreColor(entry.avgScore),
                    fontFamily: "monospace"
                  }}>
                    {entry.avgScore}
                  </span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>/10</span>
                </div>

                {/* Attempts */}
                <div style={{ textAlign: "center", color: "#94a3b8", fontFamily: "monospace", fontWeight: 600 }}>
                  {entry.totalAttempts || entry.attempts}
                </div>

                {/* Best */}
                <div style={{ textAlign: "center" }}>
                  {entry.bestScore != null && (
                    <span style={{
                      background: `${scoreColor(entry.bestScore)}22`,
                      border: `1px solid ${scoreColor(entry.bestScore)}`,
                      color: scoreColor(entry.bestScore),
                      padding: "2px 8px", borderRadius: "99px",
                      fontSize: "11px", fontWeight: 700, fontFamily: "monospace"
                    }}>
                      {entry.bestScore}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer note */}
        <p style={{ textAlign: "center", color: "#334155", fontSize: "12px", marginTop: "24px", fontFamily: "monospace" }}>
          Rankings update in real-time · Practice more to climb higher 🚀
        </p>
      </div>
    </main>
  );
}