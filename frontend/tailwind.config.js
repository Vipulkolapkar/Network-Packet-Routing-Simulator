/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0c10',
        panel: '#0f1218',
        border: '#1e2535',
        accent: '#00e5ff',
        accent2: '#7c3aed',
        accent3: '#10b981',
        warn: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', 'monospace'],
        sans: ['Syne', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
