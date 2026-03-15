/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tata-purple': '#673AB7',
        'tata-pink': '#E53B8C',
        'tata-light': '#F8F9FE',
        'tata-dark': '#1A1A1A',
        'tata-purple-light': '#F3E8FF',
        'tata-pink-light': '#FFE8F3',
      },
      backgroundImage: {
        'tata-gradient': 'linear-gradient(135deg, #673AB7 0%, #E53B8C 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
      }
    },
  },
  plugins: [],
}
