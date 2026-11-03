import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: { colors: { ink: "#171717", orange: "#ff9f1c", lime: "#c8f169" } } },
  plugins: []
};
export default config;
