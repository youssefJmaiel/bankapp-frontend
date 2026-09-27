/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#7892b0',
          500: '#5e7a96',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
          950: '#0a1c2f',
        },
        mint: {
          50: '#ebfff8',
          100: '#c7ffe8',
          200: '#94ffd5',
          300: '#5efbc1',
          400: '#3ee5a5',
          500: '#16c98e',
          600: '#0aa774',
          700: '#088461',
          800: '#0a6b4f',
          900: '#0a5742',
        },
        gold: {
          50: '#fffaeb',
          100: '#fff1c6',
          200: '#ffe188',
          300: '#ffcb4a',
          400: '#ffb020',
          500: '#f99007',
          600: '#db6f00',
          700: '#b54e02',
          800: '#933d06',
          900: '#7a3208',
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(16, 42, 67, 0.08), 0 1px 2px rgba(16, 42, 67, 0.04)',
        'card-hover': '0 4px 12px rgba(16, 42, 67, 0.1), 0 2px 4px rgba(16, 42, 67, 0.06)',
        'sidebar': '4px 0 12px rgba(16, 42, 67, 0.08)',
      },
    },
  },
  plugins: [],
};
