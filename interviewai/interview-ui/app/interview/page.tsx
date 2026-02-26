"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "../interview.module.css";
import ParticleBackground from "../components/ParticleBackground";

export default function InterviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryTopic = searchParams.get("topic") || "Java";

  const [topic, setTopic] = useState(queryTopic);
  const [difficulty, setDifficulty] = useState("Easy");

  const [testStarted, setTestStarted] = useState(false);
  const [testId, setTestId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentQuestionId, setCurrentQuestionId] = useState("");

  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState<number | null>(null);

  const [secondsSpent, setSecondsSpent] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const [testResults, setTestResults] = useState<any[]>([]);
  const [testEnded, setTestEnded] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState(0);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceScores, setVoiceScores] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && testStarted && !testEnded) {
      interval = setInterval(() => setSecondsSpent(p => p + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timerActive, testStarted, testEnded]);

  const startTest = async () => {
    if (!topic.trim()) { alert("Please enter a topic."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ topic, difficulty }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTestId(data.testId || data.questionId || `temp-${Date.now()}`);
      setCurrentQuestion(data.question || "");
      setCurrentQuestionId(data.questionId || "");
      setTestStarted(true);
      setTimerActive(true);
      setSecondsSpent(0);
      setAnswer(""); setFeedback(""); setScore(null);
      setVoiceTranscript(""); setVoiceScores(null);
      setTestResults([]); setTestEnded(false);
    } catch { alert("Error starting test."); }
    setLoading(false);
  };

  const canProceed = answer.trim().length > 0 || !!voiceScores?.overallScore;

  const saveAndNext = async () => {
    if (!currentQuestionId || !canProceed) {
      alert("Please provide an answer (text or voice) before continuing.");
      return;
    }

    setLoading(true);

    try {
      let submittedAnswer = answer;
      let submittedScore = score;
      let submittedFeedback = feedback;
      if (!answer.trim() && voiceTranscript && voiceScores) {
        submittedAnswer = voiceTranscript;
        submittedScore = voiceScores.overallScore;
        submittedFeedback = voiceScores.feedback || "Voice-based evaluation";
      }

      const res = await fetch("/api/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
        questionId: currentQuestionId,
        answer: submittedAnswer,
        testId: testId,
        questionNumber: testResults.length + 1
      })
      });

      if (!res.ok) throw new Error("Failed to save answer");

      const data = await res.json();

      setTestResults(prev => [...prev, {
        question: currentQuestion,
        userAnswer: submittedAnswer,
        score: submittedScore ?? data.score,
        feedback: submittedFeedback ?? data.feedback,
        timeSpent: secondsSpent,
      }]);

      setAnswer("");
      setFeedback("");
      setScore(null);
      setVoiceTranscript("");
      setVoiceScores(null);
      setSecondsSpent(0);
      const nextRes = await fetch("/api/interview/start", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty }),
      });
      const nextData = await nextRes.json();

      setCurrentQuestion(nextData.question || "");
      setCurrentQuestionId(nextData.questionId || "");
      setTimerActive(true);

    } catch (err) {
      console.error(err);
      alert("Error saving or loading next question.");
    }
    setLoading(false);
  };

  const stopTest = async () => {
  setTimerActive(false);
  setLoading(true);

  try {
    let avg = 0;
    let totalSec = 0;

    if (testResults.length > 0) {
      avg = testResults.reduce((s, r) => s + (r.score || 0), 0) / testResults.length;
      totalSec = testResults.reduce((s, r) => s + (r.timeSpent || 0), 0);
    }

    const finalAvg = Math.round(avg * 10) / 10;

    setFinalScore(finalAvg);
    setTotalTime(totalSec);

    await fetch("/api/interview/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        topic,
        difficulty,
        averageScore: finalAvg,
        totalTime: totalSec,
        questions: testResults,
      }),
    });

    setTestEnded(true);
    setTestStarted(false);

  } catch {
    alert("Error ending test.");
  }

  setLoading(false);
};


  const startRecording = async () => {
    if (!currentQuestion) { alert("Please generate a question first."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      let chunks: BlobPart[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = async () => {
        if (!chunks.length) return;
        const blob = new Blob(chunks, { type: "audio/wav" });
        if (blob.size < 5000) { alert("No voice detected."); return; }
        const formData = new FormData();
        formData.append("file", blob, "voice.wav");
        formData.append("questionId", currentQuestionId);
        formData.append("testId", testId as string);
        formData.append("questionNumber", String(testResults.length + 1));

        const res = await fetch("/api/interview/voice", { method: "POST", body: formData, credentials: "include"});
        const data = await res.json();
        if (!res.ok) { alert(data.error || "Voice evaluation failed"); return; }
        setVoiceTranscript(data.transcript);
        setVoiceScores(data);
        if (!answer.trim()) setAnswer(data.transcript);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch { alert("Microphone access denied."); }
  };

  const stopRecording = () => { mediaRecorder?.stop(); setIsRecording(false); };

  const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

  const scoreLevel = (s: number) => s >= 8 ? "Good" : s >= 5 ? "Medium" : "Bad";
  const scoreLabel = (s: number) => s >= 8 ? "Excellent" : s >= 5 ? "Solid" : "Needs Work";

  const diffClass: Record<string, string> = {
    Easy: styles.diffEasy, Medium: styles.diffMedium, Hard: styles.diffHard,
  };

  const timerClass = secondsSpent > 300 ? styles.danger : secondsSpent > 180 ? styles.warning : "";

  if (testEnded) {
    return (
      <main className={styles.page}>
        <ParticleBackground />

        <button className={styles.backBtn} onClick={() => router.push("/")}>← Home</button>

        <div className={styles.tag}>Session Complete</div>
        <h1 className={styles.pageTitle}>Results<span>.</span></h1>

        <div className={styles.card}>
          <div className={styles.summaryHero}>
            <div className={styles.summaryScore}>
              {finalScore !== null ? finalScore.toFixed(1) : "—"}<span style={{ fontSize: "2rem", opacity: .4 }}>/10</span>
            </div>
            <div className={styles.summarySubtitle}>Average Score</div>

            <div className={styles.summaryMeta}>
              <div className={styles.summaryMetaItem}>
                <div className={styles.summaryMetaVal}>{testResults.length}</div>
                <div className={styles.summaryMetaLbl}>Questions</div>
              </div>
              <div className={styles.summaryMetaItem}>
                <div className={styles.summaryMetaVal}>{fmt(totalTime)}</div>
                <div className={styles.summaryMetaLbl}>Total Time</div>
              </div>
              <div className={styles.summaryMetaItem}>
                <div className={styles.summaryMetaVal}>
                  {testResults.filter(r => r.score >= 8).length}
                </div>
                <div className={styles.summaryMetaLbl}>Excellent</div>
              </div>
            </div>
          </div>

          <hr className={styles.divider} />

          {/* Per-question breakdown */}
          <div className={styles.cardLabel}>Question Breakdown</div>
          <div className={styles.resultsList}>
            {testResults.map((r, i) => {
              const lvl = scoreLevel(r.score);
              return (
                <div className={styles.resultItem} key={i}>
                  <div className={styles.resultHeader}>
                    <p className={styles.resultQuestion}>Q{i + 1}: {r.question}</p>
                    <span className={`${styles.resultScore} ${styles[`resultScore${lvl}`]}`}>
                      {r.score}/10
                    </span>
                  </div>
                  <div className={styles.resultMeta}>
                    <span className={styles.resultMetaChip}>⏱ {fmt(r.timeSpent)}</span>
                    <span className={styles.resultMetaChip}>{scoreLabel(r.score)}</span>
                  </div>
                  <p className={styles.resultFeedback}>{r.feedback}</p>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <button className={styles.btnPrimary} onClick={() => router.push("/profile")}>
              View Full Progress →
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <ParticleBackground />

      <button className={styles.backBtn} onClick={() => router.push("/")}>← Home</button>
      <div className={styles.tag}>Interview Simulator</div>
      <h1 className={styles.pageTitle}>Practice<span> Mode</span></h1>

      {/* ── Setup ── */}
      {!testStarted ? (
        <div className={styles.setupPanel}>
          <div className={styles.cardLabel}>Configure Session</div>
          <div className={styles.setupGrid}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Topic</label>
              <input
                type="text"
                className={styles.select}
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. React, Linux, DBMS..."
              />
            </div>
            <div className={styles.field}>
              <label 
                htmlFor="difficulty"
                className={styles.fieldLabel}
              >
                Difficulty
              </label>
              <select
                id="difficulty"
                className={styles.select}
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>
          <button className={styles.btnPrimary} onClick={startTest} disabled={loading}>
            {loading ? "Starting..." : "Start Session →"}
          </button>
        </div>
      ) : (
        <>
          {/* ── Timer ── */}
          <div className={styles.timerBar}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={`${styles.timerDot} ${timerClass}`} />
              <span className={styles.timerLabel}>Time on question</span>
            </div>
            <span className={`${styles.timerValue} ${timerClass}`}>{fmt(secondsSpent)}</span>
          </div>

          {/* Progress */}
          <div className={styles.progressRow}>
            <span className={styles.progressLabel}>Q{testResults.length + 1}</span>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${Math.min((testResults.length / 10) * 100, 100)}%` }} />
            </div>
            <span className={styles.progressLabel}>{testResults.length} done</span>
          </div>

          {/* ── Question card ── */}
          {currentQuestion && (
            <div className={styles.card}>
              <div className={styles.cardLabel}>
                Question {testResults.length + 1}
                <span className={`${styles.diffBadge} ${diffClass[difficulty]}`}>{difficulty}</span>
              </div>
              <p className={styles.questionText}>{currentQuestion}</p>
            </div>
          )}

          {/* ── Answer area ── */}
          {currentQuestion && (
            <>
              <div className={styles.card}>
                <div className={styles.cardLabel}>Your Answer</div>
                <div className={styles.answerWrap}>
                  <textarea
                    className={styles.answerTextarea}
                    rows={7}
                    placeholder="Type your answer here..."
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                  />
                  <span className={styles.answerCount}>{answer.length} chars</span>
                </div>
                <div className={styles.controlsRow}>
                  <button 
                    className={styles.btnGreen} 
                    onClick={saveAndNext} 
                    disabled={loading || !canProceed}
                  >
                    {loading ? "Saving..." : "Save & Next →"}
                  </button>
                  <button className={styles.stopBtn} onClick={stopTest} disabled={loading}>
                    ■ End Session
                  </button>
                </div>
              </div>

              {/* ── Text evaluation ── */}
              {score !== null && (
                <div className={`${styles.card} ${styles[`cardBorder${scoreLevel(score)}`]}`}>
                  <div className={styles.cardLabel}>Evaluation</div>
                  <div className={styles.scoreWrap}>
                    <div className={`${styles.scoreRing} ${styles[`scoreRing${scoreLevel(score)}`]}`}>
                      {score}
                    </div>
                    <div>
                      <div className={`${styles.scoreTitle} ${styles[`scoreTitle${scoreLevel(score)}`]}`}>
                        {scoreLabel(score)}
                      </div>
                      <div className={styles.scoreSubLabel}>Score out of 10</div>
                    </div>
                  </div>
                  <hr className={styles.divider} />
                  <p className={styles.feedbackText}>{feedback}</p>
                </div>
              )}

              {/* ── Voice section ── */}
              <div className={styles.card}>
                <div className={styles.voiceHeader}>
                  <div className={styles.cardLabel} style={{ marginBottom: 0 }}>Voice Mode</div>
                  {isRecording && (
                    <div className={styles.listeningBadge}>
                      <span />
                      Listening
                    </div>
                  )}
                </div>

                <div className={styles.controlsRow}>
                  {!isRecording ? (
                    <button className={styles.btnRecord} onClick={startRecording} disabled={!currentQuestion}>
                      🎙 Start Recording
                    </button>
                  ) : (
                    <button className={`${styles.btnRecord} ${styles.btnRecordActive}`} onClick={stopRecording}>
                      ⏹ Stop Recording
                    </button>
                  )}
                </div>

                {voiceTranscript && (
                  <>
                    <div className={styles.cardLabel} style={{ marginTop: 20 }}>Transcript</div>
                    <div className={styles.transcriptBox}>{voiceTranscript}</div>
                  </>
                )}

                {voiceScores && (
                  <>
                    <div className={styles.cardLabel} style={{ marginTop: 8 }}>Voice Evaluation</div>
                    <div className={styles.voiceGrid}>
                      {[
                        { label: "Content", val: voiceScores.contentScore },
                        { label: "Grammar", val: voiceScores.grammarScore },
                        { label: "Fluency", val: voiceScores.fluencyScore },
                        { label: "Keyword", val: voiceScores.keywordScore },
                        { label: "Clarity", val: voiceScores.clarityScore },
                      ].map((m, i) => (
                        <div className={styles.metricCard} key={i}>
                          <div className={styles.metricLabel}>{m.label}</div>
                          <div className={`${styles.metricVal} ${
                            m.val >= 8 ? styles.metricValGood : m.val >= 5 ? styles.metricValMedium : styles.metricValBad
                          }`}>{m.val}</div>
                        </div>
                      ))}
                      <div className={`${styles.metricCard} ${styles.metricOverall}`}>
                        <div className={styles.metricLabel}>Overall Voice Score</div>
                        <div className={`${styles.metricVal} ${
                          voiceScores.overallScore >= 8 ? styles.metricValGood
                          : voiceScores.overallScore >= 5 ? styles.metricValMedium
                          : styles.metricValBad
                        }`}>{voiceScores.overallScore} / 10</div>
                      </div>
                    </div>
                    <hr className={styles.divider} />
                    <p className={styles.feedbackText}>{voiceScores.feedback}</p>
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
