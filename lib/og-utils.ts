export const CARD_SIZES = {
  square: { width: 1080, height: 1080 },
  landscape: { width: 1200, height: 630 },
} as const;

export const THEMES = {
  dark: {
    bg: "#0C0C0E",
    surface: "#16161A",
    border: "rgba(255,255,255,0.06)",
    textPrimary: "#F5F5F7",
    textSecondary: "#8E8E93",
    glow: "#FF6B2C",
  },
  light: {
    bg: "#FFFFFF",
    surface: "#F5F5F7",
    border: "rgba(0,0,0,0.08)",
    textPrimary: "#1A1A1A",
    textSecondary: "#6B6B6B",
    glow: "#FF6B2C",
  },
} as const;

export type ThemeMode = keyof typeof THEMES;
export type CardSize = keyof typeof CARD_SIZES;
