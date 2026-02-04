/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6fff5',
          100: '#b3ffdf',
          200: '#80ffc9',
          300: '#4dffb3',
          400: '#1aff9d',
          500: '#00ff88',
          600: '#00cc6d',
          700: '#009952',
          800: '#006637',
          900: '#00331c',
        },
        dark: {
          100: '#2d3748',
          200: '#1f2937',
          300: '#16213e',
          400: '#1a1a2e',
          500: '#0f0f1e',
        },
      },
    },
  },
  plugins: [],
}
