/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // <--- ADD THIS EXACT LINE
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}