"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  delay: `${(i * 0.7) % 6}s`,
  duration: `${8 + (i * 1.3) % 8}s`,
  size: i % 3 === 0 ? "3px" : "2px",
}));

function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthClasses = ["", styles.strengthWeak, styles.strengthFair, styles.strengthGood, styles.strengthStrong];

export default function RegisterPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

useEffect(() => {
  const checkSession = async () => {
    try {
      const res = await fetch("/api/profile/summary", {
        credentials: "include",
        cache: "no-store",
      });

      if (res.ok) {
        router.replace("/");
        return;
      }

      setAuthChecked(true);
    } catch {
      setAuthChecked(true);
    }
  };

  checkSession();
}, [router]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const strength = getStrength(form.password);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) { setError("Please accept the terms to continue."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      router.replace("/login");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  if (!authChecked) {
  return null;
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
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>⚡</div>
          <span className={styles.brandName}>InterviewAI</span>
        </div>

        {/* Heading */}
        <h1 className={styles.heading}>
          Create your<br /><span>account.</span>
        </h1>
        <p className={styles.subheading}>Start practicing and ace your next interview</p>

        {/* Form */}
        <form className={styles.form} onSubmit={handleRegister}>
          {error && (
            <div className={styles.error}>
              <span>⚠</span> {error}
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Full Name</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>👤</span>
              <input
                type="text"
                className={styles.input}
                placeholder="Alex Johnson"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Email</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>✉</span>
              <input
                type="email"
                className={styles.input}
                placeholder="you@example.com"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>🔒</span>
              <input
                type={showPass ? "text" : "password"}
                className={styles.input}
                placeholder="Min. 8 characters"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass(v => !v)}
                aria-label="Toggle password visibility"
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>

            {/* Strength meter */}
            {form.password.length > 0 && (
              <>
                <div className={`${styles.strengthBar} ${strengthClasses[strength]}`}>
                  {[1, 2, 3, 4].map(seg => (
                    <div key={seg} className={styles.strengthSegment} />
                  ))}
                </div>
                <div className={styles.strengthText}>
                  {strengthLabels[strength]} password
                </div>
              </>
            )}
          </div>

          <div className={styles.checkRow}>
            <input
              type="checkbox"
              className={styles.checkbox}
              id="terms"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
            />
            <label htmlFor="terms">
              I agree to the{" "}
              <a href="#" className={styles.link}>Terms of Service</a>{" "}
              and{" "}
              <a href="#" className={styles.link}>Privacy Policy</a>
            </label>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading && <span className={styles.spinner} />}
            {loading ? "Creating account…" : "Create Account →"}
          </button>
        </form>

        <div className={styles.linkRow}>
          Already have an account?{" "}
          <a href="/login" className={styles.link}>Sign in</a>
        </div>
      </div>
    </main>
  );
}
