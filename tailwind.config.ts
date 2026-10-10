import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        panel: "rgb(var(--c-panel) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        mute: "rgb(var(--c-mute) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        accent2: "rgb(var(--c-accent2) / <alpha-value>)",
        critical: "rgb(var(--c-critical) / <alpha-value>)",
        high: "rgb(var(--c-high) / <alpha-value>)",
        medium: "rgb(var(--c-medium) / <alpha-value>)",
        low: "rgb(var(--c-low) / <alpha-value>)",
        info: "rgb(var(--c-info) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        text: ["var(--font-text)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "1rem",
        xl: "1.5rem",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.08)" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulseSoft: "pulseSoft 2.4s ease-in-out infinite",
        slideIn: "slideIn 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
