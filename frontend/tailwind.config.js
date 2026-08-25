/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Nayana design tokens — see docs/DESIGN.md
        paper: "#FAF7F0",        // background — warm off-white, easier on the eyes than stark white
        ink: "#1B2A4A",          // primary trust color, dark surfaces, headline text
        charcoal: "#2B2B2B",     // body text
        marigold: {
          DEFAULT: "#F4A623",    // primary accent — the "shutter" color
          dark: "#D98C0F"
        },
        teal: {
          DEFAULT: "#0F6B5C",    // secondary accent — confirm / safe
          light: "#E4F2EF"
        },
        signal: {
          red: "#D64545",
          amber: "#E0932C",
          green: "#2E8B57"
        },
        night: {
          bg: "#12182B",
          card: "#1B2440"
        }
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Atkinson Hyperlegible", "system-ui", "sans-serif"]
      },
      borderRadius: {
        card: "24px",
        button: "20px"
      },
      boxShadow: {
        soft: "0 8px 30px -8px rgba(27, 42, 74, 0.18)",
        lift: "0 12px 40px -10px rgba(27, 42, 74, 0.28)"
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.95)", opacity: "0.7" },
          "70%": { transform: "scale(1.25)", opacity: "0" },
          "100%": { transform: "scale(1.25)", opacity: "0" }
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        pulseRing: "pulseRing 2.2s cubic-bezier(0.4,0,0.6,1) infinite",
        fadeUp: "fadeUp 0.4s ease-out"
      }
    }
  },
  plugins: []
};
