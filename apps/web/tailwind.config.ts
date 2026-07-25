import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Dense-catalog identity (B&H Photo-style) — replaced the premium
        // gradient blue. "brand" is now a classic web-link blue used for
        // nav/links/accents; "cta" is the high-contrast orange used
        // specifically for purchase actions (Add to Cart / Buy Now),
        // matching the utilitarian professional-catalog convention rather
        // than the earlier glassmorphism/gradient identity.
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
          800: "#1E3A8A",
          900: "#172554",
          950: "#0F172A",
        },
        secondary: {
          50: "#EEF2FC",
          100: "#D6E0F7",
          200: "#AEC1EF",
          300: "#7F9CE4",
          400: "#4D71D6",
          500: "#2C55C0",
          600: "#1E40AF",
          700: "#17348C",
          800: "#112869",
          900: "#0B1B46",
          950: "#07112E",
        },
        cta: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        accent: {
          50: "#E6F9FF",
          100: "#B3EDFF",
          200: "#80E1FF",
          300: "#4DD5FF",
          400: "#1AC9FF",
          500: "#00AEEF",
          600: "#008CC0",
          700: "#006991",
          800: "#004761",
          900: "#002432",
          950: "#001219",
        },
        // Dark-mode-oriented navy surfaces — page background/card in dark
        // mode (light mode continues to use plain white/neutral-50/#F8FAFC).
        surface: {
          50: "#F8FAFC",
          100: "#EEF1F6",
          200: "#E2E7EF",
          800: "#1A2236",
          900: "#131A2A",
          950: "#0B0F19",
        },
        ink: {
          950: "#08080A",
          900: "#0A0A0C",
          800: "#161618",
          700: "#232326",
          600: "#333338",
        },
        neutral: {
          50: "#FAFAFA",
          100: "#F2F2F3",
          200: "#E5E5E7",
          300: "#D1D1D6",
          400: "#A8A8AE",
          500: "#7C7C85",
          600: "#5B5B63",
          700: "#45454B",
          800: "#2C2C30",
          900: "#1A1A1C",
        },
        success: { DEFAULT: "#1E9E62", subtle: "#E6F6ED" },
        warning: { DEFAULT: "#D9992A", subtle: "#FBF1DF" },
        error: { DEFAULT: "#DC3545", subtle: "#FBE7E9" },
        info: { DEFAULT: "#2B7FD9", subtle: "#E8F1FC" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      // Dense catalog sites use minimal/sharp corners, not the rounded
      // "premium app" look — 2xl used to be 1.25rem, now a modest 0.375rem.
      borderRadius: {
        xl: "0.25rem",
        "2xl": "0.375rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0, 0, 0, 0.06)",
        elevated: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
        glow: "0 8px 32px rgba(20, 40, 160, 0.25)",
        "glow-dark": "0 8px 32px rgba(0, 174, 239, 0.15)",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #1428A0 0%, #1E40AF 55%, #00AEEF 100%)",
        "gradient-radial-glow": "radial-gradient(circle at 30% 20%, rgba(0, 174, 239, 0.25), transparent 60%)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
