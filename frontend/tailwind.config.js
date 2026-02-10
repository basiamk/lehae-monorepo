/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#10b981', // Emerald green
        secondary: '#1e1b4b', // Deep indigo
        accent: '#fcd34d', // Soft gold
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#1f2937',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        neumorphic: '8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.9)',
        'neumorphic-inset': 'inset 4px 4px 8px rgba(0, 0, 0, 0.1), inset -4px -4px 8px rgba(255, 255, 255, 0.9)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};