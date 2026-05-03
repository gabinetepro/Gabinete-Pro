import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#10B981",
        background: "#0F172A",
        surface: "#1E293B",
        "surface-2": "#0F172A",
        border: "#1E3A5F",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #10B981 100%)",
        "gradient-sidebar": "linear-gradient(180deg, #0F172A 0%, #0A1628 100%)",
        "gradient-card": "linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(16,185,129,0.05) 100%)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(16, 185, 129, 0.15)",
        "glow-blue": "0 0 20px rgba(37, 99, 235, 0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
