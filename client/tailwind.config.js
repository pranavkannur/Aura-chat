/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aura: {
          dark: '#091413',
          light: '#B0E4CC',
          forest: '#408A71',
          deep: '#285A48',
        }
      }
    },
  },
  plugins: [],
}
