/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#c4a882',
          dark: '#a8895f',
          light: '#d4b896',
          50: '#faf7f3',
        },
        secondary: {
          DEFAULT: '#1c1a17',
          light: '#3a3430',
        },
        accent: {
          DEFAULT: '#d4a96a',
          dark: '#b8893e',
        },
        neutral: {
          50:  '#faf7f3',
          100: '#f5f0e8',
          200: '#ede8e0',
          300: '#ddd6ca',
          800: '#3a3430',
          900: '#1c1a17',
        },
      },
      fontFamily: {
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        neumorphic:        '8px 8px 16px rgba(0,0,0,0.06), -8px -8px 16px rgba(255,255,255,0.9)',
        'neumorphic-sm':   '4px 4px 8px rgba(0,0,0,0.05), -4px -4px 8px rgba(255,255,255,0.8)',
        'neumorphic-inset':'inset 4px 4px 8px rgba(0,0,0,0.05), inset -4px -4px 8px rgba(255,255,255,0.8)',
        'card-hover':      '0 16px 48px rgba(0,0,0,0.13)',
        card:              '0 2px 12px rgba(0,0,0,0.07)',
        soft:              '0 4px 24px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern':    "url('/hero-pattern.svg')",
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};