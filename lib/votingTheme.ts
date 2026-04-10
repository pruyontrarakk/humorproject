/**
 * App-wide brown + deep purple accents. Main authenticated pages use white backgrounds.
 */
export const votingTheme = {
  mainBg: "#ffffff",
  panelBg: "#ffffff",
  /** Content panels on Home / Voting / Upload — white with optional top edge */
  panelBgGradient: "linear-gradient(180deg, #ffffff 0%, #ffffff 100%)",
  cardWhite: "#ffffff",

  text: "#5d3017",
  textStrong: "#4b2814",
  textMuted: "rgba(93, 48, 23, 0.72)",
  textSoft: "rgba(93, 48, 23, 0.55)",

  brown900: "#4b2814",
  brown800: "#5d3017",
  brown700: "#783c1a",
  brown600: "#974d1e",
  brown200: "#f0c8a3",
  brown100: "#fbe9d6",
  /** Subtle section tint (cards only — not full page) */
  cream: "#fffaf5",

  /** Deep purple (violet-900 / 800) */
  purple: "#4c1d95",
  purpleLight: "#5b21b6",
  purpleMuted: "rgba(76, 29, 149, 0.1)",
  purpleBorder: "rgba(76, 29, 149, 0.26)",

  borderBrown: "rgba(151, 77, 30, 0.18)",
  borderBrownLight: "rgba(151, 77, 30, 0.12)",

  cardShadow:
    "0 2px 14px rgba(93, 48, 23, 0.06), 0 0 0 1px rgba(76, 29, 149, 0.06)",
  cardShadowLift:
    "0 4px 22px rgba(93, 48, 23, 0.08), 0 0 0 1px rgba(76, 29, 149, 0.08)",
  panelShadow: "0 -6px 28px rgba(93, 48, 23, 0.05)",

  overlayNotFunny: "rgba(180, 55, 45, 0.5)",
  overlayFunny: "rgba(28, 110, 72, 0.48)",

  navActiveFg: "#5d3017",
  navInactiveFg: "#64748b",
  navActiveBg: "rgba(151, 77, 30, 0.12)",
  navBorderAccent: "rgba(76, 29, 149, 0.45)",

  /** Primary CTA fill (brown keeps contrast on white) */
  ctaBg: "#5d3017",
  ctaBgHover: "#783c1a",
  ctaFg: "#ffffff",
} as const;
