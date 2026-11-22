/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        purple: {
          950: '#0b0517',
          900: '#140826',
          850: '#1e0c3a',
          800: '#2b1053',
          700: '#3f187a',
          600: '#5c24b3',
          500: '#7c3aed',
          400: '#a78bfa',
          300: '#c4b5fd',
          200: '#ddd6fe',
          100: '#ede9fe',
          50: '#f5f3ff',
        },
        bakong: {
          red: '#e1251b',
          darkRed: '#b81c13',
          lightRed: '#ff4d42',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
