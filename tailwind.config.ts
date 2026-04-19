import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07080A",
          900: "#0D0F12",
          850: "#111318",
          800: "#15181E",
          700: "#1C2027",
          600: "#262B34",
          500: "#3A404B",
          400: "#5A6170",
          300: "#8A92A3",
          200: "#B8BDC8",
          100: "#DDE0E7"
        },
        verdict: {
          buy: "#00C853",
          skip: "#FF3B30",
          wait: "#FFB300"
        },
        paper: "#F7F5F0"
      },
      fontFamily: {
        display: ["var(--font-display)", "Fraunces", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"]
      },
      fontSize: {
        "verdict-xl": ["clamp(5rem, 22vw, 11rem)", { lineHeight: "0.88", letterSpacing: "-0.04em" }],
        "display-lg": ["clamp(2.5rem, 9vw, 5rem)", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "display-md": ["clamp(1.75rem, 6vw, 2.75rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }]
      },
      keyframes: {
        "verdict-in": {
          "0%": { transform: "scale(0.6)", opacity: "0", filter: "blur(8px)" },
          "60%": { transform: "scale(1.08)", opacity: "1", filter: "blur(0)" },
          "100%": { transform: "scale(1)", opacity: "1" }
        },
        "tick-in": {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        pulse2: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" }
        }
      },
      animation: {
        "verdict-in": "verdict-in 0.6s cubic-bezier(.2,1.1,.3,1) both",
        "tick-in": "tick-in 0.45s ease both",
        shimmer: "shimmer 2.6s linear infinite",
        pulse2: "pulse2 1.6s ease-in-out infinite"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
