/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        champagne: {
          50: '#fdfbf7',
          100: '#faf3e0',
          200: '#f5e6c8',
          300: '#eed9a8',
          400: '#e6c87a',
          500: '#d4b25a',
          600: '#b89442',
          700: '#967638',
          800: '#7a5f31',
          900: '#654d2a',
        },
        sage: {
          50: '#f6f7f6',
          100: '#e3e7e2',
          200: '#c8d1c7',
          300: '#a3b3a1',
          400: '#7e927c',
          500: '#637760',
          600: '#4e5f4c',
          700: '#3f4c3e',
          800: '#354034',
          900: '#2d362c',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
