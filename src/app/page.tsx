"use client";

// ─── IMPORTANT ───────────────────────────────────────────────────────────────
// Only the UI has changed. All routing logic, API calls, UID lookup, Supabase
// integration and useSearchParams implementation are preserved exactly.
// ─────────────────────────────────────────────────────────────────────────────

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

type Phase = "idle" | "scanning" | "loading" | "error";

const DEBOUNCE_MS = 400;
const ERROR_DISPLAY_MS = 5000;

// Brand colours — TPG navy palette
const NAVY = "#1a237e";
const NAVY_MID = "#283593";
const NAVY_LIGHT = "#e8eaf6";
const BLUE_SCAN = "#1565c0";
const BLUE_GLOW = "#42a5f5";

function KioskPageContent() {
  const searchParams = useSearchParams();
  const device = searchParams.get("device") ?? undefined;
  const testMode = searchParams.get("test") === "1";

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufferRef = useRef<string>("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [manualInput, setManualInput] = useState<string>("");
  const [showAdmin, setShowAdmin] = useState(testMode);

  // ── Focus management ──────────────────────────────────────────────────────
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

  // ── UID submission ────────────────────────────────────────────────────────
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

  // ── Keyboard-wedge handlers ───────────────────────────────────────────────
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

  // ── Derived state for UI ──────────────────────────────────────────────────
  const isError = phase === "error";
  const isActive = phase === "scanning" || phase === "loading";

  return (
    <div style={s.root}>
      <style>{globalKeyframes}</style>

      {/* Hidden keyboard-wedge capture input — DO NOT REMOVE */}
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

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={s.header}>
        <TPGLogo />
        <p style={s.tagline}>Discover Your Signature</p>
      </header>

      {/* ── Divider ────────────────────────────────────────────────────────── */}
      <div style={s.divider} />

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main style={s.main}>

        {/* Illustration */}
        <div style={s.illustrationWrap}>
          <KioskIllustration phase={phase} />
        </div>

        {/* Status block */}
        <div style={s.statusBlock}>
          {phase === "idle" && (
            <>
              <h1 style={s.heading}>
                Place your perfume bottle on the illuminated blue circle
              </h1>
              <p style={s.subtext}>
                Discover fragrance notes, pricing, concentration and similar perfumes.
              </p>
              <div style={s.readyBadge}>
                <span style={s.readyDot} />
                <span style={s.readyLabel}>Ready to scan</span>
              </div>
            </>
          )}

          {phase === "scanning" && (
            <>
              <h1 style={{ ...s.heading, color: BLUE_SCAN }}>
                Identifying fragrance…
              </h1>
              <p style={s.subtext}>Keep the bottle on the circle</p>
              <ScanningIndicator />
            </>
          )}

          {phase === "loading" && (
            <>
              <h1 style={{ ...s.heading, color: BLUE_SCAN }}>
                Finding your fragrance…
              </h1>
              <p style={s.subtext}>Just a moment</p>
              <ScanningIndicator />
            </>
          )}

          {isError && (
            <>
              <h1 style={{ ...s.heading, color: "#b71c1c" }}>
                Fragrance not found
              </h1>
              <p style={{ ...s.subtext, color: "#c62828" }}>
                {errorMsg}
              </p>
              <p style={s.resetNote}>
                Resetting in {ERROR_DISPLAY_MS / 1000} seconds…
              </p>
            </>
          )}
        </div>
      </main>

      {/* ── Divider ────────────────────────────────────────────────────────── */}
      <div style={s.divider} />

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={s.footer}>
        <span style={s.footerText}>The Perfume Gallery</span>
        <span style={s.footerDot}>·</span>
        <span style={s.footerText}>theperfumegallery.co.za</span>
      </footer>

      {/* ── Administrator testing panel ─────────────────────────────────────── */}
      <div style={s.adminWrap}>
        <button
          style={s.adminToggle}
          onClick={(e) => { e.stopPropagation(); setShowAdmin((v) => !v); }}
        >
          <span style={s.adminToggleDash} />
          Administrator Testing
          <span style={{ ...s.adminChevron, transform: showAdmin ? "rotate(180deg)" : "rotate(0deg)" }}>
            ▾
          </span>
        </button>

        {showAdmin && (
          <div style={s.adminPanel} onClick={(e) => e.stopPropagation()}>
            <p style={s.adminPanelLabel}>Enter UID or decimal card number to test lookup</p>
            <div style={s.adminRow}>
              <input
                type="text"
                placeholder="e.g. 2346117917 or 04:03:2A:92:D4:13:91"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                style={s.adminInput}
                onClick={(e) => e.stopPropagation()}
              />
              <button onClick={handleManualSubmit} style={s.adminSubmitBtn}>
                Lookup
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Suppress TS unused var warnings */}
      {isActive && null}
    </div>
  );
}

// ─── TPG Logo (SVG recreation of the actual logo) ─────────────────────────────

function TPGLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      {/* TPG monogram mark */}
      <svg width="72" height="56" viewBox="0 0 72 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer rectangle frame */}
        <rect x="1.5" y="1.5" width="69" height="53" rx="0" stroke={NAVY} strokeWidth="3" fill="none"/>
        {/* Inner cutout top-left */}
        <rect x="1.5" y="1.5" width="18" height="16" fill="white"/>
        {/* Inner cutout bottom-right */}
        <rect x="52.5" y="38.5" width="18" height="16" fill="white"/>
        {/* T */}
        <text x="7" y="37" fontFamily="Arial, sans-serif" fontSize="26" fontWeight="700" fill={NAVY} letterSpacing="-1">T</text>
        {/* P */}
        <text x="25" y="37" fontFamily="Arial, sans-serif" fontSize="26" fontWeight="700" fill={NAVY} letterSpacing="-1">P</text>
        {/* G */}
        <text x="44" y="37" fontFamily="Arial, sans-serif" fontSize="26" fontWeight="700" fill={NAVY} letterSpacing="-1">G</text>
      </svg>

      {/* Wordmark */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
        <span style={{
          fontSize: "1.25rem",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 400,
          color: NAVY,
          letterSpacing: "0.18em",
          textTransform: "uppercase" as const,
          lineHeight: 1.1,
        }}>THE</span>
        <span style={{
          fontSize: "1.25rem",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 400,
          color: NAVY,
          letterSpacing: "0.18em",
          textTransform: "uppercase" as const,
          lineHeight: 1.1,
        }}>PERFUME</span>
        <span style={{
          fontSize: "1.25rem",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 400,
          color: NAVY,
          letterSpacing: "0.18em",
          textTransform: "uppercase" as const,
          lineHeight: 1.1,
        }}>GALLERY</span>
      </div>
    </div>
  );
}

// ─── Kiosk illustration ───────────────────────────────────────────────────────
// Shows a hand placing a perfume bottle onto a glowing blue circle.

function KioskIllustration({ phase }: { phase: Phase }) {
  const isScanning = phase === "scanning" || phase === "loading";
  const isError = phase === "error";

  const circleStroke = isError ? "#c62828" : BLUE_SCAN;
  const glowOpacity = isScanning ? 0.55 : isError ? 0.2 : 0.32;
  const pulseAnim = isScanning ? "scanRipple 1.5s ease-out infinite" : isError ? "none" : "idlePulse 3s ease-in-out infinite";

  return (
    <svg
      viewBox="0 0 340 360"
      width="100%"
      style={{ maxWidth: 320, display: "block", margin: "0 auto", overflow: "visible" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="circleGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isError ? "#ef5350" : BLUE_GLOW} stopOpacity={glowOpacity} />
          <stop offset="70%" stopColor={isError ? "#ef5350" : BLUE_GLOW} stopOpacity={glowOpacity * 0.3} />
          <stop offset="100%" stopColor={isError ? "#ef5350" : BLUE_GLOW} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="surfaceGrad" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#f5f5f5" />
          <stop offset="100%" stopColor="#e0e0e0" />
        </radialGradient>
        <filter id="softBlur">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Counter surface */}
      <ellipse cx="170" cy="320" rx="155" ry="22" fill="#e8e8e8" />
      <rect x="15" y="300" width="310" height="22" rx="4" fill="url(#surfaceGrad)" />
      <rect x="15" y="296" width="310" height="6" rx="3" fill="#eeeeee" />

      {/* Outer glow rings */}
      <ellipse
        cx="170" cy="305" rx="90" ry="14"
        fill="none"
        stroke={isError ? "#ef5350" : BLUE_GLOW}
        strokeWidth="1"
        opacity={isScanning ? "0.6" : "0.2"}
        style={{ animation: pulseAnim }}
      />
      <ellipse
        cx="170" cy="305" rx="70" ry="11"
        fill="none"
        stroke={isError ? "#ef5350" : BLUE_GLOW}
        strokeWidth="1.5"
        opacity={isScanning ? "0.8" : "0.35"}
        style={{ animation: isScanning ? "scanRipple 1.5s ease-out infinite 0.3s" : "none" }}
      />

      {/* Blue scan circle on counter */}
      <ellipse cx="170" cy="305" rx="58" ry="9" fill="url(#circleGlow)" />
      <ellipse
        cx="170" cy="305" rx="52" ry="8"
        fill={isError ? "rgba(198,40,40,0.08)" : "rgba(21,101,192,0.12)"}
        stroke={circleStroke}
        strokeWidth="2"
      />
      {/* Circle inner detail */}
      <ellipse cx="170" cy="305" rx="36" ry="5.5"
        fill="none"
        stroke={circleStroke}
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.5"
      />

      {/* Perfume bottle body */}
      <g style={{ animation: isScanning ? "none" : "bottleSettle 4s ease-in-out infinite" }}>
        {/* Bottle cap */}
        <rect x="150" y="60" width="40" height="14" rx="4" fill={NAVY} />
        <rect x="153" y="58" width="34" height="5" rx="2.5" fill={NAVY_MID} />

        {/* Atomiser neck */}
        <rect x="161" y="74" width="18" height="28" rx="3" fill="#b0bec5" />
        <rect x="163" y="74" width="6" height="28" rx="2" fill="#cfd8dc" opacity="0.6" />

        {/* Collar ring */}
        <rect x="148" y="100" width="44" height="9" rx="3" fill={NAVY} />

        {/* Main body */}
        <rect x="130" y="109" width="80" height="130" rx="12" fill="#fafafa" stroke="#e0e0e0" strokeWidth="1.5" />

        {/* Liquid level */}
        <rect x="133" y="155" width="74" height="82" rx="8" fill={NAVY_LIGHT} opacity="0.7" />
        <rect x="133" y="153" width="74" height="5" rx="2" fill={NAVY} opacity="0.12" />

        {/* Label */}
        <rect x="139" y="120" width="62" height="85" rx="5"
          fill="white" stroke="#e8eaf6" strokeWidth="1" />

        {/* Label: brand name bar */}
        <rect x="139" y="120" width="62" height="22" rx="5" fill={NAVY} />
        <rect x="139" y="131" width="62" height="11" rx="0" fill={NAVY} />
        <text x="170" y="136" textAnchor="middle" fontFamily="Georgia, serif" fontSize="8"
          fill="white" letterSpacing="2">PARFUM</text>

        {/* Label: decorative lines */}
        <line x1="148" y1="153" x2="192" y2="153" stroke={NAVY} strokeWidth="0.75" opacity="0.3" />
        <rect x="148" y="157" width="44" height="2" rx="1" fill={NAVY} opacity="0.15" />
        <rect x="152" y="162" width="36" height="1.5" rx="0.75" fill={NAVY} opacity="0.12" />
        <rect x="152" y="167" width="30" height="1.5" rx="0.75" fill={NAVY} opacity="0.1" />
        <rect x="154" y="172" width="22" height="1.5" rx="0.75" fill={NAVY} opacity="0.08" />

        {/* Body highlight */}
        <rect x="133" y="112" width="10" height="80" rx="5" fill="white" opacity="0.45" />

        {/* Bottom of bottle */}
        <rect x="130" y="229" width="80" height="10" rx="6" fill="#e0e0e0" />
      </g>

      {/* Hand placing bottle — elegant feminine hand */}
      <g style={{ animation: isScanning ? "handDown 1.8s ease-in-out infinite" : "handHover 3.5s ease-in-out infinite" }}>
        {/* Wrist / lower palm */}
        <ellipse cx="235" cy="260" rx="18" ry="10" fill="#f5e6d8" />
        <rect x="218" y="245" width="36" height="22" rx="10" fill="#f5e6d8" />

        {/* Palm */}
        <ellipse cx="232" cy="240" rx="16" ry="13" fill="#f5e6d8" />

        {/* Thumb */}
        <ellipse cx="219" cy="238" rx="6" ry="10"
          fill="#f5e6d8"
          transform="rotate(-20 219 238)" />

        {/* Index finger */}
        <rect x="231" y="210" width="9" height="28" rx="4.5" fill="#f5e6d8" />
        <ellipse cx="235.5" cy="210" rx="4.5" ry="5" fill="#f5e6d8" />

        {/* Middle finger */}
        <rect x="222" y="208" width="9" height="30" rx="4.5" fill="#f5e6d8" />
        <ellipse cx="226.5" cy="208" rx="4.5" ry="5" fill="#f5e6d8" />

        {/* Ring finger */}
        <rect x="213" y="211" width="9" height="27" rx="4.5" fill="#f5e6d8" />
        <ellipse cx="217.5" cy="211" rx="4.5" ry="5" fill="#f5e6d8" />

        {/* Pinky */}
        <rect x="205" y="218" width="8" height="20" rx="4" fill="#f5e6d8" />
        <ellipse cx="209" cy="218" rx="4" ry="4.5" fill="#f5e6d8" />

        {/* Finger detail lines */}
        <line x1="232" y1="224" x2="237" y2="224" stroke="#e8c8a8" strokeWidth="0.75" opacity="0.7" />
        <line x1="223" y1="224" x2="229" y2="224" stroke="#e8c8a8" strokeWidth="0.75" opacity="0.7" />
        <line x1="214" y1="225" x2="220" y2="225" stroke="#e8c8a8" strokeWidth="0.75" opacity="0.7" />

        {/* Nail highlights */}
        <ellipse cx="235.5" cy="207" rx="3" ry="3.5" fill="#fce4d6" opacity="0.8" />
        <ellipse cx="226.5" cy="205" rx="3" ry="3.5" fill="#fce4d6" opacity="0.8" />
        <ellipse cx="217.5" cy="208" rx="3" ry="3.5" fill="#fce4d6" opacity="0.8" />
      </g>

      {/* Scanning indicator bar */}
      {(phase === "scanning" || phase === "loading") && (
        <g>
          <rect x="110" y="280" width="120" height="3" rx="1.5" fill="#e3f2fd" />
          <rect x="110" y="280" width="120" height="3" rx="1.5" fill={BLUE_SCAN} opacity="0.9"
            style={{ animation: "scanBar 1.4s ease-in-out infinite" }} />
        </g>
      )}
    </svg>
  );
}

// ─── Scanning indicator (animated bars) ──────────────────────────────────────

function ScanningIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "4px" }}>
      {[0, 0.15, 0.3, 0.45, 0.6].map((delay, i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: 20,
            borderRadius: 2,
            background: BLUE_SCAN,
            animation: `barBounce 0.9s ease-in-out infinite`,
            animationDelay: `${delay}s`,
            opacity: 0.85,
          }}
        />
      ))}
      <span style={{
        marginLeft: "8px",
        fontSize: "0.8rem",
        color: BLUE_SCAN,
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
        fontWeight: 500,
      }}>
        Scanning
      </span>
    </div>
  );
}

// ─── Keyframe animations ──────────────────────────────────────────────────────

const globalKeyframes = `
  @keyframes idlePulse {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.5; }
  }
  @keyframes scanRipple {
    0% { opacity: 0.8; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.35); }
  }
  @keyframes bottleSettle {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  @keyframes handHover {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-5px); }
  }
  @keyframes handDown {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(8px); }
  }
  @keyframes scanBar {
    0% { width: 0px; }
    60% { width: 120px; }
    100% { width: 0px; }
  }
  @keyframes barBounce {
    0%, 100% { transform: scaleY(0.4); opacity: 0.4; }
    50% { transform: scaleY(1); opacity: 1; }
  }
  @keyframes readyBlink {
    0%, 100% { opacity: 0.5; transform: scale(0.9); }
    50% { opacity: 1; transform: scale(1.15); }
  }
`;

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100dvh",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    color: NAVY,
    userSelect: "none",
    WebkitUserSelect: "none",
    position: "relative",
    overflow: "hidden",
    padding: "0 0 0 0",
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

  // Header
  header: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2.5rem 2rem 1.5rem",
    gap: "0.75rem",
    background: "#ffffff",
  },
  tagline: {
    fontSize: "0.82rem",
    fontFamily: "Georgia, 'Times New Roman', serif",
    color: NAVY_MID,
    letterSpacing: "0.28em",
    textTransform: "uppercase" as const,
    margin: 0,
    opacity: 0.75,
  },

  // Divider
  divider: {
    width: "100%",
    height: "1px",
    background: `linear-gradient(to right, transparent, ${NAVY_LIGHT}, ${NAVY_LIGHT}, transparent)`,
    flexShrink: 0,
  },

  // Main
  main: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem 2rem 1rem",
    gap: "1.5rem",
  },
  illustrationWrap: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },

  // Status text
  statusBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.65rem",
    textAlign: "center",
    width: "100%",
  },
  heading: {
    fontSize: "clamp(1.35rem, 4vw, 1.75rem)",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontWeight: 400,
    color: NAVY,
    lineHeight: 1.35,
    letterSpacing: "0.01em",
    margin: 0,
  },
  subtext: {
    fontSize: "0.975rem",
    color: "#546e7a",
    lineHeight: 1.6,
    margin: 0,
    fontFamily: "system-ui, -apple-system, sans-serif",
    maxWidth: 360,
  },
  resetNote: {
    fontSize: "0.8rem",
    color: "#90a4ae",
    margin: 0,
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "0.02em",
  },

  // Ready badge
  readyBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "4px",
    padding: "6px 16px",
    background: NAVY_LIGHT,
    borderRadius: "999px",
    border: `1px solid ${BLUE_SCAN}22`,
  },
  readyDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: BLUE_SCAN,
    animation: "readyBlink 2.5s ease-in-out infinite",
    boxShadow: `0 0 6px ${BLUE_SCAN}80`,
    flexShrink: 0,
  },
  readyLabel: {
    fontSize: "0.75rem",
    color: BLUE_SCAN,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    fontFamily: "system-ui, sans-serif",
  },

  // Footer
  footer: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    padding: "1rem 2rem",
    background: "#ffffff",
  },
  footerText: {
    fontSize: "0.72rem",
    color: "#b0bec5",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    fontFamily: "system-ui, sans-serif",
  },
  footerDot: {
    color: "#cfd8dc",
    fontSize: "0.72rem",
  },

  // Admin panel
  adminWrap: {
    position: "fixed" as const,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  adminToggle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 20px",
    background: "#f5f5f5",
    border: "1px solid #e0e0e0",
    borderBottom: "none",
    borderRadius: "8px 8px 0 0",
    cursor: "pointer",
    fontSize: "0.72rem",
    color: "#90a4ae",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    fontFamily: "system-ui, sans-serif",
  },
  adminToggleDash: {
    display: "inline-block",
    width: 16,
    height: 2,
    background: "#b0bec5",
    borderRadius: 1,
  },
  adminChevron: {
    display: "inline-block",
    transition: "transform 0.2s ease",
    lineHeight: 1,
    color: "#b0bec5",
  },
  adminPanel: {
    width: "100%",
    background: "#fafafa",
    borderTop: "1px solid #e0e0e0",
    padding: "1rem 1.5rem 1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  adminPanelLabel: {
    fontSize: "0.75rem",
    color: "#90a4ae",
    letterSpacing: "0.05em",
    margin: 0,
    fontFamily: "system-ui, sans-serif",
  },
  adminRow: {
    display: "flex",
    gap: "0.5rem",
  },
  adminInput: {
    flex: 1,
    padding: "0.55rem 0.85rem",
    border: "1px solid #e0e0e0",
    borderRadius: "6px",
    background: "#ffffff",
    color: "#37474f",
    fontSize: "0.88rem",
    outline: "none",
    fontFamily: "monospace",
  },
  adminSubmitBtn: {
    padding: "0.55rem 1.25rem",
    background: NAVY,
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.88rem",
    fontFamily: "system-ui, sans-serif",
    letterSpacing: "0.03em",
    whiteSpace: "nowrap" as const,
  },
};

// ─── Suspense wrapper (required by Next.js 14 for useSearchParams) ─────────────

export default function KioskPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#ffffff" }} />}>
      <KioskPageContent />
    </Suspense>
  );
}
