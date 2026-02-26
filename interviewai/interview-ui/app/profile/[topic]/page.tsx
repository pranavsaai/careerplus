"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import styles from "../topic.module.css";

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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setWidth((value / 10) * 100), 80);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={styles.skillBarRow}>
      <span className={styles.skillLabel}>{label}</span>
      <div className={styles.skillTrack}>
        <div
          className={styles.skillFill}
          style={{ width: `${width}%`, background: color }}
        />
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
    fetch(`http://13.223.68.160:8080/api/profile/topic-tests/${topic}`,{
      credentials: "include",
    })
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
      {/* Animated background blobs */}
      <div className={styles.bgBlob1} />
      <div className={styles.bgBlob2} />
      <div className={styles.bgBlob3} />

      {/* ── Hero ── */}
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
        <p className={styles.heroSub}>
          Review each attempt, your answers, and targeted feedback.
        </p>

        {/* Stats strip */}
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
              <span className={styles.statVal}>
                {tests.reduce((a, t) => a + (t.questions?.length || 0), 0)}
              </span>
              <span className={styles.statLabel}>Questions</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Grid ── */}
      <div className={`${styles.section} ${styles.grid2}`}>

        {/* Left – attempt list */}
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
                        <span className={styles.attemptQCount}>
                          {test.questions?.length || 0} questions
                        </span>
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

        {/* Right – questions + detail */}
        {selectedTest ? (
          <div className={styles.card}>
            <div className={styles.cardLabel}>{selectedTest.testId}</div>

            {/* Question pills */}
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

            {/* Question detail */}
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
                  </div>
                  <p className={styles.questionText}>{selectedQuestion.question}</p>
                </div>

                {/* Tab nav */}
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
                    <div className={styles.compareGrid}>
                      {/* Your answer */}
                      <div className={`${styles.answerBlock} ${styles.yours}`}>
                        <div className={styles.answerHeader}>
                          <span className={styles.dot} />
                          Your Answer
                        </div>
                        {selectedQuestion.answerType === "VOICE" ? (
                          <div className={styles.answerBody}>
                            <audio controls src={`http://13.223.68.160:8080${selectedQuestion.audioUrl}`} className={styles.audioPlayer} />
                            <div className={styles.transcript}>
                              <span className={styles.transcriptLabel}>Transcript</span>
                              <p>{selectedQuestion.userAnswer}</p>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.answerBody}>{selectedQuestion.userAnswer}</div>
                        )}
                      </div>

                      {/* Ideal answer */}
                      <div className={`${styles.answerBlock} ${styles.ideal}`}>
                        <div className={styles.answerHeader}>
                          <span className={styles.dot} />
                          Ideal Answer
                        </div>
                        <div className={styles.answerBody}>{selectedQuestion.modelAnswer}</div>
                      </div>
                    </div>

                    {/* Voice skill bars */}
                    {selectedQuestion.answerType === "VOICE" && (
                      <div className={styles.skillBox}>
                        <div className={styles.skillBoxTitle}>Voice Skill Breakdown</div>
                        <SkillBar label="Content"  value={selectedQuestion.contentScore}  color="#22d3ee" />
                        <SkillBar label="Grammar"  value={selectedQuestion.grammarScore}  color="#818cf8" />
                        <SkillBar label="Fluency"  value={selectedQuestion.fluencyScore}  color="#34d399" />
                        <SkillBar label="Keyword"  value={selectedQuestion.keywordScore}  color="#f59e0b" />
                        <SkillBar label="Clarity"  value={selectedQuestion.clarityScore}  color="#f472b6" />
                      </div>
                    )}
                  </div>
                )}

                {tab === "feedback" && (
                  <div className={styles.tabContent}>
                    <div className={styles.feedbackBlock}>
                      <div className={styles.feedbackHeader}>
                        <span className={styles.dot} />
                        Feedback
                      </div>
                      <div className={styles.feedbackBody}>{selectedQuestion.feedback}</div>
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
