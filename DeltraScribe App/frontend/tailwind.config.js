/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deltascribe-navy': '#0F172A',
        'deltascribe-navy-light': '#1E293B',
        'deltascribe-emerald': '#10B981',
        'deltascribe-emerald-light': '#34D399',
        'deltascribe-emerald-dark': '#059669',
        'primary': '#10B981',
        'secondary': '#0F172A',
      },
      backgroundImage: {
        'deltascribe-gradient': 'linear-gradient(135deg, #0F172A 0%, #10B981 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'emerald': '0 10px 15px -3px rgba(16, 185, 129, 0.2)',
      }
    },
  },
  plugins: [],
}
