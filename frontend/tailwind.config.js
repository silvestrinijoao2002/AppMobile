/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B00",
        secondary: "#22C55E",
        background: "#F8F9FA",
      },
      fontFamily: {
        inter: ["Inter"],
        poppins: ["Poppins"],
      },
    },
  },
  plugins: [],
};
