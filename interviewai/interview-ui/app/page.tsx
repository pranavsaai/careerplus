"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import styles from "../app/home.module.css";

/* ── Particle canvas ── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("resize", resize);

    const count = 90;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.45 + 0.08,
      r: Math.random() * 1.8 + 0.6,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouseRef.current;

      particles.forEach((p) => {
        // Repulse from mouse
        const dx = p.x - mx, dy = p.y - my;
        const dist = Math.hypot(dx, dy);
        if (dist < 100) {
          const force = (100 - dist) / 100;
          p.vx += (dx / dist) * force * 0.3;
          p.vy += (dy / dist) * force * 0.3;
        }
        // Dampen
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        const distMouse = Math.hypot(p.x - mx, p.y - my);
        const glow = distMouse < 160 ? 1 - distMouse / 160 : 0;
        const alpha = p.alpha + glow * 0.4;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + glow * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = glow > 0
          ? `rgba(34,211,238,${alpha})`
          : `rgba(99,179,237,${alpha})`;
        ctx.fill();
      });

      // Connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(99,179,237,${0.1 * (1 - d / 130)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}

/* ── Mouse-following glow cursor ── */
function GlowCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);

    let af: number;
    const animate = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.12;
      ring.current.y += (pos.current.y - ring.current.y) * 0.12;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x - 18}px, ${ring.current.y - 18}px)`;
      }
      af = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(af);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className={styles.cursorDot} />
      <div ref={ringRef} className={styles.cursorRing} />
    </>
  );
}

/* ── Magnetic card ── */
function MagneticCard({
  children, className, onClick, "aria-label": label,
}: {
  children: React.ReactNode;
  className: string;
  onClick: () => void;
  "aria-label": string;
}) {
  const cardRef = useRef<HTMLButtonElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate(${x * 0.04}px, ${y * 0.06}px) rotateX(${-y * 0.015}deg) rotateY(${x * 0.015}deg) scale(1.025)`;
    // Spotlight
    const px = ((e.clientX - r.left) / r.width) * 100;
    const py = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--spot-x", `${px}%`);
    el.style.setProperty("--spot-y", `${py}%`);
    el.style.setProperty("--spot-opacity", "1");
  }, []);

  const onMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "";
    el.style.setProperty("--spot-opacity", "0");
  }, []);

  return (
    <button
      ref={cardRef}
      className={className}
      onClick={onClick}
      aria-label={label}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </button>
  );
}

/* ── Main page ── */
export default function Home() {
  const router = useRouter();
  const handleLogout = async () => {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.error("Logout failed", err);
  }
  window.location.href = "/login";
};
  const [authChecked, setAuthChecked] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  const cards = [
    {
      icon: "🎙",
      title: "Interview Simulator",
      desc: "Practice technical questions across topics with live AI scoring and voice support.",
      cta: "Start practicing",
      color: "blue",
      route: "/interview",
      tag: "Voice + Text",
    },
    {
      icon: "📄",
      title: "ATS Analyzer",
      desc: "Upload your resume and job description to get an instant match score and skill gaps.",
      cta: "Analyze resume",
      color: "violet",
      route: "/ats",
      tag: "Instant Analysis",
    },
    {
      icon: "📊",
      title: "Profile Dashboard",
      desc: "Track your interview performance, accuracy, weak topics and improvement over time.",
      cta: "View progress",
      color: "emerald",
      route: "/profile",
      tag: "Live Analytics",
    },
  ];
  useEffect(() => {
  const checkAuth = async () => {
    try {
      const res = await fetch("/api/profile/summary", {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        window.location.replace("/login");
        return;
      }

      setAuthChecked(true);
    } catch {
      window.location.replace("/login");
    }
  };

  checkAuth();
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
if (!authChecked) {
  return null;
}

  return (
    <main className={styles.root}>
      <GlowCursor />
      <ParticleCanvas />

      {/* Ambient blobs */}
      <div className={styles.blob1} aria-hidden="true" />
      <div className={styles.blob2} aria-hidden="true" />
      <div className={styles.blob3} aria-hidden="true" />

      {/* Noise overlay */}
      <div className={styles.noise} aria-hidden="true" />

      <div className={styles.content}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div className={styles.logoutWrapper}>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <span style={{ fontSize: "15px" }}>⏻</span>
              Logout
            </button>
          </div>
        </div>

        {/* Badge */}
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          Gen AI · Enhanced Skill Gap Analyzer
          <span className={styles.badgePulse} />
        </div>

        {/* Title */}
        <h1 className={styles.title}>
          <span className={styles.titleLine1}>Career</span>
          <span className={styles.titleLine2}>
            <span className={styles.titlePlus}>Plus</span>
          </span>
        </h1>

        {/* Subtitle */}
        <p className={styles.subtitle}>
          Sharpen your interview skills and optimize your resume
          <br />
          with real-time AI feedback and analytics.
        </p>

        {/* Feature highlights row */}
        <div className={styles.statsRow}>
          {[
            { icon: "🎙", label: "Voice & Text Answers" },
            { icon: "⚡", label: "Real-Time AI Feedback" },
            { icon: "📈", label: "Progress Tracking" },
          ].map((s, i) => (
            <div key={i} className={styles.statItem}>
              <span className={styles.statIcon}>{s.icon}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.divider} aria-hidden="true">
          <span />
          <span className={styles.dividerDot} />
          <span />
        </div>

        {/* Cards */}
        <nav className={styles.cards} aria-label="Main navigation">
          {cards.map((c, i) => (
            <MagneticCard
              key={i}
              className={`${styles.card} ${styles[`card--${c.color}`]} ${hovered === i ? styles.cardHovered : ""}`}
              onClick={() => router.push(c.route)}
              aria-label={`Go to ${c.title}`}
            >
              {/* Spotlight layer */}
              <div className={styles.spotlight} aria-hidden="true" />

              {/* Top accent line */}
              <div className={styles.cardAccentLine} aria-hidden="true" />

              {/* Feature tag */}
              <div className={styles.cardStatBadge}>
                <span>{c.tag}</span>
              </div>

              <span className={styles.cardIcon}>{c.icon}</span>

              <span className={styles.cardTitle}>{c.title}</span>
              <span className={styles.cardDesc}>{c.desc}</span>

              <span className={styles.cardCta}>
                <span>{c.cta}</span>
                <span className={styles.ctaArrow}>→</span>
              </span>

              {/* Corner glow */}
              <div className={styles.cardCornerGlow} aria-hidden="true" />
            </MagneticCard>
          ))}
        </nav>

        {/* Footer note */}
        <p className={styles.footerNote}>
          Powered by Claude AI · Built for ambitious engineers
        </p>
      </div>
    </main>
  );
}
