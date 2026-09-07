import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0B5FFF",
          dark: "#0842B0",
          light: "#E7F0FF",
        },
      },
    },
  },
  plugins: [],
};

export default config;
