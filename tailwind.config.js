// tailwind.config.js
import formsPlugin from '@tailwindcss/forms';
import defaultTheme from 'tailwindcss/defaultTheme'; // Для fontFamily
import colors from 'tailwindcss/colors'; // Для цветов

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: colors.slate[100],
          dark: '#1A1B2F',
        },
        surface: {
          DEFAULT: colors.white,
          dark: colors.slate[800],
        },
        primary: {
          DEFAULT: '#037DD6',
          hover: '#006BC7',
          dark: '#2F72FA',
          dark_hover: '#508BFF',
        },
        secondary: {
          DEFAULT: colors.slate[600],
          dark: colors.slate[400],
        },
        accent: {
          DEFAULT: colors.amber[500],
          dark: colors.amber[400],
        },
        text: {
          DEFAULT: colors.slate[800],
          dark: colors.slate[200],
          muted: colors.slate[500],
          dark_muted: colors.slate[400],
        },
        success: {
          DEFAULT: colors.green[600],
          dark: colors.green[500],
        },
        error: {
          DEFAULT: colors.red[600],
          dark: colors.red[500],
        },
        warning: {
          DEFAULT: colors.amber[500],
          dark: colors.amber[400],
        },
        // Сохраненные для совместимости с формами логина/регистрации, если не успели их полностью переделать
        authFormBg: `rgba(30, 41, 59, 0.85)`,
        authInputBg: colors.slate[700],
        authInputBorder: colors.slate[600],
        authPlaceholder: colors.slate[400],
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      keyframes: {
        'modal-scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.90) translateY(-20px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0px)' },
        }
      },
      animation: {
        'modal-scale-in': 'modal-scale-in 0.3s ease-out forwards',
      }
    },
  },
  plugins: [
    formsPlugin,
  ],
};