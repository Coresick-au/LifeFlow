/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Semantic color aliases for theme consistency
        surface: {
          DEFAULT: '#ffffff',
          light: '#fafafa', // Zinc-50
          dark: '#020617',   // Slate-950
        },
        card: {
          DEFAULT: '#ffffff',
          light: '#ffffff',
          dark: '#0f172a',   // Slate-900
        },
        border: {
          DEFAULT: '#e2e8f0',
          light: '#e2e8f0',  // Slate-200
          dark: '#1e293b',   // Slate-800
        },
        text: {
          primary: {
            light: '#0f172a', // Slate-900
            dark: '#f8fafc',  // Slate-50
          },
          secondary: {
            light: '#475569', // Slate-600
            dark: '#94a3b8',  // Slate-400
          }
        },
        timeline: {
          bg: '#f8fafc',
          border: '#e2e8f0',
          dot: '#64748b',
          text: '#475569',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bubble-float': 'bubbleFloat 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bubbleFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
