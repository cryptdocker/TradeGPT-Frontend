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
          "radial-gradient(1000px circle at 15% 0%, rgb(20 184 166 / 0.22), transparent 55%), radial-gradient(900px circle at 85% 10%, rgb(16 185 129 / 0.18), transparent 52%), linear-gradient(160deg, rgb(240 253 250) 0%, rgb(255 255 255) 100%)",
        "teal-mesh":
          "radial-gradient(1100px circle at 12% 0%, rgb(45 212 191 / 0.22), transparent 55%), radial-gradient(900px circle at 88% 8%, rgb(16 185 129 / 0.18), transparent 50%), radial-gradient(700px circle at 50% 100%, rgb(6 182 212 / 0.12), transparent 60%), linear-gradient(160deg, rgb(4 23 25) 0%, rgb(6 30 32) 100%)",
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
          accent: "rgb(var(--color-accent) / <alpha-value>)",
          "accent-soft": "rgb(var(--color-accent-soft) / <alpha-value>)",
          "accent-glow": "rgb(var(--color-accent-glow) / <alpha-value>)",
        },
      },
      boxShadow: {
        "teal-glow": "0 10px 30px rgba(13, 148, 136, 0.25)",
        "teal-glow-lg": "0 18px 50px rgba(13, 148, 136, 0.35)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
