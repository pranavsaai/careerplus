"use client";

import { useState } from "react";
import styles from "../auth.module.css";

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  delay: `${(i * 0.7) % 6}s`,
  duration: `${8 + (i * 1.3) % 8}s`,
  size: i % 3 === 0 ? "3px" : "2px",
}));

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>

      {/* ── Background ── */}
      <div className={styles.bg}>
        <div className={styles.grid} />
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <div className={`${styles.blob} ${styles.blob3}`} />
        <div className={`${styles.ring} ${styles.ring1}`}>
          <div className={styles.ringDot} />
        </div>
        <div className={`${styles.ring} ${styles.ring2}`} />
        <div className={styles.particles}>
          {PARTICLES.map((p, i) => (
            <div
              key={i}
              className={styles.particle}
              style={{
                left: p.left,
                animationDelay: p.delay,
                animationDuration: p.duration,
                width: p.size,
                height: p.size,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Card ── */}
      <div className={styles.card}>
        {/* Back link */}
        <a href="/login" className={styles.backLink}>
          ← Back to login
        </a>

        {/* Icon */}
        <div className={styles.iconPulse}>🔐</div>

        {!sent ? (
          <>
            <h1 className={styles.heading} style={{ textAlign: "center" }}>
              Reset your<br /><span>password.</span>
            </h1>
            <p className={styles.subheading} style={{ textAlign: "center", marginBottom: 24 }}>
              Enter your email and we'll send a reset link
            </p>

            <form className={styles.form} onSubmit={handleReset}>
              {error && (
                <div className={styles.error}>
                  <span>⚠</span> {error}
                </div>
              )}

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Email address</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>✉</span>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading && <span className={styles.spinner} />}
                {loading ? "Sending link…" : "Send Reset Link →"}
              </button>
            </form>
          </>
        ) : (
          /* ── Success state ── */
          <div style={{ textAlign: "center" }}>
            <h1 className={styles.heading}>
              Check your<br /><span>inbox.</span>
            </h1>
            <p className={styles.subheading} style={{ marginBottom: 24 }}>
              We sent a password reset link to<br />
              <strong style={{ color: "var(--text-bright)" }}>{email}</strong>
            </p>
            <div className={styles.success} style={{ justifyContent: "center" }}>
              <span>✓</span> Reset link sent successfully
            </div>
            <div className={styles.linkRow} style={{ marginTop: 24 }}>
              Didn't receive it?{" "}
              <button
                onClick={() => setSent(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: "var(--accent-primary)",
                  font: "inherit",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <div className={styles.linkRow}>
          Remember your password?{" "}
          <a href="/login" className={styles.link}>Sign in</a>
        </div>
      </div>
    </main>
  );
}