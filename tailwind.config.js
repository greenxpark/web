/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './servicios.html',
    './reservar.html',
    './panel-greenxpark-gestion-2026.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        lime: {
          electric: '#B6FF00',
          racing: '#8FCC00',
          neon: '#D4FF66',
        },
        carbon: {
          DEFAULT: '#0B0B0B',
          deep: '#050505',
          card: '#141414',
        },
        graphite: {
          DEFAULT: '#252525',
          light: '#333333',
        },
      },
      fontFamily: {
        title: ['"Exo 2"', 'sans-serif'],
        subtitle: ['"Montserrat"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'lime-glow': '0 0 25px rgba(182, 255, 0, 0.35)',
        'lime-glow-lg': '0 0 45px rgba(182, 255, 0, 0.55)',
        'card-dark': '0 20px 40px -15px rgba(0, 0, 0, 0.85)',
      },
    },
  },
  plugins: [],
};

