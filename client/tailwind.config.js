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
        brand: {
          50: '#eef4ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#3b82f6',
          500: '#034bc0', // Official Redes Creation Royal Blue
          600: '#023aa0',
          700: '#022e82',
          800: '#012469',
          900: '#011c52',
          950: '#000f2e',
        },
        surface: {
          dark: '#0a0f1d',
          darker: '#060913',
          card: '#ffffff',
          border: '#e2e8f0',
          light: '#f8fafc',
          lightCard: '#ffffff'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glow-brand': '0 0 20px -3px rgba(3, 75, 192, 0.25)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.25)',
        'glow-rose': '0 0 20px -3px rgba(244, 63, 94, 0.25)',
      }
    },
  },
  plugins: [],
}
