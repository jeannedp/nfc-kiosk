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

  // Always keep focus on the hidden input
  useEffect(() => {
    focusInput();
    const onVisibilityChange = () => {
      if (!document.hidden) focusInput();
    };
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
          setErrorMsg(data.message ?? "Card not recognised. Please contact support.");
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
        return;
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
    if (manualInput.trim()) {
      submitUID(manualInput.trim());
    }
  };

  return (
    <div className="kiosk-root" style={styles.root}>
      {/* Hidden keyboard-wedge input */}
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
        style={styles.hiddenInput}
        tabIndex={0}
      />

      <div style={styles.card}>
        {phase === "idle" && (
          <>
            <div style={styles.iconRing}>
              <NfcIcon />
            </div>
            <h1 style={styles.heading}>Tap card to continue</h1>
            <p style={styles.subtext}>Hold your NFC card near the reader</p>
            <div style={styles.statusDot} />
          </>
        )}

        {phase === "scanning" && (
          <>
            <div style={{ ...styles.iconRing, ...styles.iconRingActive }}>
              <NfcIcon />
            </div>
            <h1 style={{ ...styles.heading, ...styles.headingActive }}>Reading card…</h1>
            <p style={styles.subtext}>Keep card near the reader</p>
            <div style={{ ...styles.statusDot, ...styles.statusDotActive }} />
          </>
        )}

        {phase === "loading" && (
          <>
            <div style={{ ...styles.iconRing, ...styles.iconRingLoading }}>
              <SpinnerIcon />
            </div>
            <h1 style={styles.heading}>Opening…</h1>
            <p style={styles.subtext}>Redirecting you now</p>
          </>
        )}

        {phase === "error" && (
          <>
            <div style={{ ...styles.iconRing, ...styles.iconRingError }}>
              <ErrorIcon />
            </div>
            <h1 style={{ ...styles.heading, ...styles.headingError }}>Card not recognised</h1>
            <p style={{ ...styles.subtext, color: "var(--kiosk-error)" }}>
              {errorMsg || "Please contact support."}
            </p>
            <p style={styles.resetNote}>Resetting in {ERROR_DISPLAY_MS / 1000} seconds…</p>
          </>
        )}
      </div>

      {/* Manual test mode */}
      {showManual && phase !== "loading" && (
        <div style={styles.manualBox}>
          <p style={styles.manualLabel}>Manual test input</p>
          <div style={styles.manualRow}>
            <input
              type="text"
              placeholder="e.g. 04:03:2A:92:D4:13:91"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
              style={styles.manualInput}
              onClick={(e) => e.stopPropagation()}
            />
            <button onClick={handleManualSubmit} style={styles.manualBtn}>
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Toggle test mode link (bottom corner) */}
      <button
        style={styles.testToggle}
        onClick={(e) => {
          e.stopPropagation();
          setShowManual((v) => !v);
        }}
      >
        {showManual ? "Hide test input" : "Test mode"}
      </button>
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────

function NfcIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8.32a7.43 7.43 0 0 1 0 7.36" />
      <path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58" />
      <path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8" />
      <path d="M16.37 2a20.16 20.16 0 0 1 0 20" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      style={{ animation: "spin 1s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
    </svg>
  );
}

// ── Styles (inline for kiosk reliability) ────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100dvh",
    background: "var(--kiosk-bg)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--kiosk-text)",
    userSelect: "none",
    WebkitUserSelect: "none",
    position: "relative",
    overflow: "hidden",
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
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.5rem",
    padding: "3rem 4rem",
    background: "var(--kiosk-surface)",
    border: "1px solid var(--kiosk-border)",
    borderRadius: "2rem",
    boxShadow: "0 0 60px rgba(0,0,0,0.5)",
    maxWidth: 520,
    width: "90vw",
    textAlign: "center",
  },
  iconRing: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    background: "rgba(79,142,247,0.08)",
    border: "2px solid var(--kiosk-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--kiosk-muted)",
    transition: "all 0.3s ease",
  },
  iconRingActive: {
    background: "var(--kiosk-accent-glow)",
    border: "2px solid var(--kiosk-accent)",
    color: "var(--kiosk-accent)",
    boxShadow: "0 0 30px var(--kiosk-accent-glow)",
  },
  iconRingLoading: {
    background: "rgba(79,142,247,0.1)",
    border: "2px solid var(--kiosk-accent)",
    color: "var(--kiosk-accent)",
  },
  iconRingError: {
    background: "rgba(239,68,68,0.1)",
    border: "2px solid var(--kiosk-error)",
    color: "var(--kiosk-error)",
  },
  heading: {
    fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "var(--kiosk-text)",
  },
  headingActive: {
    color: "var(--kiosk-accent)",
  },
  headingError: {
    color: "var(--kiosk-error)",
  },
  subtext: {
    fontSize: "1.1rem",
    color: "var(--kiosk-muted)",
    lineHeight: 1.5,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "var(--kiosk-muted)",
    marginTop: "0.5rem",
    animation: "pulse 2s ease-in-out infinite",
  },
  statusDotActive: {
    background: "var(--kiosk-accent)",
    boxShadow: "0 0 10px var(--kiosk-accent-glow)",
  },
  resetNote: {
    fontSize: "0.9rem",
    color: "var(--kiosk-muted)",
  },
  manualBox: {
    position: "fixed",
    bottom: "5rem",
    background: "var(--kiosk-surface)",
    border: "1px solid var(--kiosk-border)",
    borderRadius: "1rem",
    padding: "1rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    minWidth: 320,
  },
  manualLabel: {
    fontSize: "0.8rem",
    color: "var(--kiosk-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  manualRow: {
    display: "flex",
    gap: "0.5rem",
  },
  manualInput: {
    flex: 1,
    padding: "0.5rem 0.75rem",
    background: "var(--kiosk-bg)",
    border: "1px solid var(--kiosk-border)",
    borderRadius: "0.5rem",
    color: "var(--kiosk-text)",
    fontSize: "0.9rem",
    outline: "none",
    fontFamily: "monospace",
  },
  manualBtn: {
    padding: "0.5rem 1rem",
    background: "var(--kiosk-accent)",
    color: "#fff",
    border: "none",
    borderRadius: "0.5rem",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.9rem",
  },
  testToggle: {
    position: "fixed",
    bottom: "1.5rem",
    right: "1.5rem",
    background: "transparent",
    border: "1px solid var(--kiosk-border)",
    color: "var(--kiosk-muted)",
    borderRadius: "0.5rem",
    padding: "0.4rem 0.8rem",
    fontSize: "0.75rem",
    cursor: "pointer",
  },
};
