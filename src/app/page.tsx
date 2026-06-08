"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

type Phase = "idle" | "scanning" | "loading" | "error";

const DEBOUNCE_MS = 400;
const ERROR_DISPLAY_MS = 5000;

export default function KioskPage() {
  const searchParams = useSearchParams();
  const device = searchParams.get("device") ?? undefined;
  const testMode = searchParams.get("test") === "1";

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufferRef = useRef<string>("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [manualInput, setManualInput] = useState<string>("");
  const [showManual, setShowManual] = useState(testMode);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    focusInput();
    const onVisibilityChange = () => { if (!document.hidden) focusInput(); };
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("click", focusInput);
    document.addEventListener("touchend", focusInput);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("click", focusInput);
      document.removeEventListener("touchend", focusInput);
    };
  }, [focusInput]);

  const submitUID = useCallback(
    async (uid: string) => {
      if (phase === "loading") return;
      const trimmed = uid.trim();
      if (!trimmed) return;

      setPhase("loading");
      bufferRef.current = "";

      try {
        const res = await fetch("/api/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: trimmed, device }),
        });
        const data = await res.json();
        if (data.found && data.url) {
          window.location.href = data.url;
        } else {
          setErrorMsg(data.message ?? "Fragrance not recognised. Please ask a staff member for help.");
          setPhase("error");
          setTimeout(() => {
            setPhase("idle");
            setErrorMsg("");
            setManualInput("");
            focusInput();
          }, ERROR_DISPLAY_MS);
        }
      } catch {
        setErrorMsg("Network error. Please try again.");
        setPhase("error");
        setTimeout(() => {
          setPhase("idle");
          setErrorMsg("");
          setManualInput("");
          focusInput();
        }, ERROR_DISPLAY_MS);
      }
    },
    [phase, device, focusInput]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (phase === "loading" || phase === "error") return;
      if (e.key === "Enter") {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const uid = bufferRef.current;
        bufferRef.current = "";
        (e.target as HTMLInputElement).value = "";
        if (uid) submitUID(uid);
      }
    },
    [phase, submitUID]
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (phase === "loading" || phase === "error") return;
      bufferRef.current = e.target.value;
      setPhase("scanning");
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const uid = bufferRef.current;
        bufferRef.current = "";
        if (inputRef.current) inputRef.current.value = "";
        if (uid) submitUID(uid);
      }, DEBOUNCE_MS);
    },
    [phase, submitUID]
  );

  const handleManualSubmit = () => {
    if (manualInput.trim()) submitUID(manualInput.trim());
  };

  return (
    <div style={s.root}>
      {/* Ambient background */}
      <div style={s.ambientLeft} />
      <div style={s.ambientRight} />

      {/* Hidden keyboard-wedge capture input */}
      <input
        ref={inputRef}
        onKeyDown={handleKeyDown}
        onChange={handleInput}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-hidden="true"
        style={s.hiddenInput}
        tabIndex={0}
      />

      {/* Logo */}
      <div style={s.logoWrap}>
        <PerfumeGalleryLogo />
      </div>

      {/* Main card */}
      <div style={s.card}>
        {/* Scan graphic */}
        <div style={s.scanGraphicWrap}>
          <ScanGraphic phase={phase} />
        </div>

        {phase === "idle" && (
          <div style={s.textBlock}>
            <h1 style={s.heading}>Place your perfume bottle<br />on the blue circle</h1>
            <p style={s.subtext}>
              We&apos;ll identify the fragrance and show you<br />
              prices, notes and similar scents.
            </p>
            <ReadyPulse />
          </div>
        )}

        {phase === "scanning" && (
          <div style={s.textBlock}>
            <h1 style={{ ...s.heading, color: "#5b9bd6" }}>Reading…</h1>
            <p style={s.subtext}>Keep the bottle on the circle</p>
          </div>
        )}

        {phase === "loading" && (
          <div style={s.textBlock}>
            <h1 style={{ ...s.heading, color: "#5b9bd6" }}>Finding your fragrance…</h1>
            <p style={s.subtext}>Just a moment</p>
          </div>
        )}

        {phase === "error" && (
          <div style={s.textBlock}>
            <h1 style={{ ...s.heading, color: "#c0392b" }}>Fragrance not found</h1>
            <p style={{ ...s.subtext, color: "#c0392b", opacity: 0.85 }}>
              {errorMsg}
            </p>
            <p style={s.resetNote}>Resetting in {ERROR_DISPLAY_MS / 1000} seconds…</p>
          </div>
        )}
      </div>

      {/* Tagline */}
      <p style={s.tagline}>Discover · Compare · Choose</p>

      {/* Manual test input */}
      {showManual && phase !== "loading" && (
        <div style={s.manualBox} onClick={(e) => e.stopPropagation()}>
          <p style={s.manualLabel}>Test mode — enter UID or decimal</p>
          <div style={s.manualRow}>
            <input
              type="text"
              placeholder="e.g. 2346117917 or 04:03:2A:92:D4:13:91"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
              style={s.manualInput}
              onClick={(e) => e.stopPropagation()}
            />
            <button onClick={handleManualSubmit} style={s.manualBtn}>
              Submit
            </button>
          </div>
        </div>
      )}

      <button
        style={s.testToggle}
        onClick={(e) => { e.stopPropagation(); setShowManual((v) => !v); }}
      >
        {showManual ? "Hide test input" : "Test mode"}
      </button>
    </div>
  );
}

// ─── Scan graphic ─────────────────────────────────────────────────────────────

function ScanGraphic({ phase }: { phase: Phase }) {
  const isActive = phase === "scanning";
  const isLoading = phase === "loading";
  const isError = phase === "error";

  const circleColor = isError ? "#c0392b" : isActive || isLoading ? "#5b9bd6" : "#3a5a8a";
  const glowColor = isError
    ? "rgba(192,57,43,0.25)"
    : isActive || isLoading
    ? "rgba(91,155,214,0.3)"
    : "rgba(58,90,138,0.15)";

  return (
    <svg
      viewBox="0 0 220 200"
      width="220"
      height="200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id="glowGrad" cx="50%" cy="100%" r="50%">
          <stop offset="0%" stopColor={circleColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={circleColor} stopOpacity="0" />
        </radialGradient>
        <style>{`
          @keyframes scanPulse {
            0%, 100% { opacity: 0.3; r: 46; }
            50% { opacity: 0.9; r: 52; }
          }
          @keyframes outerRing {
            0% { opacity: 0.15; r: 58; }
            50% { opacity: 0.5; r: 64; }
            100% { opacity: 0.15; r: 58; }
          }
          @keyframes bottleFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
          }
          @keyframes spinLoad {
            to { transform: rotate(360deg); transform-origin: 110px 162px; }
          }
        `}</style>
      </defs>

      {/* Glow pool under circle */}
      <ellipse cx="110" cy="165" rx="62" ry="18" fill="url(#glowGrad)" />

      {/* Outer pulse ring */}
      <circle
        cx="110" cy="162" r="58"
        fill="none"
        stroke={circleColor}
        strokeWidth="1"
        style={{
          animation: isActive ? "outerRing 1.4s ease-in-out infinite" : "none",
          opacity: isActive ? 1 : 0.12,
        }}
      />

      {/* Scan circle */}
      <circle
        cx="110" cy="162" r="46"
        fill={glowColor}
        stroke={circleColor}
        strokeWidth="2.5"
        style={{
          animation: isActive ? "scanPulse 1.4s ease-in-out infinite" : "none",
          transition: "fill 0.4s, stroke 0.4s",
        }}
      />

      {/* Spinner arc when loading */}
      {isLoading && (
        <circle
          cx="110" cy="162" r="52"
          fill="none"
          stroke={circleColor}
          strokeWidth="2"
          strokeDasharray="60 270"
          strokeLinecap="round"
          style={{ animation: "spinLoad 0.9s linear infinite", transformOrigin: "110px 162px" }}
        />
      )}

      {/* Horizontal tick marks on circle edge */}
      {[0, 90, 180, 270].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 110 + 44 * Math.cos(rad);
        const y1 = 162 + 44 * Math.sin(rad);
        const x2 = 110 + 50 * Math.cos(rad);
        const y2 = 162 + 50 * Math.sin(rad);
        return (
          <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={circleColor} strokeWidth="2" opacity="0.6" />
        );
      })}

      {/* Perfume bottle */}
      <g style={{ animation: phase === "idle" ? "bottleFloat 3s ease-in-out infinite" : "none" }}>
        {/* Bottle cap */}
        <rect x="97" y="22" width="26" height="10" rx="3"
          fill="#c8a96e" />
        {/* Neck */}
        <rect x="103" y="32" width="14" height="22" rx="2"
          fill="#d4b882" />
        {/* Collar */}
        <rect x="99" y="52" width="22" height="6" rx="2"
          fill="#c8a96e" />
        {/* Body */}
        <rect x="84" y="58" width="52" height="78" rx="8"
          fill="white" fillOpacity="0.12"
          stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />
        {/* Liquid fill */}
        <rect x="86" y="80" width="48" height="54" rx="6"
          fill="#d4b882" fillOpacity="0.22" />
        {/* Label */}
        <rect x="91" y="72" width="38" height="42" rx="4"
          fill="white" fillOpacity="0.08"
          stroke="white" strokeOpacity="0.2" strokeWidth="1" />
        {/* Label lines */}
        <rect x="96" y="78" width="28" height="2" rx="1" fill="white" fillOpacity="0.3" />
        <rect x="99" y="83" width="22" height="1.5" rx="0.75" fill="white" fillOpacity="0.2" />
        <rect x="99" y="87" width="22" height="1.5" rx="0.75" fill="white" fillOpacity="0.2" />
        <rect x="99" y="91" width="16" height="1.5" rx="0.75" fill="white" fillOpacity="0.2" />
        {/* Highlight */}
        <rect x="87" y="62" width="8" height="40" rx="4"
          fill="white" fillOpacity="0.1" />
      </g>
    </svg>
  );
}

// ─── Ready pulse indicator ─────────────────────────────────────────────────────

function ReadyPulse() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
      <style>{`
        @keyframes readyPulse {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: "#5b9bd6",
        animation: "readyPulse 2.2s ease-in-out infinite",
        boxShadow: "0 0 8px rgba(91,155,214,0.6)",
      }} />
      <span style={{ fontSize: "0.78rem", color: "#5b9bd6", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        Ready to scan
      </span>
    </div>
  );
}

// ─── The Perfume Gallery logo (SVG wordmark) ──────────────────────────────────

function PerfumeGalleryLogo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      {/* Decorative top rule */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: 40, height: 1, background: "linear-gradient(to right, transparent, #c8a96e)" }} />
        {/* Diamond mark */}
        <svg width="10" height="10" viewBox="0 0 10 10">
          <polygon points="5,0 10,5 5,10 0,5" fill="#c8a96e" />
        </svg>
        <div style={{ width: 40, height: 1, background: "linear-gradient(to left, transparent, #c8a96e)" }} />
      </div>
      {/* Wordmark */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: "1.6rem",
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontWeight: 400,
          letterSpacing: "0.28em",
          color: "#f0e6d0",
          textTransform: "uppercase",
          lineHeight: 1.2,
        }}>
          The Perfume
        </div>
        <div style={{
          fontSize: "1.05rem",
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontWeight: 400,
          letterSpacing: "0.45em",
          color: "#c8a96e",
          textTransform: "uppercase",
          lineHeight: 1.4,
        }}>
          Gallery
        </div>
      </div>
      {/* Decorative bottom rule */}
      <div style={{ width: 90, height: 1, background: "linear-gradient(to right, transparent, #c8a96e, transparent)" }} />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100dvh",
    background: "#0d1117",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#f0e6d0",
    userSelect: "none",
    WebkitUserSelect: "none",
    position: "relative",
    overflow: "hidden",
    gap: "2rem",
  },
  ambientLeft: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(58,90,138,0.18) 0%, transparent 70%)",
    top: "-150px",
    left: "-150px",
    pointerEvents: "none",
  },
  ambientRight: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(200,169,110,0.1) 0%, transparent 70%)",
    bottom: "-100px",
    right: "-100px",
    pointerEvents: "none",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    pointerEvents: "none",
    width: 1,
    height: 1,
    top: 0,
    left: 0,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "transparent",
    caretColor: "transparent",
  },
  logoWrap: {
    position: "relative",
    zIndex: 1,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.75rem",
    padding: "2.5rem 3.5rem 3rem",
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(200,169,110,0.2)",
    borderRadius: "1.75rem",
    boxShadow: "0 0 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
    maxWidth: 480,
    width: "88vw",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
    backdropFilter: "blur(12px)",
  },
  scanGraphicWrap: {
    marginTop: "0.5rem",
    marginBottom: "-0.5rem",
  },
  textBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
  },
  heading: {
    fontSize: "clamp(1.5rem, 3.5vw, 2rem)",
    fontWeight: 400,
    fontFamily: "'Georgia', 'Times New Roman', serif",
    letterSpacing: "0.01em",
    color: "#f0e6d0",
    lineHeight: 1.35,
  },
  subtext: {
    fontSize: "1rem",
    color: "rgba(240,230,208,0.55)",
    lineHeight: 1.6,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  resetNote: {
    fontSize: "0.82rem",
    color: "rgba(240,230,208,0.35)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    marginTop: "0.25rem",
  },
  tagline: {
    fontSize: "0.72rem",
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: "rgba(200,169,110,0.45)",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    position: "relative",
    zIndex: 1,
  },
  manualBox: {
    position: "fixed",
    bottom: "5rem",
    background: "rgba(13,17,23,0.95)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "1rem",
    padding: "1rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    minWidth: 340,
    zIndex: 20,
    boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
  },
  manualLabel: {
    fontSize: "0.75rem",
    color: "rgba(200,169,110,0.6)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  manualRow: { display: "flex", gap: "0.5rem" },
  manualInput: {
    flex: 1,
    padding: "0.5rem 0.75rem",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(200,169,110,0.2)",
    borderRadius: "0.5rem",
    color: "#f0e6d0",
    fontSize: "0.88rem",
    outline: "none",
    fontFamily: "monospace",
  },
  manualBtn: {
    padding: "0.5rem 1rem",
    background: "#3a5a8a",
    color: "#fff",
    border: "none",
    borderRadius: "0.5rem",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.88rem",
  },
  testToggle: {
    position: "fixed",
    bottom: "1.5rem",
    right: "1.5rem",
    background: "transparent",
    border: "1px solid rgba(200,169,110,0.18)",
    color: "rgba(200,169,110,0.35)",
    borderRadius: "0.5rem",
    padding: "0.4rem 0.8rem",
    fontSize: "0.72rem",
    cursor: "pointer",
    zIndex: 20,
    letterSpacing: "0.05em",
  },
};
