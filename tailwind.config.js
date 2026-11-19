/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Colours are CSS variables so a section can opt into the night palette with .theme-dark
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        surface2: 'rgb(var(--c-surface2) / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
        'text-primary': 'rgb(var(--c-text) / <alpha-value>)',
        'text-muted': 'rgb(var(--c-muted) / <alpha-value>)',
        accent: {
          green: 'rgb(var(--c-accent) / <alpha-value>)',
          blue: 'rgb(var(--c-accent2) / <alpha-value>)',
          orange: 'rgb(var(--c-accent3) / <alpha-value>)',
          gray: '#8A9098',
        },
        ink: '#111B33',
        coral: '#E8563F',
        bay: '#1E7A72',
        sun: '#D99A22',
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        mono: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        glass: '14px',
      },
    },
  },
  plugins: [],
};
