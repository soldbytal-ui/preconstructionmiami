/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0C0F',
        surface: '#111317',
        surface2: '#181B20',
        border: 'rgba(255,255,255,0.07)',
        'text-primary': '#F0EDE8',
        'text-muted': 'rgba(240,237,232,0.45)',
        accent: {
          green: '#00E5B4',
          blue: '#38B6FF',
          orange: '#FF7A3D',
          gray: '#8A9098',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      backdropBlur: {
        glass: '14px',
      },
    },
  },
  plugins: [],
};
