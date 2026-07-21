/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enables standard class-based dark mode
  theme: {
    extend: {
      colors: {
        tpf: {
          purple: {
            light: '#8b5cf6',
            DEFAULT: '#6d28d9',
            dark: '#4c1d95',
          },
          pink: {
            light: '#ec4899',
            DEFAULT: '#db2777',
            dark: '#9d174d',
          },
          blue: '#2563eb',
          violet: '#7c3aed',
          darkBg: '#0f0c1b',
          darkCard: '#1a162e',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(109, 40, 217, 0.15)',
        'glass-hover': '0 8px 32px 0 rgba(219, 39, 119, 0.25)',
      }
    },
  },
  plugins: [],
}
