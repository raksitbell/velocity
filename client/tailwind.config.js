/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        notion: {
          bg: '#191919',
          sidebar: '#202020',
          card: '#252525',
          hover: '#2C2C2C',
          border: '#333333',
          blue: '#2383E2',
          blueDark: '#1D282E',
        }
      }
    },
  },
  plugins: [],
}
