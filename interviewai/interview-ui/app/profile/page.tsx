"use client";

import { useEffect, useState } from "react";
import styles from "../profile.module.css";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTooltip}>
      <div className={styles.chartTooltipLabel}>{label}</div>
      <div className={styles.chartTooltipValue}>{payload[0].value}</div>
    </div>
  );
};

/* ── Accuracy Ring ── */
function Ring({ correct, wrong }: { correct: number; wrong: number }) {
  const total = correct + wrong || 1;
  const pct = Math.round((correct / total) * 100);
  const r = 56;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className={styles.accuracyWrap}>
      <div className={styles.ringWrap}>
        <svg className={styles.ringSvg} width="140" height="140">
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
          <circle
            cx="70" cy="70" r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="10"
          />
          <circle
            cx="70" cy="70" r={r}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="10"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
          />
        </svg>
        <div className={styles.ringLabel}>
          <span className={styles.ringPct}>{pct}%</span>
          <span className={styles.ringSub}>accuracy</span>
        </div>
      </div>

      <div className={styles.accuracyLegend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#34d399" }} />
          Correct
          <span className={styles.legendNum}>{correct}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#f43f5e" }} />
          Wrong
          <span className={styles.legendNum}>{wrong}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#64748b" }} />
          Total
          <span className={styles.legendNum}>{total}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function ProfilePage() {
  const [summary, setSummary]   = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [accuracy, setAccuracy] = useState<any>(null);
  const [skills, setSkills]     = useState<any>(null);
  const router = useRouter();
  const [topics, setTopics]     = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topicAttempts, setTopicAttempts] = useState<any[]>([]);
  const fetchTopicDetails = async (topic: string) => {
  setSelectedTopic(topic);

  const res = await fetch(
    `http://localhost:8080/api/profile/topic-details/${topic}`, {
      credentials: "include",
    }
  );

  const data = await res.json();
  setTopicAttempts(data);
};

  useEffect(() => {
    const base = "http://localhost:8080/api/profile";

    const load = async () => {
      try {
        const fetchWithAuth = async (url: string) => {
          const res = await fetch(url, {
            credentials: "include",
          });

          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              router.push("/login");   // 🔥 redirect if not authenticated
              throw new Error("Unauthorized");
            }
            throw new Error("Request failed");
          }

          return res.json();
        };

        const [s, p, a, sk, t] = await Promise.all([
          fetchWithAuth(`${base}/summary`),
          fetchWithAuth(`${base}/progress`),
          fetchWithAuth(`${base}/accuracy`),
          fetchWithAuth(`${base}/skill-breakdown`),
          fetchWithAuth(`${base}/topic-analysis`),
        ]);

        setSummary(s);
        setProgress(p);
        setAccuracy(a);
        setSkills(sk);
        setTopics(t);

      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, [router]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const radarData = skills
    ? Object.entries(skills).map(([k, v]) => ({ skill: k, score: Number(v ?? 0) }))
    : [];

  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <button
        className={styles["back-btn"]}
        onClick={() => router.push("/")}
        aria-label="Back to home page"
        title="Back to home page"
      >
        ← Back to Home
      </button>
        <div className={styles.pill}>
          <span className={styles.pillDot} />
          Profile Dashboard
        </div>
        <h1 className={styles.heroTitle}>
          Your <span>Progress</span>
        </h1>
        <p className={styles.heroSub}>
          Track your interview performance and uncover areas of growth.
        </p>
      </div>
      {summary && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Attempts</div>
            <div className={`${styles.statValue} ${styles.accent}`}>
              {summary.totalAttempts}
            </div>
            <div className={styles.statSub}>all-time sessions</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Avg Text Score</div>
            <div className={`${styles.statValue} ${styles.accent2}`}>
              {(summary.avgTextScore ?? 0).toFixed(1)}
            </div>
            <div className={styles.statSub}>out of 10.0</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Avg Voice Score</div>
            <div className={`${styles.statValue} ${styles.accent3}`}>
              {(summary.avgVoiceScore ?? 0).toFixed(1)}
            </div>
            <div className={styles.statSub}>out of 10.0</div>
          </div>
        </div>
      )}
      <div className={styles.grid2}>
        {progress.length > 0 && (
          <div className={styles.card}>
            <div className={styles.cardLabel}>Performance Over Time</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={progress.map(p => ({ ...p, date: formatDate(p.date) }))}
              >
                <defs>
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#64748b", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="url(#lineGrad)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#22d3ee", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#818cf8" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Accuracy Ring */}
        {accuracy && (
          <div className={styles.card}>
            <div className={styles.cardLabel}>Accuracy Breakdown</div>
            <Ring correct={accuracy.correct} wrong={accuracy.wrong} />
          </div>
        )}
      </div>

      {/* ── Skills ── */}
      {skills && (
        <div className={styles.grid2}>

          {/* Bar breakdown */}
          <div className={styles.card}>
            <div className={styles.cardLabel}>Skill Scores</div>
            {Object.entries(skills).map(([key, val]) => {
              const score = Number(val ?? 0);
              return (
                <div className={styles.skillRow} key={key}>
                  <span className={styles.skillName}>{key}</span>
                  <div className={styles.skillBarWrap}>
                    <div
                      className={styles.skillBarFill}
                      style={{ width: `${(score / 10) * 100}%` }}
                    />
                  </div>
                  <span className={styles.skillScore}>{score.toFixed(1)}</span>
                </div>
              );
            })}
          </div>

          {/* Radar */}
          {radarData.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardLabel}>Skill Radar</div>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                  <PolarGrid stroke="rgba(255,255,255,0.07)" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: "#64748b", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#22d3ee"
                    fill="#22d3ee"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── Topic Performance ── */}
      {topics.length > 0 && (
        <div className={styles.gridFull}>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Topic Performance</div>
            <div className={styles.topicsGrid}>
              {topics.map((t, i) => (
                <div
                  className={styles.topicCard}
                  key={i}
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles.topicName}>{t.topic}</div>
                  <div className={styles.topicScoreBar}>
                    <div
                      className={styles.topicScoreFill}
                      style={{ width: `${((t.avgScore ?? 0) / 10) * 100}%` }}
                    />
                  </div>
                  <div className={styles.topicMetaRow}>
                    <div className={styles.topicMetaItem}>
                      Avg Score
                      <strong>{(t.avgScore ?? 0).toFixed(1)}</strong>
                    </div>
                    <div className={styles.topicMetaItem} style={{ textAlign: "right" }}>
                      Attempts
                      <strong>{t.attempts}</strong>
                    </div>
                  </div>
                  <button
                    className={styles.viewDetailsBtn}
                    onClick={() => router.push(`/profile/${t.topic}`)}
                  >
                  <span>View Detailed Analysis</span>
                  <span className={styles.arrow}>→</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {selectedTopic && topicAttempts.length > 0 && (
      <div className={styles.gridFull}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>
            {selectedTopic} – Detailed Analysis
          </div>

          {topicAttempts.map((a, index) => (
            <div key={index} style={{ marginBottom: "24px" }}>
              
              <div style={{ fontWeight: 600, marginBottom: "6px" }}>
                Question:
              </div>
              <div style={{ marginBottom: "10px" }}>
                {a.question}
              </div>

              <div style={{ fontWeight: 600, marginBottom: "6px" }}>
                Your Answer:
              </div>
              <div style={{ marginBottom: "10px", color: "#94a3b8" }}>
                {a.userAnswer}
              </div>

              <div style={{ fontWeight: 600, marginBottom: "6px" }}>
                Ideal Interview Answer:
              </div>
              <div style={{ marginBottom: "10px", color: "#22d3ee" }}>
                {a.modelAnswer}
              </div>

              <div style={{ fontWeight: 600, marginBottom: "6px" }}>
                Feedback:
              </div>
              <div style={{ color: "#f43f5e" }}>
                {a.feedback}
              </div>

              <hr style={{ marginTop: "18px", opacity: 0.2 }} />
            </div>
          ))}
        </div>
      </div>
    )}
    </div>
  );
}