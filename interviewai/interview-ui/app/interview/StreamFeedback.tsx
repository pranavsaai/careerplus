"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../interview.module.css";

interface StreamFeedbackProps {
  questionId: string;
  answer: string;
  onComplete?: (fullText: string) => void;
}

export default function StreamFeedback({
  questionId,
  answer,
  onComplete,
}: StreamFeedbackProps) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fullTextRef = useRef("");

  useEffect(() => {
    if (!questionId || !answer) return;

    setText("");
    fullTextRef.current = "";
    setDone(false);
    setError("");

    // encode answer as query param
    const params = new URLSearchParams({
      questionId,
      answer,
    });

    const url = `/api/interview/stream-feedback?${params.toString()}`;
    const es = new EventSource(url, { withCredentials: true });

    es.addEventListener("token", (e) => {
      fullTextRef.current += e.data;
      setText((prev) => prev + e.data);
    });

    es.addEventListener("done", () => {
      setDone(true);
      es.close();
      onComplete?.(fullTextRef.current);
    });

    es.addEventListener("error", (e: any) => {
      setError(e.data || "Stream error");
      setDone(true);
      es.close();
    });

    // cleanup on unmount
    return () => es.close();
  }, [questionId, answer]);

  if (error) {
    return (
      <div style={{
        background: "rgba(244,63,94,0.1)",
        border: "1px solid #f43f5e",
        borderRadius: "8px",
        padding: "12px",
        color: "#f43f5e"
      }}>
        ⚠ {error}
      </div>
    );
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid #1e293b",
      borderRadius: "12px",
      padding: "20px",
      marginTop: "16px"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "12px",
        fontSize: "12px",
        color: "#64748b",
        letterSpacing: "1px"
      }}>
        {!done && (
          <span style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#22d3ee",
            display: "inline-block",
            animation: "pulse 1s infinite"
          }} />
        )}
        {done ? "✅ AI FEEDBACK" : "🤖 AI IS EVALUATING..."}
      </div>

      <div style={{
        color: "#e2e8f0",
        lineHeight: "1.7",
        whiteSpace: "pre-wrap",
        fontFamily: "system-ui",
        fontSize: "0.95rem"
      }}>
        {text}
        {/* blinking cursor while streaming */}
        {!done && (
          <span style={{
            display: "inline-block",
            width: "2px",
            height: "16px",
            background: "#22d3ee",
            marginLeft: "2px",
            animation: "blink 0.7s infinite",
            verticalAlign: "middle"
          }} />
        )}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}