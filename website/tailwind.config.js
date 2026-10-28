/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#14181F',
          light: '#2D333F',
          muted: '#64748B',
        },
        paper: {
          DEFAULT: '#F8FAF9',
          card: '#FFFFFF',
          dark: '#F0F4F3',
        },
        clinical: {
          50: '#E6F4F5',
          100: '#C2E5E8',
          500: '#0E7C86',
          600: '#0B656D',
          700: '#084F56',
        },
        amberState: {
          DEFAULT: '#E8A33D',
          light: '#FEF3C7',
          dark: '#B45309',
        },
        indigoConsole: {
          DEFAULT: '#3B3F8C',
          dark: '#2A2E69',
          light: '#EEF2FF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        'token': '0 12px 32px -4px rgba(14, 124, 134, 0.18), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'console': '0 20px 25px -5px rgba(59, 63, 140, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 16px 32px -4px rgba(20, 24, 31, 0.08), 0 4px 8px -2px rgba(20, 24, 31, 0.04)',
      }
    },
  },
  plugins: [],
}
