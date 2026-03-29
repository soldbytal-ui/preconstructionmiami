/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A1628',
          50: '#E8EBF0',
          100: '#C5CBD6',
          200: '#8B96AB',
          300: '#516180',
          400: '#2D3D5C',
          500: '#0A1628',
          600: '#081220',
          700: '#060E18',
          800: '#040A10',
          900: '#020508',
        },
        gold: {
          DEFAULT: '#C9A96E',
          50: '#FBF7F0',
          100: '#F3EBDA',
          200: '#E5D4B0',
          300: '#D7BD87',
          400: '#C9A96E',
          500: '#B89450',
          600: '#967839',
          700: '#6F5A2B',
          800: '#493C1D',
          900: '#231E0E',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
