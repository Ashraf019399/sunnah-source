import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#F0F6F2", 100: "#E3EDE5", 200: "#C4DBC8", 700: "#1B4D2E", 800: "#143C23", 900: "#0D2A18" },
        surface: { canvas: "#FBF9F5", muted: "#F4EFE6", border: "#E5DEC9" },
        charcoal: { 500: "#767D76", 700: "#4E544E", 900: "#181A18" },
        accent: { amber: "#D48B28", dark: "#B2711C" }
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        bengali: ["var(--font-hind)", "SolaimanLipi", "sans-serif"]
      }
    }
  },
  plugins: []
};
export default config;