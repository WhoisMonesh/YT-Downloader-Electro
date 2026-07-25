/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/renderer/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          50: "#1e1e2e",
          100: "#181825",
          200: "#11111b",
          300: "#0c0c14",
          400: "#06060a",
          500: "#030305",
          600: "#020203",
          700: "#010102",
          800: "#000001",
          900: "#000000",
          950: "#000000",
        },
        accent: {
          50: "#f5f5f5",
          100: "#cdd6f4",
          200: "#bac2de",
          300: "#a6adc8",
          400: "#9399b2",
          500: "#7f849c",
          600: "#6c7086",
          700: "#585b70",
          800: "#45475a",
          900: "#313244",
        },
        blue: {
          DEFAULT: "#89b4fa",
          light: "#b4d0fb",
          dark: "#74a8f7",
        },
        green: {
          DEFAULT: "#a6e3a1",
          light: "#c1f0c4",
          dark: "#8dd987",
        },
        red: {
          DEFAULT: "#f38ba8",
          light: "#f5b0bf",
          dark: "#f07297",
        },
        yellow: {
          DEFAULT: "#f9e2af",
          light: "#faeacl",
          dark: "#f7dc9e",
        },
        purple: {
          DEFAULT: "#cba6f7",
          light: "#d9c1f9",
          dark: "#b98ef5",
        },
      },
      fontFamily: {
        sans: [
          "Outfit",
          "Inter",
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      animation: {
        "progress-ring": "progress-ring 1s ease-in-out",
        "slide-in": "slide-in 0.3s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "progress-ring": {
          "0%": { strokeDashoffset: "283" },
          "100%": { strokeDashoffset: "0" },
        },
        "slide-in": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        glow: "0 0 15px rgba(137, 180, 250, 0.3)",
      },
    },
  },
  plugins: [],
};
