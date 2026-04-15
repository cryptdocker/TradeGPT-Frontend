/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      backgroundImage: {
        "cd-mesh":
          "radial-gradient(1000px circle at 15% 0%, rgb(14 165 233 / 0.2), transparent 55%), radial-gradient(900px circle at 85% 10%, rgb(20 184 166 / 0.18), transparent 52%), linear-gradient(160deg, rgb(244 247 252) 0%, rgb(255 255 255) 100%)",
      },
      colors: {
        th: {
          bg: "rgb(var(--color-bg) / <alpha-value>)",
          sidebar: "rgb(var(--color-sidebar) / <alpha-value>)",
          surface: "rgb(var(--color-surface) / <alpha-value>)",
          input: "rgb(var(--color-input) / <alpha-value>)",
          "input-hover": "rgb(var(--color-input-hover) / <alpha-value>)",
          code: "rgb(var(--color-code) / <alpha-value>)",
          border: "rgb(var(--color-border) / <alpha-value>)",
          "border-muted": "rgb(var(--color-border-muted) / <alpha-value>)",
          text: "rgb(var(--color-text) / <alpha-value>)",
          "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
