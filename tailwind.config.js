/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#E8EBF0', 100: '#C5CDD9', 200: '#8B9BB3',
          300: '#51698D', 400: '#2A4466', 500: '#0C2340',
          600: '#0A1D37', 700: '#08172E', 800: '#061125', 900: '#040B1C',
        },
        amber: { 400: '#FBBF24', 500: '#E8920B', 600: '#D97706' },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
