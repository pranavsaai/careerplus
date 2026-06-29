"use client";

import { SocketStatus } from "./useInterviewSocket";

interface Props {
  status: SocketStatus;
  message?: string;
}

const statusConfig: Record<SocketStatus, {
  color: string;
  bg: string;
  border: string;
  icon: string;
  label: string;
  animate: boolean;
}> = {
  CONNECTING: {
    color: "#94a3b8", bg: "rgba(148,163,184,0.1)",
    border: "rgba(148,163,184,0.3)", icon: "⟳",
    label: "Connecting...", animate: true
  },
  CONNECTED: {
    color: "#34d399", bg: "rgba(52,211,153,0.1)",
    border: "rgba(52,211,153,0.3)", icon: "●",
    label: "Connected", animate: false
  },
  GENERATING: {
    color: "#22d3ee", bg: "rgba(34,211,238,0.1)",
    border: "rgba(34,211,238,0.3)", icon: "✦",
    label: "AI Generating...", animate: true
  },
  READY: {
    color: "#34d399", bg: "rgba(52,211,153,0.1)",
    border: "rgba(52,211,153,0.3)", icon: "✓",
    label: "Question Ready!", animate: false
  },
  EVALUATING: {
    color: "#818cf8", bg: "rgba(129,140,248,0.1)",
    border: "rgba(129,140,248,0.3)", icon: "⟳",
    label: "AI Evaluating...", animate: true
  },
  EVALUATED: {
    color: "#f59e0b", bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.3)", icon: "★",
    label: "Evaluated!", animate: false
  },
  DISCONNECTED: {
    color: "#64748b", bg: "rgba(100,116,139,0.1)",
    border: "rgba(100,116,139,0.2)", icon: "○",
    label: "Offline", animate: false
  },
};

export default function AIStatusIndicator({ status, message }: Props) {
  const config = statusConfig[status];

  if (status === "DISCONNECTED" || status === "CONNECTED") return null;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "10px 16px",
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: "10px",
      marginBottom: "12px",
      animation: "fadeIn 0.3s ease"
    }}>
      <span style={{
        color: config.color,
        fontSize: "16px",
        animation: config.animate ? "spin 1s linear infinite" : "none",
        display: "inline-block"
      }}>
        {config.icon}
      </span>
      <div>
        <div style={{
          color: config.color,
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "1px",
          textTransform: "uppercase",
          fontFamily: "monospace"
        }}>
          {config.label}
        </div>
        {message && status !== "READY" && (
          <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "2px" }}>
            {message}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}