"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import styles from "../topic.module.css";

// simple markdown renderer — handles bold, code blocks, inline code, bullet points
function Markdown({ text }: { text: string }) {
  if (!text) return <span style={{ color: "#64748b" }}>—</span>;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let codeBlock = false;
  let codeLines: string[] = [];
  let key = 0;

  const renderInline = (line: string) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ color: "#e2e8f0", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i} style={{ background: "rgba(34,211,238,0.1)", color: "#22d3ee", padding: "1px 6px", borderRadius: "4px", fontFamily: "monospace", fontSize: "0.85em" }}>{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (!codeBlock) {
        codeBlock = true;
        codeLines = [];
      } else {
        codeBlock = false;
        elements.push(
          <pre key={key++} style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid #1e293b",
            borderRadius: "8px",
            padding: "12px 16px",
            overflow: "auto",
            fontSize: "0.8rem",
            fontFamily: "monospace",
            color: "#94a3b8",
            margin: "8px 0",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word"
          }}>
            {codeLines.join("\n")}
          </pre>
        );
      }
      continue;
    }

    if (codeBlock) { codeLines.push(line); continue; }

    if (line.startsWith("### ")) {
      elements.push(<h3 key={key++} style={{ color: "#22d3ee", fontSize: "0.9rem", fontWeight: 700, margin: "12px 0 4px", letterSpacing: "0.5px" }}>{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} style={{ color: "#e2e8f0", fontSize: "1rem", fontWeight: 700, margin: "14px 0 6px" }}>{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={key++} style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 800, margin: "16px 0 8px" }}>{line.slice(2)}</h1>);
    } else if (line.match(/^[-*] /)) {
      elements.push(
        <div key={key++} style={{ display: "flex", gap: "8px", margin: "3px 0", paddingLeft: "4px" }}>
          <span style={{ color: "#22d3ee", flexShrink: 0, marginTop: "2px" }}>▸</span>
          <span style={{ color: "#cbd5e1", lineHeight: "1.6" }}>{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={key++} style={{ height: "8px" }} />);
    } else {
      elements.push(
        <p key={key++} style={{ color: "#cbd5e1", lineHeight: "1.7", margin: "4px 0" }}>
          {renderInline(line)}
        </p>
      );
    }
  }

  return <div style={{ fontSize: "0.9rem" }}>{elements}</div>;
}

function ScoreRing({ score, max = 10 }: { score: number; max?: number }) {
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const pct = score / max;
  const color = score >= 7 ? "#34d399" : score >= 4 ? "#818cf8" : "#f87171";
  return (
    <svg width="70" height="70" className={styles.scoreRing}>
      <circle cx="35" cy="35" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
      <circle
        cx="35" cy="35" r={radius} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${circ * pct} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        className={styles.ringAnim}
        style={{ "--ring-color": color } as any}
      />
      <text x="35" y="35" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="13" fontWeight="700" fontFamily="'JetBrains Mono', monospace">
        {score.toFixed(1)}
      </text>
    </svg>
  );
}

function SkillBar({ label, value, color }: { label: string; value: number; color: string }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth((value / 10) * 100), 80);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={styles.skillBarRow}>
      <span className={styles.skillLabel}>{label}</span>
      <div className={styles.skillTrack}>
        <div className={styles.skillFill} style={{ width: `${width}%`, background: color }} />
      </div>
      <span className={styles.skillVal} style={{ color }}>{value}</span>
    </div>
  );
}

export default function TopicDetailPage() {
  const { topic } = useParams();
  const router = useRouter();
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"answer" | "feedback">("answer");
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/profile/topic-tests/${topic}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        const arr = Array.isArray(d) ? d : [];
        setTests(arr);
        setSelectedTest(arr.length > 0 ? arr[0] : null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [topic]);

  const handleSelectTest = (test: any) => {
    setSelectedTest(test);
    setSelectedQuestion(null);
    setTab("answer");
  };

  const handleSelectQuestion = (q: any) => {
    setSelectedQuestion(q);
    setTab("answer");
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
  };

  const scoreColor = (s: number) => s >= 7 ? "#34d399" : s >= 4 ? "#818cf8" : "#f87171";

  return (
    <div className={styles.root}>
      <div className={styles.bgBlob1} />
      <div className={styles.bgBlob2} />
      <div className={styles.bgBlob3} />

      <div className={styles.hero}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <span className={styles.backArrow}>←</span> Back
        </button>
        <div className={styles.pill}>
          <span className={styles.pillDot} />
          Topic Analysis
        </div>
        <h1 className={styles.heroTitle}>
          {decodeURIComponent(topic as string)} <span>Deep Dive</span>
        </h1>
        <p className={styles.heroSub}>Review each attempt, your answers, and targeted feedback.</p>

        {tests.length > 0 && (
          <div className={styles.statsStrip}>
            <div className={styles.statItem}>
              <span className={styles.statVal}>{tests.length}</span>
              <span className={styles.statLabel}>Attempts</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statVal} style={{ color: scoreColor(tests.reduce((a, t) => a + t.averageScore, 0) / tests.length) }}>
                {(tests.reduce((a, t) => a + t.averageScore, 0) / tests.length).toFixed(1)}
              </span>
              <span className={styles.statLabel}>Avg Score</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statVal} style={{ color: "#34d399" }}>
                {Math.max(...tests.map(t => t.averageScore)).toFixed(1)}
              </span>
              <span className={styles.statLabel}>Best</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statVal}>{tests.reduce((a, t) => a + (t.questions?.length || 0), 0)}</span>
              <span className={styles.statLabel}>Questions</span>
            </div>
          </div>
        )}
      </div>

      <div className={`${styles.section} ${styles.grid2}`}>
        {/* Left — test list */}
        <div className={styles.card}>
          <div className={styles.cardLabel}>Tests ({tests.length})</div>
          {loading ? (
            <div className={styles.loadingList}>
              {[1, 2, 3].map(i => <div key={i} className={styles.skeleton} style={{ animationDelay: `${i * 0.1}s` }} />)}
            </div>
          ) : (
            <div className={styles.attemptList}>
              {tests.length === 0 && <div className={styles.empty}>No tests yet.</div>}
              {tests.map((test, i) => {
                const sc = test.averageScore;
                const col = scoreColor(sc);
                const isActive = selectedTest === test;
                return (
                  <button
                    key={i}
                    className={`${styles.attemptBtn} ${isActive ? styles.active : ""}`}
                    onClick={() => handleSelectTest(test)}
                    style={{ "--active-color": col } as any}
                  >
                    <div className={styles.attemptLeft}>
                      <ScoreRing score={sc} />
                      <div className={styles.attemptMeta}>
                        <span className={styles.attemptId}>Test-{i + 1}</span>
                        <span className={styles.attemptQCount}>{test.questions?.length || 0} questions</span>
                      </div>
                    </div>
                    <div className={styles.attemptRight}>
                      {isActive && <span className={styles.activeIndicator}>Viewing</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right — question detail */}
        {selectedTest ? (
          <div className={styles.card}>
            <div className={styles.cardLabel}>{selectedTest.testId}</div>
            <div className={styles.questionPills}>
              {selectedTest.questions.map((q: any, idx: number) => {
                const active = selectedQuestion === q;
                const col = q.score != null ? scoreColor(q.score) : "#94a3b8";
                return (
                  <button
                    key={idx}
                    className={`${styles.qPill} ${active ? styles.qPillActive : ""}`}
                    onClick={() => handleSelectQuestion(q)}
                    style={{ "--pill-color": col } as any}
                  >
                    <span className={styles.qPillDot} style={{ background: col }} />
                    Q{q.questionNumber}
                  </button>
                );
              })}
            </div>

            {selectedQuestion ? (
              <div className={styles.breakdown} ref={detailRef} key={selectedQuestion.questionNumber}>

                {/* Question text */}
                <div className={styles.questionBlock}>
                  <div className={styles.qMeta}>
                    <span className={styles.qBadge}>Question {selectedQuestion.questionNumber}</span>
                    {selectedQuestion.answerType && (
                      <span className={`${styles.typeBadge} ${selectedQuestion.answerType === "VOICE" ? styles.voiceBadge : styles.textBadge}`}>
                        {selectedQuestion.answerType === "VOICE" ? "🎙 Voice" : "✍ Text"}
                      </span>
                    )}
                    {selectedQuestion.score != null && (
                      <span style={{
                        marginLeft: "auto",
                        background: `${scoreColor(selectedQuestion.score)}22`,
                        border: `1px solid ${scoreColor(selectedQuestion.score)}`,
                        color: scoreColor(selectedQuestion.score),
                        padding: "2px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 700
                      }}>
                        {selectedQuestion.score}/10
                      </span>
                    )}
                  </div>
                  <p className={styles.questionText}>{selectedQuestion.question}</p>
                </div>

                {/* Tabs */}
                <div className={styles.tabNav}>
                  <button className={`${styles.tabBtn} ${tab === "answer" ? styles.tabActive : ""}`} onClick={() => setTab("answer")}>
                    Answer Comparison
                  </button>
                  <button className={`${styles.tabBtn} ${tab === "feedback" ? styles.tabActive : ""}`} onClick={() => setTab("feedback")}>
                    Feedback
                    {selectedQuestion.feedback && <span className={styles.tabDot} />}
                  </button>
                </div>

                {tab === "answer" && (
                  <div className={styles.tabContent}>
                    {/* Your Answer */}
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{
                        fontSize: "11px", letterSpacing: "1px", color: "#22d3ee",
                        fontWeight: 700, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px"
                      }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22d3ee", display: "inline-block" }} />
                        YOUR ANSWER
                      </div>
                      <div style={{
                        background: "rgba(34,211,238,0.04)",
                        border: "1px solid rgba(34,211,238,0.15)",
                        borderRadius: "10px",
                        padding: "16px"
                      }}>
                        {selectedQuestion.answerType === "VOICE" ? (
                          <>
                            <audio controls src={`/audio${selectedQuestion.audioUrl?.replace(/^.*\/audio/, "")}`}
                              style={{ width: "100%", marginBottom: "12px", borderRadius: "8px" }} />
                            <Markdown text={selectedQuestion.userAnswer} />
                          </>
                        ) : (
                          <Markdown text={selectedQuestion.userAnswer} />
                        )}
                      </div>
                    </div>

                    {/* Ideal Answer */}
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{
                        fontSize: "11px", letterSpacing: "1px", color: "#34d399",
                        fontWeight: 700, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px"
                      }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
                        IDEAL ANSWER
                      </div>
                      <div style={{
                        background: "rgba(52,211,153,0.04)",
                        border: "1px solid rgba(52,211,153,0.15)",
                        borderRadius: "10px",
                        padding: "16px"
                      }}>
                        <Markdown text={selectedQuestion.modelAnswer} />
                      </div>
                    </div>

                    {/* Voice skill bars */}
                    {selectedQuestion.answerType === "VOICE" && (
                      <div className={styles.skillBox}>
                        <div className={styles.skillBoxTitle}>Voice Skill Breakdown</div>
                        <SkillBar label="Content" value={selectedQuestion.contentScore} color="#22d3ee" />
                        <SkillBar label="Grammar" value={selectedQuestion.grammarScore} color="#818cf8" />
                        <SkillBar label="Fluency" value={selectedQuestion.fluencyScore} color="#34d399" />
                        <SkillBar label="Keyword" value={selectedQuestion.keywordScore} color="#f59e0b" />
                        <SkillBar label="Clarity" value={selectedQuestion.clarityScore} color="#f472b6" />
                      </div>
                    )}
                  </div>
                )}

                {tab === "feedback" && (
                  <div className={styles.tabContent}>
                    <div style={{
                      background: "rgba(244,63,94,0.05)",
                      border: "1px solid rgba(244,63,94,0.2)",
                      borderRadius: "10px",
                      padding: "20px"
                    }}>
                      <div style={{
                        fontSize: "11px", letterSpacing: "1px", color: "#f43f5e",
                        fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px"
                      }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f43f5e", display: "inline-block" }} />
                        FEEDBACK
                      </div>
                      <Markdown text={selectedQuestion.feedback} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.emptyDetail}>
                <div className={styles.emptyIcon}>↑</div>
                <p>Select a question above</p>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.card}>
            <div className={styles.empty}>← Select a test to see questions</div>
          </div>
        )}
      </div>
    </div>
  );
}