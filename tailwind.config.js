/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        orange: {
          50:  '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#E8700A',
          600: '#c2600a',
          700: '#9a4d08',
          900: '#431e03',
        },
        dark: {
          900: '#0D0D0D',
          800: '#141414',
          700: '#1C1C1C',
          600: '#242424',
          500: '#2E2E2E',
          400: '#3A3A3A',
          300: '#525252',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease forwards',
        'slide-up': 'slideUp 0.5s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      }
    }
  },
  plugins: []
}
