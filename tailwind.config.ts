import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6E1E3C",
          50: "#fbeef2",
          100: "#f4d2dd",
          200: "#e6a3b9",
          300: "#d27493",
          400: "#b9486e",
          500: "#8f2c4f",
          600: "#6E1E3C",
          700: "#5a1831",
          800: "#451325",
          900: "#320d1b",
        },
        gold: {
          DEFAULT: "#C6A875",
          50: "#faf6ef",
          100: "#f1e7d4",
          200: "#e4d0aa",
          300: "#d4b582",
          400: "#C6A875",
          500: "#b08f57",
          600: "#917544",
          700: "#6f5934",
          800: "#4e3f25",
          900: "#2f2616",
        },
        ink: "#1c1117",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      container: {
        center: true,
        padding: "1.25rem",
        screens: {
          "2xl": "1240px",
        },
      },
    },
  },
  plugins: [],
};

export default config;
