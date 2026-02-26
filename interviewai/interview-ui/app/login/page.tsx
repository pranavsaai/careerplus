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

export default function LoginPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

useEffect(() => {
  const checkSession = async () => {
    try {
      const res = await fetch("http://13.223.68.160:8080/api/profile/summary", {
        credentials: "include",
        cache: "no-store",
      });

      if (res.ok) {
        window.location.replace("/");
        return;
      }

      setAuthChecked(true);
    } catch {
      setAuthChecked(true);
    }
  };

  checkSession();
  const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      window.location.reload();
    }
  };

  window.addEventListener("pageshow", handlePageShow);

  return () => {
    window.removeEventListener("pageshow", handlePageShow);
  };
}, []);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://13.223.68.160:8080/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid credentials"); return; }
      router.push("/");
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
          Welcome<br /><span>back.</span>
        </h1>
        <p className={styles.subheading}>Sign in to continue your practice sessions</p>

        {/* Form */}
        <form className={styles.form} onSubmit={handleLogin}>
          {error && (
            <div className={styles.error}>
              <span>⚠</span> {error}
            </div>
          )}

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
                placeholder="••••••••"
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
          </div>

          <a href="/forgot-password" className={styles.forgotLink}>
            Forgot password?
          </a>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading && <span className={styles.spinner} />}
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>

        <div className={styles.linkRow}>
          Don't have an account?{" "}
          <a href="/register" className={styles.link}>Create one</a>
        </div>
      </div>
    </main>
  );
}
