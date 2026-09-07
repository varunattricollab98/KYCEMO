import type { Config } from "tailwindcss";

// Design tokens derived from easemyoffice.in:
//   navy #0F1A2E · brand blue #11417C / #2C679E · amber #F59E0B / #FBBF24
//   slate grays · soft blue-white #F0F6FC · Inter font · 12px radii
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        navy: {
          DEFAULT: "#0F1A2E",
          800: "#16233D",
          700: "#1E2F4D",
        },
        brand: {
          DEFAULT: "#11417C",
          600: "#1B4E8F",
          500: "#2C679E",
          light: "#F0F6FC",
        },
        gold: {
          DEFAULT: "#F59E0B",
          400: "#FBBF24",
        },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,26,46,.04), 0 12px 32px -12px rgba(15,26,46,.12)",
        soft: "0 1px 3px rgba(15,26,46,.06)",
        glow: "0 8px 30px -8px rgba(17,65,124,.45)",
      },
      backgroundImage: {
        "navy-radial":
          "radial-gradient(1200px 600px at 50% -10%, #1E2F4D 0%, #0F1A2E 55%)",
        "brand-gradient": "linear-gradient(135deg, #1B4E8F 0%, #11417C 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "fade-up": "fade-up .5s cubic-bezier(.16,1,.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
