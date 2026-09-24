import localFont from "next/font/local";

// Elenco tipográfico (design.md, seção 4). Self-hosted, quatro arquivos por família,
// font-display swap, sem Google Fonts.
export const gambetta = localFont({
  src: [
    { path: "./fonts/Gambetta-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Gambetta-Italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/Gambetta-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Gambetta-MediumItalic.woff2", weight: "500", style: "italic" },
  ],
  variable: "--font-gambetta",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const generalSans = localFont({
  src: [
    { path: "./fonts/GeneralSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/GeneralSans-Italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/GeneralSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/GeneralSans-MediumItalic.woff2", weight: "500", style: "italic" },
  ],
  variable: "--font-general-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
