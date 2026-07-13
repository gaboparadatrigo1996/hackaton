/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0d0d12',
        darkBgSec: '#111117',
        panelBg: '#1a1a22',
        panelBorder: '#26262f',
        accentPurp: '#7c3aed',
        accentPurpLight: '#a78bfa',
        accentRed: '#ef4444',
        accentOrange: '#f59e0b',
        accentGreen: '#22c55e',
        textSec: '#8a8a94',
        textPri: '#e5e5e5'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
