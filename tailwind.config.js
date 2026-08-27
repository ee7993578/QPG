/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Lora"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          50: '#EEF1F8',
          100: '#DCE2F0',
          200: '#B4C0DE',
          300: '#8C9ECC',
          400: '#5C71A8',
          500: '#3D4F80',
          600: '#2C3D68',
          700: '#213056',
          800: '#182444',
          900: '#0F1830',
          950: '#0A1122',
        },
        gold: {
          50: '#FBF3E3',
          100: '#F5E4C0',
          200: '#EBCB86',
          300: '#DFB158',
          400: '#C9973C',
          500: '#B27E22',
          600: '#8F631A',
          700: '#6C4A13',
        },
        paper: {
          50: '#FFFEFB',
          100: '#FDFBF5',
          200: '#F7F2E6',
          300: '#EFE7D2',
        },
        pen: {
          red: '#B23A34',
          green: '#2F7A56',
        },
      },
      boxShadow: {
        page: '0 1px 2px rgba(15,24,48,0.06), 0 12px 32px -12px rgba(15,24,48,0.25)',
        card: '0 1px 2px rgba(15,24,48,0.06), 0 4px 12px -4px rgba(15,24,48,0.12)',
      },
      borderRadius: {
        xl2: '1.1rem',
      },
    },
  },
  plugins: [],
}
