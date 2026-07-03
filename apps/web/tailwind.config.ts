import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#635bff',
          dark: '#5046e5',
          soft: '#ede9fe',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f6f8fa',
        },
        restricted: {
          DEFAULT: '#7c3aed',
          soft: '#ede9fe',
        },
      },
    },
  },
  plugins: [],
};

export default config;
