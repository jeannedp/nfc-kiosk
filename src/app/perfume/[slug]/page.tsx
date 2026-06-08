// src/app/perfume/[slug]/page.tsx
// Internal kiosk product page — no ecommerce, no nav, no footer.
// Product data is hardcoded here for MVP; replace with DB/API calls later.

import { notFound } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriceOption {
  size: string;   // e.g. "50ml", "100ml"
  price: number;  // ZAR
}

interface SimilarPerfume {
  name: string;
  brand: string;
  note: string; // one-line similarity reason
}

interface Perfume {
  slug: string;
  brand: string;
  name: string;
  concentration: string;   // e.g. "Eau de Parfum", "Extrait de Parfum"
  category: string;        // e.g. "Oriental Woody", "Floral"
  description: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  longevity: string;       // e.g. "8–12 hours"
  sillage: string;         // e.g. "Moderate", "Heavy"
  prices: PriceOption[];
  similar: SimilarPerfume[];
  accentColor: string;     // hex — used for decorative tints
  imageDescription: string;// placeholder text in image area
}

// ─── Product data ─────────────────────────────────────────────────────────────
// Replace this array with a DB/API fetch when ready.

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export default function PerfumePage({ params }: { params: { slug: string } }) {
  const perfumeData = PRODUCTS.find((p) => p.slug === params.slug);
  if (!perfumeData) notFound();
  // notFound() throws, so perfumeData is guaranteed defined from here on
  const perfume = perfumeData as Perfume;

  const accent = perfume.accentColor;

  return (
    <div style={s.root}>
      {/* Ambient tint */}
      <div style={{ ...s.ambient, background: `radial-gradient(ellipse at 20% 0%, ${accent}22 0%, transparent 60%)` }} />

      {/* Header */}
      <header style={s.header}>
        <a href="/" style={s.backBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Scan another perfume
        </a>
        <div style={s.headerLogo}>
          <span style={s.headerLogoText}>The Perfume Gallery</span>
        </div>
      </header>

      <main style={s.main}>
        {/* Hero */}
        <section style={s.hero}>
          {/* Image placeholder */}
          <div style={{ ...s.imagePlaceholder, borderColor: `${accent}55` }}>
            <div style={{ ...s.imagePlaceholderInner, background: `${accent}18` }}>
              <BottleIllustration accent={accent} />
              <p style={{ ...s.imagePlaceholderLabel, color: `${accent}cc` }}>
                {perfume.imageDescription}
              </p>
            </div>
            {/* Replace above div with: <Image src={perfume.imageUrl} alt={perfume.name} fill style={{objectFit:'contain'}} /> */}
          </div>

          {/* Info */}
          <div style={s.heroInfo}>
            <p style={{ ...s.brandLabel, color: accent }}>{perfume.brand}</p>
            <h1 style={s.perfumeName}>{perfume.name}</h1>
            <div style={s.badgeRow}>
              <span style={s.badge}>{perfume.concentration}</span>
              <span style={s.badge}>{perfume.category}</span>
            </div>
            <p style={s.description}>{perfume.description}</p>

            {/* Prices */}
            <div style={s.priceSection}>
              <p style={s.sectionLabel}>Available sizes</p>
              <div style={s.priceGrid}>
                {perfume.prices.map((p) => (
                  <div key={p.size} style={{ ...s.priceCard, borderColor: `${accent}40` }}>
                    <span style={s.priceSize}>{p.size}</span>
                    <span style={{ ...s.priceAmount, color: accent }}>
                      R {p.price.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <p style={s.priceNote}>All prices include VAT · Ask staff for availability</p>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section style={s.notesSection}>
          <h2 style={s.sectionHeading}>Fragrance Notes</h2>
          <div style={s.notesGrid}>
            <NoteGroup label="Top notes" notes={perfume.topNotes} accent={accent} position="top" />
            <NoteGroup label="Heart notes" notes={perfume.heartNotes} accent={accent} position="heart" />
            <NoteGroup label="Base notes" notes={perfume.baseNotes} accent={accent} position="base" />
          </div>
        </section>

        {/* Details */}
        <section style={s.detailsSection}>
          <h2 style={s.sectionHeading}>More information</h2>
          <div style={s.detailsGrid}>
            <DetailRow label="Concentration" value={perfume.concentration} />
            <DetailRow label="Category" value={perfume.category} />
            <DetailRow label="Longevity" value={perfume.longevity} />
            <DetailRow label="Sillage" value={perfume.sillage} />
          </div>
        </section>

        {/* Similar */}
        <section style={s.similarSection}>
          <h2 style={s.sectionHeading}>Smells like…</h2>
          <p style={s.similarSubtext}>You might also enjoy these fragrances</p>
          <div style={s.similarGrid}>
            {perfume.similar.map((sim) => (
              <div key={sim.name} style={{ ...s.similarCard, borderColor: `${accent}30` }}>
                <div style={{ ...s.similarDot, background: `${accent}33`, borderColor: `${accent}66` }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                    <path d="M8 12s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" />
                    <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" />
                  </svg>
                </div>
                <div>
                  <p style={s.simBrand}>{sim.brand}</p>
                  <p style={s.simName}>{sim.name}</p>
                  <p style={s.simNote}>{sim.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom back button */}
        <div style={s.bottomBack}>
          <a href="/" style={{ ...s.bottomBackBtn, borderColor: `${accent}50`, color: accent }}>
            ← Scan another perfume
          </a>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NoteGroup({
  label, notes, accent, position,
}: {
  label: string;
  notes: string[];
  accent: string;
  position: "top" | "heart" | "base";
}) {
  const icons = { top: "✦", heart: "❋", base: "◆" };
  return (
    <div style={s.noteGroup}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <span style={{ color: accent, fontSize: "0.85rem" }}>{icons[position]}</span>
        <span style={s.noteGroupLabel}>{label}</span>
      </div>
      <div style={s.notePillRow}>
        {notes.map((n) => (
          <span key={n} style={{ ...s.notePill, background: `${accent}18`, color: `${accent}ee`, borderColor: `${accent}35` }}>
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={s.detailRow}>
      <span style={s.detailLabel}>{label}</span>
      <span style={s.detailValue}>{value}</span>
    </div>
  );
}

function BottleIllustration({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 120 200" width="110" height="185" xmlns="http://www.w3.org/2000/svg">
      {/* Cap */}
      <rect x="42" y="10" width="36" height="16" rx="5" fill={accent} opacity="0.85" />
      {/* Neck */}
      <rect x="50" y="26" width="20" height="28" rx="3" fill={accent} opacity="0.6" />
      {/* Collar */}
      <rect x="38" y="52" width="44" height="9" rx="3" fill={accent} opacity="0.75" />
      {/* Body */}
      <rect x="22" y="61" width="76" height="118" rx="14"
        fill="white" fillOpacity="0.06"
        stroke={accent} strokeOpacity="0.5" strokeWidth="1.5" />
      {/* Liquid */}
      <rect x="25" y="90" width="70" height="87" rx="10"
        fill={accent} fillOpacity="0.15" />
      {/* Label bg */}
      <rect x="30" y="78" width="60" height="72" rx="6"
        fill="white" fillOpacity="0.07"
        stroke="white" strokeOpacity="0.12" strokeWidth="1" />
      {/* Label lines */}
      <rect x="38" y="86" width="44" height="3" rx="1.5" fill="white" fillOpacity="0.25" />
      <rect x="42" y="93" width="36" height="2" rx="1" fill="white" fillOpacity="0.15" />
      <rect x="42" y="98" width="36" height="2" rx="1" fill="white" fillOpacity="0.15" />
      <rect x="44" y="103" width="30" height="2" rx="1" fill="white" fillOpacity="0.12" />
      {/* Highlight */}
      <rect x="25" y="65" width="12" height="60" rx="6"
        fill="white" fillOpacity="0.08" />
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100dvh",
    background: "#0d1117",
    color: "#f0e6d0",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    WebkitFontSmoothing: "antialiased",
    position: "relative",
    overflowX: "hidden",
  },
  ambient: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 0,
  },
  // Header
  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 2rem",
    height: 64,
    background: "rgba(13,17,23,0.92)",
    borderBottom: "1px solid rgba(200,169,110,0.12)",
    backdropFilter: "blur(16px)",
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.55rem 1.25rem",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "2rem",
    color: "#c8a96e",
    textDecoration: "none",
    fontSize: "0.88rem",
    fontWeight: 500,
    letterSpacing: "0.02em",
    transition: "background 0.2s",
    cursor: "pointer",
  },
  headerLogo: {},
  headerLogoText: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: "0.9rem",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "rgba(200,169,110,0.55)",
  },
  // Main
  main: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "2rem 1.5rem 4rem",
    position: "relative",
    zIndex: 1,
  },
  // Hero
  hero: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    gap: "3rem",
    alignItems: "start",
    marginBottom: "3rem",
  },
  imagePlaceholder: {
    borderRadius: "1.25rem",
    border: "1px solid",
    overflow: "hidden",
    aspectRatio: "3/4",
    position: "relative",
  },
  imagePlaceholderInner: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    padding: "1.5rem",
  },
  imagePlaceholderLabel: {
    fontSize: "0.75rem",
    letterSpacing: "0.08em",
    textAlign: "center",
    lineHeight: 1.4,
  },
  heroInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    paddingTop: "0.5rem",
  },
  brandLabel: {
    fontSize: "0.82rem",
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  },
  perfumeName: {
    fontSize: "clamp(1.5rem, 3vw, 2.1rem)",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontWeight: 400,
    lineHeight: 1.25,
    color: "#f0e6d0",
    letterSpacing: "0.01em",
  },
  badgeRow: { display: "flex", flexWrap: "wrap" as const, gap: "0.5rem" },
  badge: {
    padding: "0.3rem 0.85rem",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "999px",
    fontSize: "0.78rem",
    color: "rgba(240,230,208,0.65)",
    letterSpacing: "0.04em",
  },
  description: {
    fontSize: "0.97rem",
    color: "rgba(240,230,208,0.65)",
    lineHeight: 1.7,
    maxWidth: 520,
  },
  // Prices
  priceSection: { marginTop: "0.5rem" },
  sectionLabel: {
    fontSize: "0.75rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "rgba(240,230,208,0.4)",
    marginBottom: "0.75rem",
  },
  priceGrid: { display: "flex", gap: "0.75rem", flexWrap: "wrap" as const },
  priceCard: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "0.85rem 1.5rem",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid",
    borderRadius: "0.85rem",
    minWidth: 100,
    gap: "0.3rem",
  },
  priceSize: { fontSize: "0.82rem", color: "rgba(240,230,208,0.5)", letterSpacing: "0.05em" },
  priceAmount: { fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.01em" },
  priceNote: {
    marginTop: "0.75rem",
    fontSize: "0.75rem",
    color: "rgba(240,230,208,0.3)",
    letterSpacing: "0.02em",
  },
  // Notes
  notesSection: {
    padding: "2rem",
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "1.25rem",
    marginBottom: "2rem",
  },
  sectionHeading: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontWeight: 400,
    fontSize: "1.2rem",
    letterSpacing: "0.04em",
    color: "rgba(240,230,208,0.75)",
    marginBottom: "1.5rem",
  },
  notesGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" },
  noteGroup: {},
  noteGroupLabel: {
    fontSize: "0.78rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "rgba(240,230,208,0.45)",
  },
  notePillRow: { display: "flex", flexWrap: "wrap" as const, gap: "0.4rem" },
  notePill: {
    padding: "0.35rem 0.75rem",
    borderRadius: "999px",
    border: "1px solid",
    fontSize: "0.82rem",
    letterSpacing: "0.02em",
    fontWeight: 500,
  },
  // Details
  detailsSection: {
    padding: "2rem",
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "1.25rem",
    marginBottom: "2rem",
  },
  detailsGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0" },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.85rem 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  detailLabel: { fontSize: "0.88rem", color: "rgba(240,230,208,0.4)", letterSpacing: "0.02em" },
  detailValue: { fontSize: "0.88rem", color: "rgba(240,230,208,0.8)", fontWeight: 500 },
  // Similar
  similarSection: {
    padding: "2rem",
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "1.25rem",
    marginBottom: "2rem",
  },
  similarSubtext: {
    fontSize: "0.88rem",
    color: "rgba(240,230,208,0.4)",
    marginTop: "-1rem",
    marginBottom: "1.5rem",
  },
  similarGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" },
  similarCard: {
    display: "flex",
    gap: "1rem",
    padding: "1.1rem",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid",
    borderRadius: "1rem",
    alignItems: "flex-start",
  },
  similarDot: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  simBrand: { fontSize: "0.72rem", color: "rgba(240,230,208,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" },
  simName: { fontSize: "0.9rem", color: "#f0e6d0", fontWeight: 500, marginTop: "0.2rem", lineHeight: 1.3 },
  simNote: { fontSize: "0.78rem", color: "rgba(240,230,208,0.45)", marginTop: "0.3rem", lineHeight: 1.4 },
  // Bottom back
  bottomBack: { display: "flex", justifyContent: "center", paddingTop: "1rem" },
  bottomBackBtn: {
    display: "inline-block",
    padding: "0.9rem 2.5rem",
    border: "1px solid",
    borderRadius: "2rem",
    textDecoration: "none",
    fontSize: "1rem",
    fontWeight: 500,
    letterSpacing: "0.04em",
    cursor: "pointer",
  },
};
