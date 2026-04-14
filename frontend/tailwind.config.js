/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        flipkartBlue: '#2874f0',
        flipkartYellow: '#ff9f00',
        flipkartOrange: '#fb641b',
      }
    },
  },
  plugins: [],
}
