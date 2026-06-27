"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ResumePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") {
      setError("Only PDF files allowed!");
      return;
    }
    setFile(f);
    setError("");
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startPersonalizedInterview = (topic: string) => {
    router.push(`/interview?topic=${encodeURIComponent(topic)}`);
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#fff",
      padding: "40px 20px",
      fontFamily: "system-ui, sans-serif",
      maxWidth: "800px",
      margin: "0 auto"
    }}>
      <button
        onClick={() => router.push("/")}
        style={{ background: "none", border: "1px solid #333", color: "#888", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", marginBottom: "32px" }}
      >
        ← Home
      </button>

      <div style={{ marginBottom: "8px", fontSize: "13px", color: "#22d3ee", fontWeight: 600, letterSpacing: "2px" }}>
        AI POWERED
      </div>
      <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "8px" }}>
        Resume <span style={{ color: "#22d3ee" }}>Analyzer</span>
      </h1>
      <p style={{ color: "#64748b", marginBottom: "40px" }}>
        Upload your resume → AI extracts your skills → Get personalized interview questions!
      </p>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#22d3ee" : file ? "#34d399" : "#333"}`,
          borderRadius: "16px",
          padding: "60px 40px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "rgba(34,211,238,0.05)" : "rgba(255,255,255,0.02)",
          transition: "all 0.2s",
          marginBottom: "24px"
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>
          {file ? "📄" : "☁️"}
        </div>
        <div style={{ fontWeight: 600, marginBottom: "8px", fontSize: "1.1rem" }}>
          {file ? file.name : "Drop your resume here"}
        </div>
        <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
          {file ? `${(file.size / 1024).toFixed(1)} KB · PDF` : "or click to browse · PDF only"}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {error && (
        <div style={{ background: "rgba(244,63,94,0.1)", border: "1px solid #f43f5e", borderRadius: "8px", padding: "12px 16px", color: "#f43f5e", marginBottom: "16px" }}>
          ⚠ {error}
        </div>
      )}

      {file && !result && (
        <button
          onClick={handleUpload}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            background: loading ? "#1e293b" : "linear-gradient(135deg, #22d3ee, #818cf8)",
            border: "none",
            borderRadius: "12px",
            color: "#fff",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "32px"
          }}
        >
          {loading ? "🤖 Analyzing your resume..." : "✨ Analyze Resume →"}
        </button>
      )}

      {/* Results */}
      {result && (
        <div>
          <div style={{ background: "rgba(52,211,153,0.1)", border: "1px solid #34d399", borderRadius: "12px", padding: "16px", marginBottom: "24px", color: "#34d399", fontWeight: 600 }}>
            ✅ Resume analyzed successfully!
          </div>

          {/* Experience + Domain */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "#111", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px" }}>
              <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "8px", letterSpacing: "1px" }}>EXPERIENCE LEVEL</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#22d3ee" }}>{result.experienceLevel}</div>
            </div>
            <div style={{ background: "#111", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px" }}>
              <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "8px", letterSpacing: "1px" }}>DOMINANT DOMAIN</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#818cf8" }}>{result.dominantDomain}</div>
            </div>
          </div>

          {/* Skills */}
          <div style={{ background: "#111", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
            <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "12px", letterSpacing: "1px" }}>SKILLS DETECTED</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {result.skills?.map((s: string, i: number) => (
                <span key={i} style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)", color: "#22d3ee", padding: "4px 12px", borderRadius: "20px", fontSize: "13px" }}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Technologies */}
          <div style={{ background: "#111", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
            <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "12px", letterSpacing: "1px" }}>TECHNOLOGIES</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {result.technologies?.map((t: string, i: number) => (
                <span key={i} style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.3)", color: "#818cf8", padding: "4px 12px", borderRadius: "20px", fontSize: "13px" }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Suggested Topics → Start Interview */}
          <div style={{ background: "#111", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px" }}>
            <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "12px", letterSpacing: "1px" }}>
              🎯 SUGGESTED INTERVIEW TOPICS — Click to Start!
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {result.suggestedTopics?.map((topic: string, i: number) => (
                <button
                  key={i}
                  onClick={() => startPersonalizedInterview(topic)}
                  style={{
                    background: "rgba(52,211,153,0.1)",
                    border: "1px solid rgba(52,211,153,0.3)",
                    color: "#34d399",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(52,211,153,0.2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(52,211,153,0.1)")}
                >
                  🚀 {topic}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => { setFile(null); setResult(null); }}
            style={{ marginTop: "24px", background: "none", border: "1px solid #333", color: "#64748b", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", width: "100%" }}
          >
            Upload Another Resume
          </button>
        </div>
      )}
    </main>
  );
}