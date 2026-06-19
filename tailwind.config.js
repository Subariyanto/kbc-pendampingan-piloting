/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f1f5fb',
          100: '#dde7f3',
          200: '#b9cce6',
          300: '#8caad3',
          400: '#5e84bc',
          500: '#3e66a4',
          600: '#2e5089',
          700: '#264071',
          800: '#1f365d',
          900: '#102a4d',
          950: '#0a1d38'
        },
        gold: {
          50: '#fdf9ec',
          100: '#faf0c9',
          200: '#f5e08e',
          300: '#eecb59',
          400: '#e6b432',
          500: '#cf971f',
          600: '#a87618',
          700: '#825716',
          800: '#67451a',
          900: '#583b1c'
        },
        toska: {
          50: '#effbf9',
          100: '#d6f4ee',
          200: '#b1e8de',
          300: '#7fd5c8',
          400: '#4cbcae',
          500: '#2fa295',
          600: '#218279',
          700: '#1d6963',
          800: '#1a5450',
          900: '#194543'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif']
      },
      boxShadow: {
        card: '0 4px 16px -4px rgba(16, 42, 77, 0.1), 0 2px 6px -2px rgba(16, 42, 77, 0.06)',
        soft: '0 2px 8px -2px rgba(16, 42, 77, 0.08)'
      }
    }
  },
  plugins: []
}
