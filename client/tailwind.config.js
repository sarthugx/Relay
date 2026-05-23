/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155'
        },
        primary: {
          500: '#8b5cf6', // Violet
          600: '#7c3aed'
        }
      }
    },
  },
  plugins: [],
}
