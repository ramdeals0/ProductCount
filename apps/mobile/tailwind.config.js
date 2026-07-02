/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        restricted: '#7C3AED',
        surface: '#FFFFFF',
        background: '#F5F5F4',
        muted: '#78716C',
      },
    },
  },
  plugins: [],
};
