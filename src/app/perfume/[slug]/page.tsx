// src/app/perfume/[slug]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// UI ONLY redesign. All types, product data, routing, slug handling,
// generateStaticParams and navigation logic are 100% unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import { notFound } from "next/navigation";

// ─── Types (unchanged) ────────────────────────────────────────────────────────

interface PriceOption {
  size: string;
  price: number;
}

interface SimilarPerfume {
  name: string;
  brand: string;
  note: string;
}

interface Perfume {
  slug: string;
  brand: string;
  name: string;
  concentration: string;
  category: string;
  description: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  longevity: string;
  sillage: string;
  prices: PriceOption[];
  similar: SimilarPerfume[];
  accentColor: string;
  imageDescription: string;
}

// ─── Product data (unchanged) ─────────────────────────────────────────────────

const PRODUCTS: Perfume[] = [
  {
    slug: "aramis-impression",
    brand: "Aramis",
    name: "Aramis IMPRESSION | Intimate",
    concentration: "Eau de Parfum",
    category: "Oriental Fougère",
    description:
      "A modern reinterpretation of the classic Aramis DNA. Intimate opens with an aromatic freshness that gives way to a warm leathery heart — confident, masculine and unmistakably refined. This impression captures the spirit of the original while softening its edges for contemporary wear.",
    topNotes: ["Bergamot", "Cardamom", "Sage"],
    heartNotes: ["Leather", "Geranium", "Cedarwood"],
    baseNotes: ["Vetiver", "Oakmoss", "Amber", "Musk"],
    longevity: "7–10 hours",
    sillage: "Moderate to Heavy",
    prices: [
      { size: "50ml", price: 895 },
      { size: "100ml", price: 1295 },
    ],
    similar: [
      { name: "Aramis Classic", brand: "Aramis", note: "The original — bolder, smokier" },
      { name: "Bel Ami", brand: "Hermès", note: "Similar leathery elegance, lighter finish" },
      { name: "Halston Z-14", brand: "Halston", note: "Shared oakmoss and fougère character" },
    ],
    accentColor: "#8B6914",
    imageDescription: "Aramis · Intimate",
  },
  {
    slug: "kilian-old-fashioned",
    brand: "Kilian Paris",
    name: "old fashioned IMPRESSION | Renaissance EXTRAIT",
    concentration: "Extrait de Parfum",
    category: "Gourmand Amber",
    description:
      "Inspired by Kilian's Old Fashioned — the liquid embodiment of the iconic cocktail. Renaissance Extrait opens with the sweet warmth of bourbon vanilla and smoked wood, orbited by notes of dried fruit and tobacco. Rich, intoxicating, and unmistakably luxurious. An impression that stands its own ground.",
    topNotes: ["Bourbon Vanilla", "Cardamom", "Dried Fig"],
    heartNotes: ["Tobacco Leaf", "Smoked Oud", "Beeswax"],
    baseNotes: ["Benzoin", "Vetiver", "Dark Amber", "Sandalwood"],
    longevity: "10–14 hours",
    sillage: "Heavy",
    prices: [
      { size: "30ml", price: 1095 },
      { size: "50ml", price: 1595 },
    ],
    similar: [
      { name: "Angels' Share", brand: "Kilian Paris", note: "Same whisky-oak DNA, softer and sweeter" },
      { name: "Tobacco Vanille", brand: "Tom Ford", note: "Shared sweet tobacco warmth" },
      { name: "Oud Satin Mood", brand: "Maison Margiela", note: "Rich and dark, similar sillage" },
    ],
    accentColor: "#7B3F00",
    imageDescription: "Kilian · Renaissance Extrait",
  },
  {
    slug: "pdm-percival",
    brand: "Parfums de Marly",
    name: "percival IMPRESSION",
    concentration: "Eau de Parfum",
    category: "Fresh Floral Gourmand",
    description:
      "A spirited, joyful fragrance that blends crisp lavender, ripe red berries and a delicate musk warmth. Percival is effortlessly crowd-pleasing — bright and accessible yet underpinned by quality ingredients. This impression faithfully renders its playful character at remarkable value.",
    topNotes: ["Lavender", "Red Berries", "Lemon"],
    heartNotes: ["Apple Blossom", "Geranium", "White Musk"],
    baseNotes: ["Sandalwood", "Cashmeran", "Vanilla", "Amber"],
    longevity: "6–9 hours",
    sillage: "Moderate",
    prices: [
      { size: "50ml", price: 795 },
      { size: "100ml", price: 1095 },
    ],
    similar: [
      { name: "Layton", brand: "Parfums de Marly", note: "Richer and woodier, similar freshness" },
      { name: "Bright Crystal Absolu", brand: "Versace", note: "Shared fruity floral softness" },
      { name: "Luna Rossa Carbon", brand: "Prada", note: "Similar lavender and clean musk" },
    ],
    accentColor: "#6A5ACD",
    imageDescription: "Parfums de Marly · Percival",
  },
  {
    slug: "pdm-delina",
    brand: "Parfums de Marly",
    name: "Delina IMPRESSION",
    concentration: "Eau de Parfum",
    category: "Floral Musk",
    description:
      "One of the most beloved feminine fragrances of the past decade. Delina opens with a burst of rhubarb and lychee before a cascading heart of Turkish rose, peony and lily of the valley. The base is a silky cashmeran and vanilla cloud — feminine, radiant and endlessly wearable.",
    topNotes: ["Rhubarb", "Lychee", "Nutmeg"],
    heartNotes: ["Turkish Rose", "Peony", "Lily of the Valley"],
    baseNotes: ["Cashmeran", "Vanilla", "Musk", "Incense"],
    longevity: "8–12 hours",
    sillage: "Moderate to Heavy",
    prices: [
      { size: "50ml", price: 895 },
      { size: "75ml", price: 1195 },
      { size: "125ml", price: 1595 },
    ],
    similar: [
      { name: "Delina La Rosée", brand: "Parfums de Marly", note: "Lighter, fresher variation of Delina" },
      { name: "Si Passione", brand: "Giorgio Armani", note: "Shared rose and blackcurrant warmth" },
      { name: "Flowerbomb", brand: "Viktor & Rolf", note: "Similar floral bomb with sweet base" },
    ],
    accentColor: "#C0748A",
    imageDescription: "Parfums de Marly · Delina",
  },
  {
    slug: "amouage-outlands",
    brand: "Amouage",
    name: "Outlands",
    concentration: "Eau de Parfum",
    category: "Smoky Woody Oriental",
    description:
      "Outlands is Amouage at its most exploratory — a raw, elemental journey through fire and earth. Birch tar and smoked woods collide with resinous labdanum and a haunting flicker of immortelle. Deeply complex, uncompromisingly original. Not for the faint-hearted; for those who want to wear something truly unforgettable.",
    topNotes: ["Birch Tar", "Cardamom", "Smoke"],
    heartNotes: ["Immortelle", "Labdanum", "Cistus"],
    baseNotes: ["Oud", "Guaiac Wood", "Benzoin", "Amber"],
    longevity: "12+ hours",
    sillage: "Heavy",
    prices: [
      { size: "100ml", price: 3495 },
    ],
    similar: [
      { name: "Interlude Man", brand: "Amouage", note: "Shared smoky incense DNA, slightly softer" },
      { name: "Timbuktu", brand: "L'Artisan Parfumeur", note: "Similar earthy and smoky drydown" },
      { name: "Encens Flamboyant", brand: "Annick Goutal", note: "Resinous incense character" },
    ],
    accentColor: "#5C3D2E",
    imageDescription: "Amouage · Outlands",
  },
];

// ─── Static params (unchanged) ────────────────────────────────────────────────

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

// ─── Page (routing unchanged) ─────────────────────────────────────────────────

export default function PerfumePage({ params }: { params: { slug: string } }) {
  const perfumeData = PRODUCTS.find((p) => p.slug === params.slug);
  if (!perfumeData) notFound();
  const perfume = perfumeData as Perfume;

  return (
    <>
      <style>{pageStyles}</style>
      <div className="kiosk-page">

        {/* ── Top nav bar ─────────────────────────────────────────────────── */}
        <nav className="topbar">
          <div className="topbar-inner">
            <TPGWordmark />
            <a href="/" className="back-btn">
              <BackArrowIcon />
              Back to Scanner
            </a>
          </div>
        </nav>

        {/* ── TOP SECTION: Bottle + Identity LEFT | Price RIGHT ───────────── */}
        <section className="top-section">
          <div className="top-inner">

            {/* LEFT: illustration + identity */}
            <div className="identity-col">
              <BottleIllustration accent={perfume.accentColor} />
              <div className="identity-text">
                <p className="brand-name">{perfume.brand}</p>
                <h1 className="perfume-name">{perfume.name}</h1>
                <span className="concentration-badge">{perfume.concentration}</span>
                <p className="description">{perfume.description}</p>
              </div>
            </div>

            {/* RIGHT: price table */}
            <div className="price-col">
              <div className="price-card">
                <p className="price-card-heading">PRICE</p>
                <table className="price-table">
                  <tbody>
                    {perfume.prices.map((p) => (
                      <tr key={p.size} className="price-row">
                        <td className="price-size">{p.size}</td>
                        <td className="price-amount">R{p.price.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="price-note">All prices include VAT</p>
              </div>
              <div className="category-chip">
                <CategoryIcon />
                {perfume.category}
              </div>
            </div>

          </div>
        </section>

        {/* ── DIVIDER ─────────────────────────────────────────────────────── */}
        <div className="section-divider" />

        {/* ── MIDDLE SECTION: Fragrance Notes ─────────────────────────────── */}
        <section className="notes-section">
          <div className="section-inner">
            <h2 className="section-heading">Fragrance Notes</h2>
            <div className="notes-grid">
              <NoteCard
                tier="Top Notes"
                icon={<TopNoteIcon />}
                label="The opening impression"
                notes={perfume.topNotes}
                accent={perfume.accentColor}
              />
              <NoteCard
                tier="Heart Notes"
                icon={<HeartNoteIcon />}
                label="The character"
                notes={perfume.heartNotes}
                accent={perfume.accentColor}
              />
              <NoteCard
                tier="Base Notes"
                icon={<BaseNoteIcon />}
                label="The lasting impression"
                notes={perfume.baseNotes}
                accent={perfume.accentColor}
              />
            </div>
          </div>
        </section>

        {/* ── DIVIDER ─────────────────────────────────────────────────────── */}
        <div className="section-divider" />

        {/* ── BOTTOM SECTION: Smells Like + More Info ──────────────────────── */}
        <section className="bottom-section">
          <div className="section-inner">
            <div className="bottom-grid">

              {/* Smells Like */}
              <div className="smells-col">
                <h2 className="section-heading">Smells Like</h2>
                <div className="similar-list">
                  {perfume.similar.map((s, i) => (
                    <SimilarCard key={i} sim={s} index={i} />
                  ))}
                </div>
              </div>

              {/* More Information */}
              <div className="info-col">
                <h2 className="section-heading">More Information</h2>
                <div className="info-card">
                  <InfoRow label="Category" value={perfume.category} />
                  <InfoRow label="Concentration" value={perfume.concentration} />
                  <InfoRow label="Longevity" value={perfume.longevity} />
                  <InfoRow label="Sillage" value={perfume.sillage} />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Back to scanner ──────────────────────────────────────────────── */}
        <section className="back-section">
          <a href="/" className="back-large-btn">
            <BackArrowIcon />
            Scan Another Perfume
          </a>
        </section>

      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NoteCard({
  tier, icon, label, notes, accent,
}: {
  tier: string;
  icon: React.ReactNode;
  label: string;
  notes: string[];
  accent: string;
}) {
  return (
    <div className="note-card">
      <div className="note-card-header">
        <span className="note-icon">{icon}</span>
        <div>
          <p className="note-tier">{tier}</p>
          <p className="note-label">{label}</p>
        </div>
      </div>
      <div className="note-pills">
        {notes.map((n) => (
          <span
            key={n}
            className="note-pill"
            style={{ borderColor: `${accent}50`, color: accent }}
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

function SimilarCard({ sim, index }: { sim: SimilarPerfume; index: number }) {
  const letters = ["A", "B", "C"];
  return (
    <div className="similar-card">
      <div className="similar-avatar">
        <BottleMiniIcon />
        <span className="similar-idx">{letters[index]}</span>
      </div>
      <div className="similar-body">
        <p className="similar-brand">{sim.brand}</p>
        <p className="similar-name">{sim.name}</p>
        <p className="similar-note">{sim.note}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  );
}

// ─── Bottle illustration ──────────────────────────────────────────────────────

function BottleIllustration({ accent }: { accent: string }) {
  // Clamp accent for use in SVG fills with opacity variants
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
          <linearGradient id={`bodyGrad-${accent.replace("#","")}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e8eaf6" />
            <stop offset="40%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#c5cae9" />
          </linearGradient>
          <linearGradient id={`capGrad-${accent.replace("#","")}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#37474f" />
            <stop offset="100%" stopColor="#1a237e" />
          </linearGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="100" cy="314" rx="55" ry="7" fill="#e0e0e0" />

        {/* Cap */}
        <rect x="72" y="14" width="56" height="20" rx="5"
          fill={`url(#capGrad-${accent.replace("#","")})`} />
        <rect x="75" y="12" width="50" height="7" rx="3.5" fill="#546e7a" />

        {/* Neck */}
        <rect x="82" y="34" width="36" height="34" rx="4"
          fill="#b0bec5" />
        <rect x="85" y="34" width="12" height="34" rx="3"
          fill="#cfd8dc" opacity="0.7" />

        {/* Collar */}
        <rect x="68" y="66" width="64" height="12" rx="4"
          fill="#1a237e" />

        {/* Body */}
        <rect x="42" y="78" width="116" height="220" rx="16"
          fill={`url(#bodyGrad-${accent.replace("#","")})`}
          stroke="#c5cae9" strokeWidth="1" />

        {/* Liquid */}
        <rect x="45" y="148" width="110" height="148" rx="12"
          fill={accent} opacity="0.13" />
        <rect x="45" y="146" width="110" height="4" rx="2"
          fill={accent} opacity="0.18" />

        {/* Label panel */}
        <rect x="54" y="90" width="92" height="130" rx="6"
          fill="white" stroke="#e8eaf6" strokeWidth="1.5" />

        {/* Label top navy bar */}
        <rect x="54" y="90" width="92" height="30" rx="6" fill="#1a237e" />
        <rect x="54" y="108" width="92" height="12" rx="0" fill="#1a237e" />

        {/* Brand text in label */}
        <text x="100" y="111" textAnchor="middle"
          fontFamily="'Barlow', 'Barlow Semi Condensed', sans-serif" fontSize="9" fill="white"
          letterSpacing="3">PARFUM</text>

        {/* Decorative label lines */}
        <line x1="68" y1="132" x2="132" y2="132"
          stroke="#e8eaf6" strokeWidth="1" />
        <rect x="68" y="137" width="64" height="2.5" rx="1.25"
          fill="#e8eaf6" />
        <rect x="72" y="143" width="56" height="2" rx="1"
          fill="#e8eaf6" opacity="0.7" />
        <rect x="72" y="149" width="48" height="2" rx="1"
          fill="#e8eaf6" opacity="0.5" />
        <rect x="76" y="155" width="36" height="2" rx="1"
          fill="#e8eaf6" opacity="0.4" />

        {/* Accent colour swatch at bottom of label */}
        <rect x="80" y="168" width="40" height="4" rx="2"
          fill={accent} opacity="0.4" />
        <rect x="85" y="175" width="30" height="3" rx="1.5"
          fill={accent} opacity="0.25" />

        {/* Body highlight */}
        <rect x="44" y="82" width="14" height="120" rx="7"
          fill="white" opacity="0.35" />

        {/* Bottom rim */}
        <rect x="42" y="288" width="116" height="10" rx="8"
          fill="#c5cae9" />
      </svg>
    </div>
  );
}

// ─── TPG wordmark ─────────────────────────────────────────────────────────────

function TPGWordmark() {
  return (
    <div className="tpg-mark">
      <svg width="48" height="38" viewBox="0 0 72 56" fill="none">
        <rect x="1.5" y="1.5" width="69" height="53" stroke="#1a237e" strokeWidth="3" fill="none" />
        <rect x="1.5" y="1.5" width="18" height="16" fill="white" />
        <rect x="52.5" y="38.5" width="18" height="16" fill="white" />
        <text x="7" y="37" fontFamily="'Barlow', sans-serif" fontSize="26" fontWeight="700" fill="#1a237e" letterSpacing="-1">T</text>
        <text x="25" y="37" fontFamily="'Barlow', sans-serif" fontSize="26" fontWeight="700" fill="#1a237e" letterSpacing="-1">P</text>
        <text x="44" y="37" fontFamily="'Barlow', sans-serif" fontSize="26" fontWeight="700" fill="#1a237e" letterSpacing="-1">G</text>
      </svg>
      <div className="tpg-words">
        <span>THE PERFUME</span>
        <span>GALLERY</span>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function TopNoteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 2L8 8h8l-4-6z" />
      <circle cx="12" cy="14" r="4" />
    </svg>
  );
}

function HeartNoteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function BaseNoteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <ellipse cx="12" cy="16" rx="6" ry="3" />
      <path d="M6 16V8a6 6 0 0 1 12 0v8" />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3" />
    </svg>
  );
}

function BottleMiniIcon() {
  return (
    <svg width="22" height="32" viewBox="0 0 22 32" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="1" width="8" height="5" rx="2" />
      <rect x="9" y="6" width="4" height="5" rx="1" />
      <rect x="3" y="11" width="16" height="20" rx="4" />
    </svg>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
// Self-contained styles. No Tailwind required — pure CSS for kiosk reliability.

const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&family=Barlow+Semi+Condensed:wght@400;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .kiosk-page {
    min-height: 100dvh;
    background: #ffffff;
    color: #1a237e;
    font-family: 'Barlow', 'Barlow Semi Condensed', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Topbar ─────────────────────────────────────────────────────────────── */
  .topbar {
    position: sticky;
    top: 0;
    z-index: 50;
    background: #ffffff;
    border-bottom: 1px solid #e8eaf6;
  }
  .topbar-inner {
    max-width: 1000px;
    margin: 0 auto;
    padding: 0.85rem 1.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .tpg-mark {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .tpg-words {
    display: flex;
    flex-direction: column;
    gap: 1px;
    font-family: 'Barlow', 'Barlow Semi Condensed', system-ui, sans-serif;
    font-size: 0.72rem;
    letter-spacing: 0.18em;
    color: #1a237e;
    line-height: 1.25;
    text-transform: uppercase;
  }
  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0.55rem 1.25rem;
    border: 1.5px solid #c5cae9;
    border-radius: 100px;
    color: #1a237e;
    text-decoration: none;
    font-family: 'Barlow', system-ui, sans-serif;
    font-size: 0.82rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    transition: background 0.2s, border-color 0.2s;
  }
  .back-btn:hover {
    background: #e8eaf6;
    border-color: #1a237e;
  }

  /* ── Top section ────────────────────────────────────────────────────────── */
  .top-section {
    background: #fafafa;
    border-bottom: 1px solid #e8eaf6;
  }
  .top-inner {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2.5rem 1.75rem;
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 2.5rem;
    align-items: start;
  }
  .identity-col {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
  }
  .bottle-wrap {
    flex-shrink: 0;
  }
  .bottle-svg {
    display: block;
    filter: drop-shadow(0 8px 24px rgba(26,35,126,0.12));
    transition: transform 0.4s ease;
  }
  .bottle-svg:hover {
    transform: translateY(-4px) scale(1.02);
  }
  .identity-text {
    padding-top: 0.5rem;
    flex: 1;
  }
  .brand-name {
    font-family: 'Barlow', system-ui, sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #1565c0;
    margin-bottom: 0.6rem;
  }
  .perfume-name {
    font-family: 'Barlow', 'Barlow Semi Condensed', system-ui, sans-serif;
    font-size: clamp(1.5rem, 2.8vw, 2.1rem);
    font-weight: 400;
    color: #0d1b6e;
    line-height: 1.25;
    letter-spacing: -0.01em;
    margin-bottom: 0.85rem;
  }
  .concentration-badge {
    display: inline-block;
    padding: 0.28rem 0.9rem;
    border: 1px solid #c5cae9;
    border-radius: 100px;
    font-family: 'Barlow', system-ui, sans-serif;
    font-size: 0.75rem;
    color: #283593;
    letter-spacing: 0.06em;
    margin-bottom: 1rem;
    background: #fff;
  }
  .description {
    font-family: 'Barlow', system-ui, sans-serif;
    font-size: 0.93rem;
    color: #546e7a;
    line-height: 1.7;
    max-width: 420px;
  }

  /* ── Price card ─────────────────────────────────────────────────────────── */
  .price-col {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .price-card {
    background: #ffffff;
    border: 1.5px solid #e8eaf6;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 16px rgba(26,35,126,0.06);
  }
  .price-card-heading {
    font-family: 'Barlow', system-ui, sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #9fa8da;
    margin-bottom: 1rem;
  }
  .price-table {
    width: 100%;
    border-collapse: collapse;
  }
  .price-row {
    border-bottom: 1px solid #f3f4fb;
    transition: background 0.15s;
  }
  .price-row:last-child {
    border-bottom: none;
  }
  .price-row:hover {
    background: #f5f7ff;
  }
  .price-size {
    padding: 0.7rem 0;
    font-family: 'Barlow', system-ui, sans-serif;
    font-size: 0.88rem;
    color: #546e7a;
    letter-spacing: 0.04em;
  }
  .price-amount {
    padding: 0.7rem 0;
    text-align: right;
    font-family: 'Barlow', 'Barlow Semi Condensed', system-ui, sans-serif;
    font-size: 1.05rem;
    font-weight: 400;
    color: #1a237e;
    letter-spacing: -0.01em;
  }
  .price-note {
    margin-top: 0.85rem;
    font-family: 'Barlow', system-ui, sans-serif;
    font-size: 0.68rem;
    color: #b0bec5;
    letter-spacing: 0.04em;
    text-align: right;
  }
  .category-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0.45rem 1rem;
    background: #e8eaf6;
    border-radius: 100px;
    font-family: 'Barlow', system-ui, sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    color: #283593;
    letter-spacing: 0.04em;
    align-self: flex-start;
  }

  /* ── Section divider ────────────────────────────────────────────────────── */
  .section-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, #e8eaf6 20%, #e8eaf6 80%, transparent);
  }
  .section-inner {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2.25rem 1.75rem;
  }
  .section-heading {
    font-family: 'Barlow', system-ui, sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #9fa8da;
    margin-bottom: 1.25rem;
  }

  /* ── Notes section ──────────────────────────────────────────────────────── */
  .notes-section { background: #fff; }
  .notes-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
  .note-card {
    background: #fafbff;
    border: 1.5px solid #e8eaf6;
    border-radius: 12px;
    padding: 1.25rem 1.25rem 1.4rem;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.25s;
  }
  .note-card:hover {
    border-color: #c5cae9;
    box-shadow: 0 4px 20px rgba(26,35,126,0.07);
    transform: translateY(-2px);
  }
  .note-card-header {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 1rem;
    padding-bottom: 0.85rem;
    border-bottom: 1px solid #eef0fb;
  }
  .note-icon {
    color: #1a237e;
    opacity: 0.6;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .note-tier {
    font-family: 'Barlow', 'Barlow Semi Condensed', system-ui, sans-serif;
    font-size: 0.97rem;
    color: #1a237e;
    font-weight: 400;
    line-height: 1.2;
  }
  .note-label {
    font-family: 'Barlow', system-ui, sans-serif;
    font-size: 0.68rem;
    color: #9fa8da;
    letter-spacing: 0.04em;
    margin-top: 2px;
  }
  .note-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .note-pill {
    display: inline-block;
    padding: 0.3rem 0.75rem;
    border: 1px solid;
    border-radius: 100px;
    font-family: 'Barlow', system-ui, sans-serif;
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    background: white;
    transition: background 0.2s, transform 0.15s;
    cursor: default;
  }
  .note-pill:hover {
    background: #f5f7ff;
    transform: scale(1.04);
  }

  /* ── Bottom section ─────────────────────────────────────────────────────── */
  .bottom-section { background: #fafafa; }
  .bottom-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2.5rem;
    align-items: start;
  }

  /* Similar */
  .similar-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .similar-card {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem 1.1rem;
    background: #fff;
    border: 1.5px solid #e8eaf6;
    border-radius: 12px;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.25s;
  }
  .similar-card:hover {
    border-color: #c5cae9;
    box-shadow: 0 4px 16px rgba(26,35,126,0.07);
    transform: translateX(3px);
  }
  .similar-avatar {
    width: 48px;
    height: 56px;
    border-radius: 8px;
    background: #e8eaf6;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    color: #3949ab;
    flex-shrink: 0;
  }
  .similar-idx {
    font-family: 'Barlow', system-ui, sans-serif;
    font-size: 0.6rem;
    font-weight: 700;
    color: #7986cb;
    letter-spacing: 0.05em;
  }
  .similar-brand {
    font-family: 'Barlow', system-ui, sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #9fa8da;
    margin-bottom: 2px;
  }
  .similar-name {
    font-family: 'Barlow', 'Barlow Semi Condensed', system-ui, sans-serif;
    font-size: 0.93rem;
    color: #1a237e;
    line-height: 1.3;
    margin-bottom: 4px;
  }
  .similar-note {
    font-family: 'Barlow', system-ui, sans-serif;
    font-size: 0.75rem;
    color: #78909c;
    line-height: 1.4;
  }

  /* Info card */
  .info-card {
    background: #fff;
    border: 1.5px solid #e8eaf6;
    border-radius: 12px;
    overflow: hidden;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.9rem 1.25rem;
    border-bottom: 1px solid #f3f4fb;
    transition: background 0.15s;
  }
  .info-row:last-child { border-bottom: none; }
  .info-row:hover { background: #f8f9ff; }
  .info-label {
    font-family: 'Barlow', system-ui, sans-serif;
    font-size: 0.78rem;
    color: #90a4ae;
    letter-spacing: 0.04em;
  }
  .info-value {
    font-family: 'Barlow', 'Barlow Semi Condensed', system-ui, sans-serif;
    font-size: 0.9rem;
    color: #1a237e;
    text-align: right;
    max-width: 55%;
  }

  /* ── Back button ────────────────────────────────────────────────────────── */
  .back-section {
    display: flex;
    justify-content: center;
    padding: 2rem 1.75rem 3rem;
    background: #fff;
    border-top: 1px solid #e8eaf6;
  }
  .back-large-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 1rem 2.75rem;
    background: #1a237e;
    color: #fff;
    text-decoration: none;
    border-radius: 100px;
    font-family: 'Barlow', system-ui, sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(26,35,126,0.25);
  }
  .back-large-btn:hover {
    background: #283593;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(26,35,126,0.3);
  }
  .back-large-btn:active {
    transform: translateY(0);
  }

  /* ── Portrait tablet responsive ─────────────────────────────────────────── */
  @media (max-width: 700px) {
    .top-inner {
      grid-template-columns: 1fr;
      gap: 1.75rem;
    }
    .identity-col {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .description {
      max-width: 100%;
    }
    .price-col {
      align-items: center;
    }
    .price-card {
      width: 100%;
      max-width: 340px;
    }
    .notes-grid {
      grid-template-columns: 1fr;
    }
    .bottom-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }
`;

