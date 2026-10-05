/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: '#16a34a', light: '#22c55e', dark: '#15803d' },
        secondary:{ DEFAULT: '#f59e0b', light: '#fbbf24' },
        danger:   { DEFAULT: '#dc2626', light: '#ef4444' },
      }
    }
  },
  plugins: []
}
