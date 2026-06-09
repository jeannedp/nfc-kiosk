"use client";

// Separate client component so the parent page can stay a server component.
// Tries to load the real product image first; falls back to the SVG illustration.

import { useState } from "react";

interface Props {
  slug: string;
  accent: string;
  imageDescription: string;
}

export default function BottleImage({ slug, accent, imageDescription }: Props) {
  const [failed, setFailed] = useState(false);

  // Image path — file must exist at: public/images/products/[slug].png
  const src = `/images/products/${slug}.png`;

  if (!failed) {
    return (
      <div className="bottle-wrap">
        <img
          src={src}
          alt={imageDescription}
          onError={() => setFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center bottom",
            display: "block",
            background: "transparent",
          }}
        />
      </div>
    );
  }

  // ── SVG fallback ─────────────────────────────────────────────────────────
  return (
    <div className="bottle-wrap">
      <svg
        viewBox="0 0 200 320"
        width="160"
        height="256"
        xmlns="http://www.w3.org/2000/svg"
        className="bottle-svg"
      >
        <defs>
          <linearGradient id={`bG-${slug}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#e8eaf6" />
            <stop offset="40%"  stopColor="#ffffff" />
            <stop offset="100%" stopColor="#c5cae9" />
          </linearGradient>
          <linearGradient id={`cG-${slug}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#37474f" />
            <stop offset="100%" stopColor="#1a237e" />
          </linearGradient>
        </defs>

        <ellipse cx="100" cy="314" rx="55" ry="7" fill="#e0e0e0" />
        <rect x="72" y="14" width="56" height="20" rx="5" fill={`url(#cG-${slug})`} />
        <rect x="75" y="12" width="50" height="7" rx="3.5" fill="#546e7a" />
        <rect x="82" y="34" width="36" height="34" rx="4" fill="#b0bec5" />
        <rect x="85" y="34" width="12" height="34" rx="3" fill="#cfd8dc" opacity="0.7" />
        <rect x="68" y="66" width="64" height="12" rx="4" fill="#1a237e" />
        <rect x="42" y="78" width="116" height="220" rx="16"
          fill={`url(#bG-${slug})`} stroke="#c5cae9" strokeWidth="1" />
        <rect x="45" y="148" width="110" height="148" rx="12" fill={accent} opacity="0.13" />
        <rect x="45" y="146" width="110" height="4"   rx="2"  fill={accent} opacity="0.18" />
        <rect x="54" y="90"  width="92"  height="130" rx="6"
          fill="white" stroke="#e8eaf6" strokeWidth="1.5" />
        <rect x="54" y="90"  width="92"  height="30"  rx="6"  fill="#1a237e" />
        <rect x="54" y="108" width="92"  height="12"  rx="0"  fill="#1a237e" />
        <text x="100" y="111" textAnchor="middle"
          fontFamily="'Barlow', sans-serif" fontSize="9" fill="white" letterSpacing="3">PARFUM</text>
        <line x1="68" y1="132" x2="132" y2="132" stroke="#e8eaf6" strokeWidth="1" />
        <rect x="68" y="137" width="64" height="2.5" rx="1.25" fill="#e8eaf6" />
        <rect x="72" y="143" width="56" height="2"   rx="1"    fill="#e8eaf6" opacity="0.7" />
        <rect x="72" y="149" width="48" height="2"   rx="1"    fill="#e8eaf6" opacity="0.5" />
        <rect x="76" y="155" width="36" height="2"   rx="1"    fill="#e8eaf6" opacity="0.4" />
        <rect x="80" y="168" width="40" height="4"   rx="2"    fill={accent}  opacity="0.4" />
        <rect x="85" y="175" width="30" height="3"   rx="1.5"  fill={accent}  opacity="0.25" />
        <rect x="44" y="82"  width="14" height="120" rx="7"    fill="white"   opacity="0.35" />
        <rect x="42" y="288" width="116" height="10" rx="8"    fill="#c5cae9" />
      </svg>
    </div>
  );
}
