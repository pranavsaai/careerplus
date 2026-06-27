"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import styles from "../topic.module.css";

// ── Markdown renderer — ChatGPT style ──────────────────────────────────────
function Markdown({ text }: { text: string }) {
  if (!text) return <span style={{ color: "#64748b" }}>No content available.</span>;

  // normalize escaped newlines
  const normalized = text.replace(/\\n/g, "\n").replace(/\\t/g, "  ");
  const lines = normalized.split("\n");

  const elements: React.ReactNode[] = [];
  let codeBlock = false;
  let codeLang = "";
  let codeLines: string[] = [];
  let key = 0;

  const renderInline = (line: string) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ color: "#e2e8f0", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return (
          <code key={i} style={{
            background: "rgba(34,211,238,0.12)",
            color: "#22d3ee",
            padding: "1px 6px",
            borderRadius: "4px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.82em",
            border: "1px solid rgba(34,211,238,0.2)"
          }}>{part.slice(1, -1)}</code>
        );
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // code block start/end
    if (line.trim().startsWith("```")) {
      if (!codeBlock) {
        codeBlock = true;
        codeLang = line.trim().slice(3).trim() || "code";
        codeLines = [];
      } else {
        codeBlock = false;
        const lang = codeLang;
        const code = codeLines.join("\n");
        elements.push(
          <div key={key++} style={{ margin: "12px 0", borderRadius: "10px", overflow: "hidden", border: "1px solid #1e293b" }}>
            <div style={{
              background: "#0f172a",
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #1e293b"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#22d3ee", fontSize: "11px" }}>⟨/⟩</span>
                <span style={{ color: "#64748b", fontSize: "11px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "1px" }}>{lang}</span>
              </div>
              <CopyButton text={code} />
            </div>
            <pre style={{
              background: "#0a0f1a",
              padding: "16px",
              margin: 0,
              overflow: "auto",
              fontSize: "0.82rem",
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              color: "#94a3b8",
              lineHeight: "1.6",
              whiteSpace: "pre",
              tabSize: 2
            }}>
              <code>{code}</code>
            </pre>
          </div>
        );
        codeLang = "";
      }
      continue;
    }

    if (codeBlock) { codeLines.push(line); continue; }

    // headings
    if (line.startsWith("### ")) {
      elements.push(<h3 key={key++} style={{ color: "#22d3ee", fontSize: "0.88rem", fontWeight: 700, margin: "14px 0 6px", letterSpacing: "0.5px", textTransform: "uppercase" }}>{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} style={{ color: "#e2e8f0", fontSize: "1rem", fontWeight: 700, margin: "16px 0 8px", borderBottom: "1px solid #1e293b", paddingBottom: "6px" }}>{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={key++} style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 800, margin: "18px 0 10px" }}>{line.slice(2)}</h1>);
    }
    // numbered list
    else if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\. /)?.[1];
      const content = line.replace(/^\d+\. /, "");
      elements.push(
        <div key={key++} style={{ display: "flex", gap: "10px", margin: "4px 0", paddingLeft: "4px", alignItems: "flex-start" }}>
          <span style={{
            color: "#22d3ee", flexShrink: 0, fontWeight: 700, fontSize: "0.85rem",
            background: "rgba(34,211,238,0.1)", width: "22px", height: "22px",
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center"
          }}>{num}</span>
          <span style={{ color: "#cbd5e1", lineHeight: "1.7", paddingTop: "1px" }}>{renderInline(content)}</span>
        </div>
      );
    }
    // bullet list
    else if (line.match(/^[-*•] /)) {
      elements.push(
        <div key={key++} style={{ display: "flex", gap: "10px", margin: "4px 0", paddingLeft: "4px", alignItems: "flex-start" }}>
          <span style={{ color: "#818cf8", flexShrink: 0, marginTop: "8px", fontSize: "6px" }}>●</span>
          <span style={{ color: "#cbd5e1", lineHeight: "1.7" }}>{renderInline(line.slice(2))}</span>
        </div>
      );
    }
    // empty line
    else if (line.trim() === "") {
      elements.push(<div key={key++} style={{ height: "6px" }} />);
    }
    // normal paragraph
    else {
      elements.push(
        <p key={key++} style={{ color: "#cbd5e1", lineHeight: "1.75", margin: "4px 0", fontSize: "0.9rem" }}>
          {renderInline(line)}
        </p>
      );
    }
  }

  return <div style={{ fontSize: "0.9rem" }}>{elements}</div>;
}

// ── Copy button ────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        background: "none", border: "1px solid #1e293b", color: copied ? "#34d399" : "#64748b",
        padding: "2px 10px", borderRadius: "6px", fontSize: "11px", cursor: "pointer",
        transition: "all 0.2s"
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

// ── Collapsible answer block ───────────────────────────────────────────────
function CollapsibleAnswer({
  title, color, dotColor, children, defaultOpen = false
}: {
  title: string; color: string; dotColor: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: "12px", borderRadius: "10px", overflow: "hidden", border: `1px solid ${dotColor}33` }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", background: `${dotColor}0a`, border: "none", cursor: "pointer",
          color: "#e2e8f0"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: dotColor, display: "inline-block" }} />
          <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", color: dotColor }}>{title}</span>
        </div>
        <span style={{ color: dotColor, fontSize: "14px", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: "16px", background: "rgba(0,0,0,0.3)", borderTop: `1px solid ${dotColor}22` }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Score Ring ─────────────────────────────────────────────────────────────
function ScoreRing({ score, max = 10 }: { score: number; max?: number }) {
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const pct = score / max;
  const color = score >= 7 ? "#34d399" : score >= 4 ? "#818cf8" : "#f87171";
  return (
    <svg width="70" height="70" className={styles.scoreRing}>
      <circle cx="35" cy="35" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
      <circle cx="35" cy="35" r={radius} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${circ * pct} ${circ}`} strokeDashoffset={circ * 0.25}
        strokeLinecap="round" className={styles.ringAnim} style={{ "--ring-color": color } as any} />
      <text x="35" y="35" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="13" fontWeight="700" fontFamily="'JetBrains Mono', monospace">
        {score.toFixed(1)}
      </text>
    </svg>
  );
}

// ── Skill Bar ──────────────────────────────────────────────────────────────
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

// ── Main Page ──────────────────────────────────────────────────────────────
export default function TopicDetailPage() {
  const { topic } = useParams();
  const router = useRouter();
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  const scoreColor = (s: number) => s >= 7 ? "#34d399" : s >= 4 ? "#818cf8" : "#f87171";

  const handleSelectQuestion = (q: any) => {
    setSelectedQuestion(q);
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
  };

  return (
    <div className={styles.root}>
      <div className={styles.bgBlob1} /><div className={styles.bgBlob2} /><div className={styles.bgBlob3} />

      {/* Hero */}
      <div className={styles.hero}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <span className={styles.backArrow}>←</span> Back
        </button>
        <div className={styles.pill}><span className={styles.pillDot} />Topic Analysis</div>
        <h1 className={styles.heroTitle}>{decodeURIComponent(topic as string)} <span>Deep Dive</span></h1>
        <p className={styles.heroSub}>Review each attempt, your answers, and targeted feedback.</p>

        {tests.length > 0 && (
          <div className={styles.statsStrip}>
            {[
              { val: tests.length, label: "Attempts" },
              { val: (tests.reduce((a, t) => a + t.averageScore, 0) / tests.length).toFixed(1), label: "Avg Score", color: scoreColor(tests.reduce((a, t) => a + t.averageScore, 0) / tests.length) },
              { val: Math.max(...tests.map(t => t.averageScore)).toFixed(1), label: "Best", color: "#34d399" },
              { val: tests.reduce((a, t) => a + (t.questions?.length || 0), 0), label: "Questions" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && <div className={styles.statDivider} />}
                <div className={styles.statItem}>
                  <span className={styles.statVal} style={s.color ? { color: s.color } : {}}>{s.val}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main grid */}
      <div className={`${styles.section} ${styles.grid2}`}>

        {/* Left — test list */}
        <div className={styles.card}>
          <div className={styles.cardLabel}>Tests ({tests.length})</div>
          {loading ? (
            <div className={styles.loadingList}>
              {[1,2,3].map(i => <div key={i} className={styles.skeleton} style={{ animationDelay: `${i * 0.1}s` }} />)}
            </div>
          ) : (
            <div className={styles.attemptList}>
              {tests.length === 0 && <div className={styles.empty}>No tests yet.</div>}
              {tests.map((test, i) => {
                const sc = test.averageScore;
                const col = scoreColor(sc);
                const isActive = selectedTest === test;
                return (
                  <button key={i}
                    className={`${styles.attemptBtn} ${isActive ? styles.active : ""}`}
                    onClick={() => { setSelectedTest(test); setSelectedQuestion(null); }}
                    style={{ "--active-color": col } as any}
                  >
                    <div className={styles.attemptLeft}>
                      <ScoreRing score={sc} />
                      <div className={styles.attemptMeta}>
                        <span className={styles.attemptId}>Test-{i + 1}</span>
                        <span className={styles.attemptQCount}>{test.questions?.length || 0} questions</span>
                      </div>
                    </div>
                    {isActive && <span className={styles.activeIndicator}>Viewing</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right — questions */}
        {selectedTest ? (
          <div className={styles.card}>
            <div className={styles.cardLabel}>{selectedTest.testId}</div>
            <div className={styles.questionPills}>
              {selectedTest.questions.map((q: any, idx: number) => {
                const active = selectedQuestion === q;
                const col = q.score != null ? scoreColor(q.score) : "#94a3b8";
                return (
                  <button key={idx}
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

                {/* Question + score */}
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
                        padding: "2px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700
                      }}>
                        {selectedQuestion.score}/10
                      </span>
                    )}
                  </div>
                  <p className={styles.questionText}>{selectedQuestion.question}</p>
                </div>

                {/* Your Answer — collapsible */}
                <CollapsibleAnswer title="YOUR ANSWER" dotColor="#22d3ee" color="#22d3ee" defaultOpen={false}>
                  {selectedQuestion.answerType === "VOICE" && selectedQuestion.audioUrl && (
                    <audio controls
                      src={`/audio${selectedQuestion.audioUrl?.replace(/^.*\/audio/, "")}`}
                      style={{ width: "100%", marginBottom: "12px", borderRadius: "8px" }}
                    />
                  )}
                  <Markdown text={selectedQuestion.userAnswer} />
                </CollapsibleAnswer>

                {/* Ideal Answer — collapsible, open by default */}
                <CollapsibleAnswer title="IDEAL ANSWER" dotColor="#34d399" color="#34d399" defaultOpen={true}>
                  <Markdown text={selectedQuestion.modelAnswer} />
                </CollapsibleAnswer>

                {/* Feedback — collapsible */}
                <CollapsibleAnswer title="AI FEEDBACK" dotColor="#f43f5e" color="#f43f5e" defaultOpen={true}>
                  <Markdown text={selectedQuestion.feedback} />
                </CollapsibleAnswer>

                {/* Voice skill bars */}
                {selectedQuestion.answerType === "VOICE" && (
                  <div className={styles.skillBox} style={{ marginTop: "12px" }}>
                    <div className={styles.skillBoxTitle}>Voice Skill Breakdown</div>
                    <SkillBar label="Content" value={selectedQuestion.contentScore} color="#22d3ee" />
                    <SkillBar label="Grammar" value={selectedQuestion.grammarScore} color="#818cf8" />
                    <SkillBar label="Fluency" value={selectedQuestion.fluencyScore} color="#34d399" />
                    <SkillBar label="Keyword" value={selectedQuestion.keywordScore} color="#f59e0b" />
                    <SkillBar label="Clarity" value={selectedQuestion.clarityScore} color="#f472b6" />
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