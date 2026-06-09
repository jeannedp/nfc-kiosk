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

const NAVY       = "#1a237e";
const NAVY_MID   = "#283593";
const NAVY_LIGHT = "#e8eaf6";
const BLUE_SCAN  = "#1565c0";
const BLUE_GLOW  = "#42a5f5";
const FONT       = "'Barlow', 'Barlow Semi Condensed', system-ui, sans-serif";

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE LIBRARY
// ─────────────────────────────────────────────────────────────────────────────
// Drop image files into /public/images/ and update the paths below.
// The app falls back to the SVG illustration if any image is missing.
//
// LOGO
//   /public/images/TPG_logo.png  — The Perfume Gallery logo
//   Recommended: transparent PNG, any size (displayed at ~220px wide)
//
// KIOSK BOTTLE (home page scan screen)
//   /public/images/kiosk/bottle.png
//   Recommended: transparent PNG, portrait, ~300×600px
//
// KIOSK SCAN CIRCLE (home page)
//   /public/images/kiosk/scan-circle.png
//   Recommended: transparent PNG, landscape, ~400×140px
//   If omitted the SVG animated circle is used instead.
//
// PRODUCT BOTTLES (perfume/[slug] pages)
//   /public/images/products/aramis-impression.png
//   /public/images/products/kilian-old-fashioned.png
//   /public/images/products/pdm-percival.png
//   /public/images/products/pdm-delina.png
//   /public/images/products/amouage-outlands.png
//   Recommended: transparent PNG, portrait, ~400×700px
// ─────────────────────────────────────────────────────────────────────────────

const IMAGES = {
  logo:       "/images/TPG_logo.png",
  bottle:     "/images/kiosk/bottle.png",
  scanCircle: "/images/kiosk/scan-circle.png",
} as const;

// ─────────────────────────────────────────────────────────────────────────────

function KioskPageContent() {
  const searchParams = useSearchParams();
  const device   = searchParams.get("device") ?? undefined;
  const testMode = searchParams.get("test") === "1";

  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufferRef   = useRef<string>("");

  const [phase, setPhase]           = useState<Phase>("idle");
  const [errorMsg, setErrorMsg]     = useState<string>("");
  const [manualInput, setManualInput] = useState<string>("");
  const [showAdmin, setShowAdmin]   = useState(testMode);

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

  const isError  = phase === "error";
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

      <div style={s.divider} />

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main style={s.main}>

        <div style={s.illustrationWrap}>
          <KioskIllustration phase={phase} />
        </div>

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
              <h1 style={{ ...s.heading, color: BLUE_SCAN }}>Identifying fragrance…</h1>
              <p style={s.subtext}>Keep the bottle on the circle</p>
              <ScanningIndicator />
            </>
          )}

          {phase === "loading" && (
            <>
              <h1 style={{ ...s.heading, color: BLUE_SCAN }}>Finding your fragrance…</h1>
              <p style={s.subtext}>Just a moment</p>
              <ScanningIndicator />
            </>
          )}

          {isError && (
            <>
              <h1 style={{ ...s.heading, color: "#b71c1c" }}>Fragrance not found</h1>
              <p style={{ ...s.subtext, color: "#c62828" }}>{errorMsg}</p>
              <p style={s.resetNote}>Resetting in {ERROR_DISPLAY_MS / 1000} seconds…</p>
            </>
          )}
        </div>
      </main>

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

      {isActive && null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TPG LOGO — real image with SVG fallback
// ─────────────────────────────────────────────────────────────────────────────

function TPGLogo() {
  const [imgFailed, setImgFailed] = useState(false);

  if (!imgFailed) {
    return (
      <img
        src={IMAGES.logo}
        alt="The Perfume Gallery"
        height={60}
        style={{
          height: 60,
          width: "auto",
          maxWidth: 240,
          display: "block",

        }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  // ── Fallback: SVG recreation ──────────────────────────────────────────────
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
      <svg width="68" height="52" viewBox="0 0 72 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="1.5" width="69" height="53" stroke={NAVY} strokeWidth="3" fill="none"/>
        <rect x="1.5" y="1.5" width="18" height="16" fill="white"/>
        <rect x="52.5" y="38.5" width="18" height="16" fill="white"/>
        <text x="7"  y="37" fontFamily="'Barlow', sans-serif" fontSize="26" fontWeight="700" fill={NAVY} letterSpacing="-1">T</text>
        <text x="25" y="37" fontFamily="'Barlow', sans-serif" fontSize="26" fontWeight="700" fill={NAVY} letterSpacing="-1">P</text>
        <text x="44" y="37" fontFamily="'Barlow', sans-serif" fontSize="26" fontWeight="700" fill={NAVY} letterSpacing="-1">G</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {["THE", "PERFUME", "GALLERY"].map((w) => (
          <span key={w} style={{
            fontFamily: FONT, fontWeight: 600, fontSize: "1.1rem",
            color: NAVY, letterSpacing: "0.2em", lineHeight: 1.15,
            textTransform: "uppercase" as const,
          }}>{w}</span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KIOSK ILLUSTRATION — real images with animated SVG fallback
//
// Priority order:
//   1. /public/images/kiosk/bottle.png     — your photo / render of the bottle
//   2. /public/images/kiosk/scan-circle.png — your photo of the glowing circle
//   3. SVG fallback for anything missing
// ─────────────────────────────────────────────────────────────────────────────

function KioskIllustration({ phase }: { phase: Phase }) {
  const [bottleFailed, setBottleFailed] = useState(false);
  const [circleFailed, setCircleFailed] = useState(false);

  const isScanning = phase === "scanning" || phase === "loading";
  const isError    = phase === "error";

  const circleColor = isError ? "#c62828" : BLUE_SCAN;
  const glowColor   = isError ? "#ef5350" : BLUE_GLOW;
  const pulseAnim   = isScanning
    ? "scanRipple 1.4s ease-out infinite"
    : isError ? "none"
    : "idlePulse 3s ease-in-out infinite";

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>

      {/* ── Bottle ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: "relative",
        zIndex: 2,
        marginBottom: -16,
        background: "transparent",
        animation: isError
          ? "none"
          : isScanning
          ? "none"
          : "bottleFloat 4s ease-in-out infinite",
      }}>
        {!bottleFailed ? (
          <img
            src={IMAGES.bottle}
            alt="Perfume bottle"
            style={{
              height: 260,
              width: "auto",
              maxWidth: 200,
              display: "block",
              objectFit: "contain",
              background: "transparent",
              // CSS drop-shadow follows the alpha channel of a transparent PNG
              filter: "drop-shadow(0 12px 28px rgba(26,58,156,0.28)) drop-shadow(0 2px 6px rgba(0,0,0,0.15))",
            }}
            onError={() => setBottleFailed(true)}
          />
        ) : (
          // SVG fallback bottle
          <TPGBottleSVG phase={phase} />
        )}
      </div>

      {/* ── Scan circle ────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {!circleFailed ? (
          // Real image of the illuminated circle — animated overlay on top
          <div style={{ position: "relative", display: "inline-block" }}>
            <img
              src={IMAGES.scanCircle}
              alt="Scan circle"
              style={{
                width: 280,
                height: "auto",
                display: "block",
                objectFit: "contain",
                // Colour-shift on error state
                filter: isError
                  ? "hue-rotate(180deg) saturate(1.5)"
                  : isScanning
                  ? "brightness(1.25) saturate(1.3)"
                  : "none",
                transition: "filter 0.4s ease",
              }}
              onError={() => setCircleFailed(true)}
            />
            {/* Animated pulse ring overlaid on the image */}
            <svg
              viewBox="0 0 280 90"
              width="280"
              style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", overflow: "visible" }}
            >
              <ellipse cx="140" cy="50" rx="100" ry="16"
                fill="none" stroke={glowColor} strokeWidth="1.5"
                opacity={isScanning ? "0.7" : "0.2"}
                style={{ animation: pulseAnim }} />
              {isScanning && (
                <ellipse cx="140" cy="50" rx="80" ry="12"
                  fill="none" stroke={circleColor} strokeWidth="1"
                  opacity="0.6"
                  style={{ animation: "scanRipple 1.4s ease-out infinite 0.3s" }} />
              )}
              {isScanning && (
                <rect x="90" y="47" width="100" height="2.5" rx="1.25"
                  fill={circleColor} opacity="0.55"
                  style={{ animation: "scanBar 1.3s ease-in-out infinite" }} />
              )}
            </svg>
          </div>
        ) : (
          // SVG fallback circle
          <ScanCircleSVG phase={phase} />
        )}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG FALLBACKS — used when image files are not yet present
// ─────────────────────────────────────────────────────────────────────────────

function TPGBottleSVG({ phase }: { phase: Phase }) {
  const isScanning = phase === "scanning" || phase === "loading";
  const isError    = phase === "error";

  const COBALT      = "#1a3a9c";
  const COBALT_MID  = "#1e44b8";
  const COBALT_DARK = "#0f2566";
  const COBALT_LITE = "#2d55d4";
  const SILVER_MID  = "#e2e6ed";
  const SILVER_DARK = "#8a9099";

  return (
    <svg viewBox="0 0 160 340" width="130" height="276" xmlns="http://www.w3.org/2000/svg"
      style={{
        display: "block",
        filter: "drop-shadow(0 12px 32px rgba(26,58,156,0.35)) drop-shadow(0 2px 8px rgba(0,0,0,0.2))",
        animation: isError ? "none" : isScanning ? "none" : "bottleFloat 4s ease-in-out infinite",
      }}>
      <defs>
        <linearGradient id="bG" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={COBALT_DARK} />
          <stop offset="18%"  stopColor={COBALT_MID} />
          <stop offset="42%"  stopColor={COBALT_LITE} />
          <stop offset="58%"  stopColor={COBALT_MID} />
          <stop offset="100%" stopColor={COBALT_DARK} />
        </linearGradient>
        <linearGradient id="hG" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="white" stopOpacity="0" />
          <stop offset="50%"  stopColor="white" stopOpacity="0.22" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cG" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={SILVER_DARK} />
          <stop offset="25%"  stopColor={SILVER_MID} />
          <stop offset="50%"  stopColor="#ffffff" />
          <stop offset="75%"  stopColor={SILVER_MID} />
          <stop offset="100%" stopColor={SILVER_DARK} />
        </linearGradient>
        <radialGradient id="cT" cx="40%" cy="35%" r="60%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="100%" stopColor={SILVER_MID} />
        </radialGradient>
        <radialGradient id="sG" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.25)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="334" rx="52" ry="7" fill="url(#sG)" />
      <rect x="26" y="108" width="108" height="218" rx="16" fill="url(#bG)" />
      <ellipse cx="80" cy="116" rx="54" ry="10" fill={COBALT_MID} />
      <ellipse cx="80" cy="318" rx="54" ry="10" fill={COBALT_DARK} />
      <rect x="38" y="115" width="44" height="210" rx="12" fill="url(#hG)" />
      <rect x="26" y="116" width="18" height="206" rx="8" fill="rgba(0,0,0,0.18)" />
      <rect x="116" y="116" width="18" height="206" rx="8" fill="rgba(0,0,0,0.22)" />
      <rect x="36" y="148" width="88" height="130" rx="3" fill="white" fillOpacity="0.1" />
      <rect x="48" y="155" width="38" height="29" fill="none" stroke="white" strokeWidth="1.8" />
      <rect x="48" y="155" width="10" height="8" fill={COBALT} />
      <rect x="76" y="176" width="10" height="8" fill={COBALT} />
      <text x="51" y="175" fontFamily="'Barlow', sans-serif" fontSize="13" fontWeight="700" fill="white" letterSpacing="0.5">TPG</text>
      <text x="52" y="196" fontFamily="'Barlow', sans-serif" fontSize="6.5" fontWeight="600" fill="white" letterSpacing="1.5">THE</text>
      <text x="52" y="205" fontFamily="'Barlow', sans-serif" fontSize="6.5" fontWeight="600" fill="white" letterSpacing="1.5">PERFUME</text>
      <text x="52" y="214" fontFamily="'Barlow', sans-serif" fontSize="6.5" fontWeight="600" fill="white" letterSpacing="1.5">GALLERY</text>
      <line x1="40" y1="256" x2="120" y2="256" stroke="white" strokeWidth="0.75" opacity="0.35" />
      <text x="80" y="270" textAnchor="middle" fontFamily="'Barlow', sans-serif" fontSize="7" fontWeight="500" fill="white" letterSpacing="2" opacity="0.75">EXTRAIT | 30ml</text>
      <rect x="52" y="70" width="56" height="42" rx="6" fill="url(#cG)" />
      <ellipse cx="80" cy="72" rx="28" ry="5.5" fill={SILVER_MID} />
      <ellipse cx="80" cy="110" rx="28" ry="5" fill={SILVER_MID} />
      <rect x="56" y="72" width="16" height="40" rx="4" fill="white" opacity="0.2" />
      <rect x="48" y="104" width="64" height="8" rx="3" fill="url(#cG)" />
      <ellipse cx="80" cy="104" rx="32" ry="5" fill={SILVER_MID} />
      <rect x="46" y="14" width="68" height="58" rx="12" fill="url(#cG)" />
      <ellipse cx="80" cy="16" rx="34" ry="9" fill="url(#cT)" />
      <ellipse cx="80" cy="70" rx="34" ry="7" fill={SILVER_MID} />
      <rect x="46" y="18" width="14" height="52" rx="6" fill="rgba(0,0,0,0.12)" />
      <rect x="100" y="18" width="14" height="52" rx="6" fill="rgba(0,0,0,0.15)" />
      <rect x="60" y="16" width="24" height="52" rx="8" fill="white" opacity="0.18" />
      <rect x="46" y="62" width="68" height="5" rx="2" fill={SILVER_DARK} opacity="0.4" />
    </svg>
  );
}

function ScanCircleSVG({ phase }: { phase: Phase }) {
  const isScanning = phase === "scanning" || phase === "loading";
  const isError    = phase === "error";

  const circleColor = isError ? "#c62828" : BLUE_SCAN;
  const glowColor   = isError ? "#ef5350" : BLUE_GLOW;
  const pulseAnim   = isScanning
    ? "scanRipple 1.4s ease-out infinite"
    : isError ? "none"
    : "idlePulse 3s ease-in-out infinite";

  return (
    <svg viewBox="0 0 300 100" width="280"
      style={{ display: "block", overflow: "visible" }}
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cgl" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={glowColor} stopOpacity={isScanning ? "0.5" : isError ? "0.15" : "0.28"} />
          <stop offset="60%"  stopColor={glowColor} stopOpacity={isScanning ? "0.15" : "0.06"} />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="srf" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#f2f2f2" />
          <stop offset="100%" stopColor="#e4e4e4" />
        </linearGradient>
      </defs>
      <rect x="10" y="56" width="280" height="36" rx="6" fill="url(#srf)" />
      <rect x="10" y="54" width="280" height="5" rx="2.5" fill="#ebebeb" />
      <ellipse cx="150" cy="68" rx="90" ry="22" fill="url(#cgl)" />
      <ellipse cx="150" cy="66" rx="78" ry="13"
        fill="none" stroke={glowColor} strokeWidth="1"
        opacity={isScanning ? "0.7" : isError ? "0.15" : "0.25"}
        style={{ animation: pulseAnim }} />
      <ellipse cx="150" cy="66" rx="64" ry="10.5"
        fill="none" stroke={circleColor} strokeWidth="1.2"
        opacity={isScanning ? "0.85" : "0.4"}
        style={{ animation: isScanning ? "scanRipple 1.4s ease-out infinite 0.25s" : "none" }} />
      <ellipse cx="150" cy="66" rx="52" ry="8.5"
        fill={isScanning ? `${glowColor}22` : isError ? "rgba(198,40,40,0.06)" : `${BLUE_SCAN}0e`}
        stroke={circleColor} strokeWidth="2" />
      <ellipse cx="150" cy="66" rx="36" ry="5.8"
        fill="none" stroke={circleColor} strokeWidth="0.75" strokeDasharray="5 3.5" opacity="0.45" />
      {[0, 90, 180, 270].map((deg) => {
        const r = Math.PI / 180;
        const ox = 150, oy = 66, ra = 50, rb = 8;
        const x1 = ox + (ra - 5) * Math.cos(deg * r), y1 = oy + (rb - 1) * Math.sin(deg * r);
        const x2 = ox + (ra + 5) * Math.cos(deg * r), y2 = oy + (rb + 1) * Math.sin(deg * r);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={circleColor} strokeWidth="1.5" opacity="0.55" />;
      })}
      {isScanning && (
        <rect x="98" y="63" width="104" height="2.5" rx="1.25"
          fill={circleColor} opacity="0.6"
          style={{ animation: "scanBar 1.3s ease-in-out infinite" }} />
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCANNING INDICATOR
// ─────────────────────────────────────────────────────────────────────────────

function ScanningIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "4px" }}>
      {[0, 0.15, 0.3, 0.45, 0.6].map((delay, i) => (
        <div key={i} style={{
          width: 4, height: 20, borderRadius: 2,
          background: BLUE_SCAN,
          animation: "barBounce 0.9s ease-in-out infinite",
          animationDelay: `${delay}s`,
          opacity: 0.85,
        }} />
      ))}
      <span style={{
        marginLeft: "8px", fontSize: "0.78rem", fontFamily: FONT,
        color: BLUE_SCAN, letterSpacing: "0.18em",
        textTransform: "uppercase" as const, fontWeight: 600,
      }}>Scanning</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KEYFRAMES + GOOGLE FONTS
// ─────────────────────────────────────────────────────────────────────────────

const globalKeyframes = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&family=Barlow+Semi+Condensed:wght@400;600;700&display=swap');

  @keyframes idlePulse {
    0%, 100% { opacity: 0.25; }
    50%       { opacity: 0.55; }
  }
  @keyframes scanRipple {
    0%   { opacity: 0.85; transform: scale(1);   }
    100% { opacity: 0;    transform: scale(1.4); }
  }
  @keyframes bottleFloat {
    0%, 100% { transform: translateY(0px);  }
    50%       { transform: translateY(-8px); }
  }
  @keyframes scanBar {
    0%   { width: 0px;   opacity: 0.3; }
    50%  { width: 104px; opacity: 0.8; }
    100% { width: 0px;   opacity: 0.3; }
  }
  @keyframes barBounce {
    0%, 100% { transform: scaleY(0.35); opacity: 0.35; }
    50%       { transform: scaleY(1);    opacity: 1;    }
  }
  @keyframes readyBlink {
    0%, 100% { opacity: 0.45; transform: scale(0.88); }
    50%       { opacity: 1;    transform: scale(1.18); }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

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
    fontFamily: FONT,
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
  header: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2.25rem 2rem 1.5rem",
    gap: "0.65rem",
    background: "#ffffff",
  },
  tagline: {
    fontSize: "0.75rem",
    fontFamily: FONT,
    fontWeight: 400,
    color: NAVY_MID,
    letterSpacing: "0.35em",
    textTransform: "uppercase" as const,
    margin: 0,
    opacity: 0.6,
  },
  divider: {
    width: "100%",
    height: "1px",
    background: `linear-gradient(to right, transparent, ${NAVY_LIGHT}, ${NAVY_LIGHT}, transparent)`,
    flexShrink: 0,
  },
  main: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem 2rem 1rem",
    gap: "1.75rem",
  },
  illustrationWrap: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },
  statusBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.7rem",
    textAlign: "center",
    width: "100%",
  },
  heading: {
    fontSize: "clamp(1.3rem, 4vw, 1.65rem)",
    fontFamily: FONT,
    fontWeight: 300,
    color: NAVY,
    lineHeight: 1.38,
    letterSpacing: "0.02em",
    margin: 0,
  },
  subtext: {
    fontSize: "0.93rem",
    fontFamily: FONT,
    fontWeight: 400,
    color: "#546e7a",
    lineHeight: 1.65,
    margin: 0,
    maxWidth: 360,
    letterSpacing: "0.02em",
  },
  resetNote: {
    fontSize: "0.78rem",
    fontFamily: FONT,
    color: "#90a4ae",
    margin: 0,
    letterSpacing: "0.04em",
  },
  readyBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "4px",
    padding: "6px 18px",
    background: NAVY_LIGHT,
    borderRadius: "999px",
    border: `1px solid ${BLUE_SCAN}25`,
  },
  readyDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: BLUE_SCAN,
    animation: "readyBlink 2.5s ease-in-out infinite",
    boxShadow: `0 0 7px ${BLUE_SCAN}90`,
    flexShrink: 0,
  },
  readyLabel: {
    fontSize: "0.72rem",
    fontFamily: FONT,
    fontWeight: 600,
    color: BLUE_SCAN,
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
  },
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
    fontSize: "0.68rem",
    fontFamily: FONT,
    fontWeight: 500,
    color: "#b0bec5",
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
  },
  footerDot: { color: "#cfd8dc", fontSize: "0.68rem" },
  adminWrap: {
    position: "fixed" as const,
    bottom: 0, left: 0, right: 0,
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
    fontSize: "0.68rem",
    fontFamily: FONT,
    fontWeight: 500,
    color: "#90a4ae",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
  },
  adminToggleDash: {
    display: "inline-block",
    width: 16, height: 2,
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
    fontSize: "0.72rem",
    fontFamily: FONT,
    color: "#90a4ae",
    letterSpacing: "0.05em",
    margin: 0,
  },
  adminRow: { display: "flex", gap: "0.5rem" },
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
    fontSize: "0.85rem",
    fontFamily: FONT,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    whiteSpace: "nowrap" as const,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SUSPENSE WRAPPER — required by Next.js 14 for useSearchParams
// ─────────────────────────────────────────────────────────────────────────────

export default function KioskPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#ffffff" }} />}>
      <KioskPageContent />
    </Suspense>
  );
}
