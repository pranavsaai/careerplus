"use client";

import { useState } from "react";

interface Question {
  question: string;
  userAnswer: string;
  score: number;
  feedback: string;
  timeSpent: number;
}

interface ReportProps {
  topic: string;
  difficulty: string;
  finalScore: number;
  totalTime: number;
  testResults: Question[];
  userName?: string;
}

export default function ReportGenerator({
  topic,
  difficulty,
  finalScore,
  totalTime,
  testResults,
  userName = "Candidate"
}: ReportProps) {
  const [generating, setGenerating] = useState(false);

  const fmt = (sec: number) =>
    `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, "0")}s`;

  const scoreLabel = (s: number) =>
    s >= 8 ? "Excellent" : s >= 5 ? "Satisfactory" : "Needs Improvement";

  const generatePDF = async () => {
    setGenerating(true);

    try {
      // dynamically import jsPDF — only loads when needed
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = 210;
      const pageH = 297;
      const margin = 18;
      const contentW = pageW - margin * 2;
      let y = 0;

      // ── helper functions ──────────────────────────────────────────────
      const newPage = () => {
        doc.addPage();
        y = 20;
        // page footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("CareerPlus AI Interview Report — Confidential", margin, pageH - 10);
        doc.text(`Page ${doc.getNumberOfPages()}`, pageW - margin, pageH - 10, { align: "right" });
      };

      const checkY = (needed: number) => {
        if (y + needed > pageH - 20) newPage();
      };

      const drawRect = (x: number, yPos: number, w: number, h: number, color: [number, number, number]) => {
        doc.setFillColor(...color);
        doc.roundedRect(x, yPos, w, h, 3, 3, "F");
      };

      const wrapText = (text: string, x: number, yPos: number, maxW: number, lineH: number): number => {
        const lines = doc.splitTextToSize(text || "—", maxW);
        lines.forEach((line: string) => {
          checkY(lineH + 2);
          doc.text(line, x, yPos);
          yPos += lineH;
        });
        return yPos;
      };

      // ── Page 1 — Cover ────────────────────────────────────────────────
      // dark header background
      doc.setFillColor(5, 8, 15);
      doc.rect(0, 0, pageW, 80, "F");

      // accent line
      doc.setFillColor(34, 211, 238);
      doc.rect(0, 80, pageW, 2, "F");

      // CareerPlus logo text
      doc.setFontSize(28);
      doc.setTextColor(34, 211, 238);
      doc.setFont("helvetica", "bold");
      doc.text("CareerPlus", margin, 30);

      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text("AI-Powered Interview Platform", margin, 38);

      // Report title
      doc.setFontSize(18);
      doc.setTextColor(226, 232, 240);
      doc.setFont("helvetica", "bold");
      doc.text("Interview Performance Report", margin, 56);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, margin, 65);

      y = 95;

      // ── Candidate Info Card ───────────────────────────────────────────
      drawRect(margin, y, contentW, 45, [15, 23, 42]);
      doc.setDrawColor(34, 211, 238);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, contentW, 45, 3, 3, "S");

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text("CANDIDATE", margin + 8, y + 10);

      doc.setFontSize(14);
      doc.setTextColor(226, 232, 240);
      doc.setFont("helvetica", "bold");
      doc.text(userName, margin + 8, y + 20);

      // info grid
      const infoItems = [
        { label: "Topic", value: topic },
        { label: "Difficulty", value: difficulty },
        { label: "Date", value: new Date().toLocaleDateString() },
      ];
      infoItems.forEach((item, i) => {
        const x = margin + 8 + i * 58;
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.text(item.label.toUpperCase(), x, y + 32);
        doc.setFontSize(9);
        doc.setTextColor(226, 232, 240);
        doc.setFont("helvetica", "bold");
        doc.text(item.value, x, y + 39);
      });

      y += 55;

      // ── Score Summary Cards ───────────────────────────────────────────
      const scoreColor: [number, number, number] =
        finalScore >= 8 ? [52, 211, 153] :
        finalScore >= 5 ? [129, 140, 248] : [244, 63, 94];

      // Big score card
      drawRect(margin, y, 60, 50, [15, 23, 42]);
      doc.setFillColor(...scoreColor);
      doc.roundedRect(margin, y, 60, 50, 3, 3, "S");

      doc.setFontSize(32);
      doc.setTextColor(...scoreColor);
      doc.setFont("helvetica", "bold");
      doc.text(finalScore.toFixed(1), margin + 30, y + 25, { align: "center" });

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text("OVERALL SCORE / 10", margin + 30, y + 35, { align: "center" });

      doc.setFontSize(9);
      doc.setTextColor(...scoreColor);
      doc.setFont("helvetica", "bold");
      doc.text(scoreLabel(finalScore), margin + 30, y + 44, { align: "center" });

      // Stats cards
      const stats = [
        { label: "Questions", value: String(testResults.length) },
        { label: "Total Time", value: fmt(totalTime) },
        { label: "Excellent (≥8)", value: String(testResults.filter(r => r.score >= 8).length) },
        { label: "Avg/Question", value: `${Math.round(totalTime / (testResults.length || 1))}s` },
      ];

      stats.forEach((stat, i) => {
        const sx = margin + 68 + (i % 2) * 63;
        const sy = y + Math.floor(i / 2) * 26;
        drawRect(sx, sy, 58, 22, [15, 23, 42]);
        doc.setFontSize(12);
        doc.setTextColor(226, 232, 240);
        doc.setFont("helvetica", "bold");
        doc.text(stat.value, sx + 29, sy + 11, { align: "center" });
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.text(stat.label.toUpperCase(), sx + 29, sy + 18, { align: "center" });
      });

      y += 60;

      // ── Score breakdown bar ───────────────────────────────────────────
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.text("SCORE DISTRIBUTION", margin, y + 8);
      y += 12;

      const scoreGroups = [
        { label: "Excellent (8-10)", count: testResults.filter(r => r.score >= 8).length, color: [52, 211, 153] as [number,number,number] },
        { label: "Good (5-7)", count: testResults.filter(r => r.score >= 5 && r.score < 8).length, color: [129, 140, 248] as [number,number,number] },
        { label: "Needs Work (0-4)", count: testResults.filter(r => r.score < 5).length, color: [244, 63, 94] as [number,number,number] },
      ];

      scoreGroups.forEach(group => {
        const pct = testResults.length > 0 ? (group.count / testResults.length) : 0;
        drawRect(margin, y, contentW * 0.7, 8, [15, 23, 42]);
        if (pct > 0) drawRect(margin, y, contentW * 0.7 * pct, 8, group.color);
        doc.setFontSize(8);
        doc.setTextColor(...group.color);
        doc.setFont("helvetica", "bold");
        doc.text(`${group.label}: ${group.count}`, margin + contentW * 0.72, y + 6);
        y += 12;
      });

      y += 8;

      // ── Page 2+ — Question Breakdown ─────────────────────────────────
      newPage();

      doc.setFontSize(14);
      doc.setTextColor(226, 232, 240);
      doc.setFont("helvetica", "bold");
      doc.text("Question-by-Question Analysis", margin, y);
      y += 4;

      doc.setFillColor(34, 211, 238);
      doc.rect(margin, y, 40, 1, "F");
      y += 10;

      testResults.forEach((result, idx) => {
        checkY(20);

        const qScoreColor: [number, number, number] =
          result.score >= 8 ? [52, 211, 153] :
          result.score >= 5 ? [129, 140, 248] : [244, 63, 94];

        // question header
        drawRect(margin, y, contentW, 10, [15, 23, 42]);
        doc.setFontSize(9);
        doc.setTextColor(34, 211, 238);
        doc.setFont("helvetica", "bold");
        doc.text(`Q${idx + 1}`, margin + 4, y + 7);

        doc.setTextColor(226, 232, 240);
        doc.setFont("helvetica", "normal");
        doc.text(`Time: ${fmt(result.timeSpent)}`, margin + contentW - 40, y + 7);

        // score badge
        doc.setFillColor(...qScoreColor);
        doc.roundedRect(margin + contentW - 22, y + 1, 18, 8, 2, 2, "F");
        doc.setFontSize(8);
        doc.setTextColor(5, 8, 15);
        doc.setFont("helvetica", "bold");
        doc.text(`${result.score}/10`, margin + contentW - 13, y + 6.5, { align: "center" });

        y += 14;

        // question text
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "bold");
        doc.text("QUESTION", margin, y);
        y += 5;

        doc.setFontSize(9);
        doc.setTextColor(226, 232, 240);
        doc.setFont("helvetica", "normal");
        y = wrapText(result.question, margin, y, contentW, 5);
        y += 4;

        // your answer
        checkY(15);
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "bold");
        doc.text("YOUR ANSWER", margin, y);
        y += 5;

        doc.setFontSize(8.5);
        doc.setTextColor(196, 181, 253);
        doc.setFont("helvetica", "normal");
        y = wrapText(result.userAnswer || "No answer provided", margin, y, contentW, 5);
        y += 4;

        // feedback
        checkY(15);
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "bold");
        doc.text("AI FEEDBACK", margin, y);
        y += 5;

        doc.setFontSize(8.5);
        doc.setTextColor(...qScoreColor);
        doc.setFont("helvetica", "normal");
        y = wrapText(result.feedback || "No feedback available", margin, y, contentW, 5);

        // divider
        y += 6;
        doc.setDrawColor(30, 41, 59);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageW - margin, y);
        y += 8;
      });

      // ── Final page — Summary ──────────────────────────────────────────
      newPage();

      drawRect(margin, y, contentW, 60, [5, 8, 15]);
      doc.setDrawColor(34, 211, 238);
      doc.roundedRect(margin, y, contentW, 60, 3, 3, "S");

      doc.setFontSize(14);
      doc.setTextColor(34, 211, 238);
      doc.setFont("helvetica", "bold");
      doc.text("Performance Summary", margin + 10, y + 15);

      const perfLines = [
        finalScore >= 8
          ? "Outstanding performance! You demonstrated strong technical knowledge across all questions."
          : finalScore >= 5
          ? "Good effort! You showed solid understanding with room for improvement in some areas."
          : "Keep practicing! Focus on strengthening your fundamentals and revisit weak areas.",
        `You answered ${testResults.length} questions with an average score of ${finalScore.toFixed(1)}/10.`,
        `Total time invested: ${fmt(totalTime)}.`,
      ];

      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      doc.setFont("helvetica", "normal");
      perfLines.forEach(line => {
        const wrapped = doc.splitTextToSize(line, contentW - 20);
        wrapped.forEach((l: string) => {
          doc.text(l, margin + 10, y + 25 + perfLines.indexOf(line) * 12);
        });
      });

      y += 70;

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Generated by CareerPlus AI · careerplus-rho.vercel.app", margin, y);
      doc.setTextColor(34, 211, 238);
      doc.text("Keep practicing. Keep growing. 🚀", pageW - margin, y, { align: "right" });

      // ── Save ──────────────────────────────────────────────────────────
      const fileName = `CareerPlus_${topic.replace(/\s+/g, "_")}_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);

    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={generating}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px 24px",
        background: generating
          ? "rgba(34,211,238,0.1)"
          : "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(129,140,248,0.15))",
        border: "1px solid rgba(34,211,238,0.4)",
        borderRadius: "10px",
        color: generating ? "#64748b" : "#22d3ee",
        fontSize: "0.9rem",
        fontWeight: 700,
        cursor: generating ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        letterSpacing: "0.5px"
      }}
      onMouseEnter={e => {
        if (!generating) {
          e.currentTarget.style.background = "linear-gradient(135deg, rgba(34,211,238,0.25), rgba(129,140,248,0.25))";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(129,140,248,0.15))";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {generating ? (
        <>
          <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
          Generating PDF...
        </>
      ) : (
        <>
          📄 Download Report
        </>
      )}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </button>
  );
}