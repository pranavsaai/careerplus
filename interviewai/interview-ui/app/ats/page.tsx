"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../ats.module.css";
import ParticleBackground from "../components/ParticleBackground";

interface ATSResult {
  atsScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export default function ATSPage() {
  const router = useRouter();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<ATSResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const analyzeResume = async () => {
    if (!resumeFile || !jobDescription.trim()) {
      alert("Please upload a resume and enter a job description.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDescription);
    try {
      const res = await fetch("http://13.223.68.160:8080/api/ats/analyze", {
        method: "POST",
        body: formData,
        credentials: "include", 
      });
      const data: ATSResult = await res.json();
      setResult(data);
    } catch (error) {
      console.error("ATS Error:", error);
      alert("Error analyzing resume.");
    }
    setLoading(false);
  };

  const startInterviewForSkill = async (skill: string) => {
  const encoded = encodeURIComponent(skill);

  try {
    const res = await fetch(
      `http://13.223.68.160:8080/api/profile/topic-tests/${encoded}`,{
        credentials: "include",
      }
    );

    if (!res.ok) throw new Error("No attempts");

    const data = await res.json();

    if (data.length > 0) {
      router.push(`/topic/${encoded}`);
    } else {
      router.push(`/interview?topic=${encoded}`);
    }

  } catch (err) {
    router.push(`/interview?topic=${encoded}`);
  }
};

  const scoreVariant = (s: number): "good" | "medium" | "bad" => {
    if (s >= 75) return "good";
    if (s >= 50) return "medium";
    return "bad";
  };

  const scoreLabel = (s: number) => {
    if (s >= 75) return "Strong Match";
    if (s >= 50) return "Partial Match";
    return "Low Match";
  };

  const scoreDesc = (s: number) => {
    if (s >= 75) return "Your resume is a strong match. You're likely to pass ATS filters.";
    if (s >= 50) return "Decent match. Consider adding some missing skills to improve your chances.";
    return "Low match detected. Significant skill gaps may affect shortlisting.";
  };

  const circumference = 2 * Math.PI * 52;
  const safeScore = Math.max(
  0,
  Math.min(100, Number(result?.atsScore ?? 0))
);

  const offset = circumference - (safeScore / 100) * circumference;


  return (
    <main className={styles["page"]}>
    <ParticleBackground />
      <button
        className={styles["back-btn"]}
        onClick={() => router.push("/")}
        aria-label="Back to home page"
        title="Back to home page"
      >
        ← Back to Home
      </button>

      <header>
        <div className={styles["tag"]}>Resume Intelligence</div>
        <h1 className={styles["page-title"]}>ATS Analyzer</h1>
      </header>

      <div className={styles["two-col"]}>
        <div>
          <label
            htmlFor="resume-upload"
            className={styles["field-label"]}
          >
            Upload Resume (PDF / DOCX)
          </label>

          <div
            className={`${styles["drop-zone"]} ${dragging ? styles["drop-zone--active"] : ""}`}
            role="button"
            tabIndex={0}
            aria-label="Click or drag and drop to upload your resume"
            title="Click or drag and drop to upload your resume"
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) setResumeFile(file);
            }}
            onClick={() => document.getElementById("resume-upload")?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                document.getElementById("resume-upload")?.click();
              }
            }}
          >
            <span className={styles["drop-icon"]} aria-hidden="true">
              {resumeFile ? "📄" : "📂"}
            </span>
            <span className={styles["drop-text"]}>
              {resumeFile ? "File selected" : "Drag & drop or click to upload"}
            </span>
            {resumeFile && (
              <span className={styles["drop-file-name"]}>{resumeFile.name}</span>
            )}
          </div>
          <input
            id="resume-upload"
            type="file"
            accept=".pdf,.docx"
            aria-label="Upload resume file"
            title="Upload resume file"
            style={{ display: "none" }}
            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
          />
        </div>
        <div>
          <label
            htmlFor="job-description"
            className={styles["field-label"]}
          >
            Paste Job Description
          </label>
          <textarea
            id="job-description"
            className={styles["job-textarea"]}
            placeholder="Paste the job description here..."
            title="Paste the job description you are applying to"
            aria-label="Job description for ATS analysis"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>
      </div>

      <button
        className={styles["btn-primary"]}
        onClick={analyzeResume}
        disabled={loading}
        aria-label="Run ATS analysis on your resume"
        title="Run ATS analysis on your resume"
      >
        {loading ? "Analyzing Resume..." : "Run ATS Analysis →"}
      </button>
      {result && (
        <section className={styles["results"]} aria-label="ATS analysis results">
          <div
            className={`${styles["score-card"]} ${styles[`score-card--${scoreVariant(result.atsScore)}`]}`}
            aria-label={`ATS score: ${result.atsScore} out of 100 — ${scoreLabel(result.atsScore)}`}
          >
            <div className={styles["score-donut"]} aria-hidden="true">
              <svg width="120" height="120" viewBox="0 0 120 120" role="presentation">
                <circle
                  className={styles["score-donut-track"]}
                  cx="60" cy="60" r="52"
                />
                <circle
                  className={`${styles["score-donut-fill"]} ${styles[`score-donut-fill--${scoreVariant(result.atsScore)}`]}`}
                  cx="60" cy="60" r="52"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                />
              </svg>
              <div className={styles["score-donut-inner"]}>
                <span className={`${styles["score-num"]} ${styles[`score-num--${scoreVariant(result.atsScore)}`]}`}>
                  {result.atsScore ?? 0}
                </span>
                <span className={styles["score-pct"]}>/100</span>
              </div>
            </div>

            <div>
              <div className={styles["score-card-label"]}>ATS Score</div>
              <div className={`${styles["score-card-title"]} ${styles[`score-card-title--${scoreVariant(result.atsScore)}`]}`}>
                {scoreLabel(result.atsScore)}
              </div>
              <p className={styles["score-desc"]}>{scoreDesc(result.atsScore)}</p>
            </div>
          </div>
          <div className={styles["skills-grid"]}>
            <div className={styles["skills-card"]} aria-label="Matched skills">
              <div className={`${styles["skills-title"]} ${styles["skills-title--green"]}`}>
                ✓ Matched Skills
              </div>
              {result.matchedSkills?.length === 0 ? (
                <p className={styles["empty-state"]}>No matched skills found.</p>
              ) : (
                <ul aria-label="List of matched skills">
                  {result.matchedSkills?.map((skill, i) => (
                    <li
                      key={i}
                      className={`${styles["skill-tag"]} ${styles["skill-tag--matched"]}`}
                      aria-label={`Matched skill: ${skill}`}
                    >
                      <span className={`${styles["skill-dot"]} ${styles["skill-dot--green"]}`} aria-hidden="true" />
                      {skill}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className={`${styles["skills-card"]} ${styles["skills-card--missing"]}`} aria-label="Missing skills">
              <div className={`${styles["skills-title"]} ${styles["skills-title--red"]}`}>
                ✗ Missing Skills — Click to Practice
              </div>
              {result.missingSkills?.length === 0 ? (
                <p className={styles["empty-state"]}>🎉 No missing skills. Perfect match!</p>
              ) : (
                <ul aria-label="List of missing skills. Click any to start an interview on that topic.">
                  {result.missingSkills?.map((skill, i) => (
                    <li
                      key={i}
                      className={`${styles["skill-tag"]} ${styles["skill-tag--missing"]}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Practice missing skill: ${skill}`}
                      title={`Click to start an interview on ${skill}`}
                      onClick={() => startInterviewForSkill(skill)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") startInterviewForSkill(skill);
                      }}
                    >
                      <span className={`${styles["skill-dot"]} ${styles["skill-dot--red"]}`} aria-hidden="true" />
                      {skill}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
