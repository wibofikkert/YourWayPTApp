/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f7fb',
          100: '#d6eaf5',
          200: '#aed0e9',
          300: '#72afd4',
          400: '#3994C1',
          500: '#2D83AE',
          600: '#1a6a93',
          700: '#063854',
          800: '#052e44',
          900: '#031e2d',
        },
        dark: {
          DEFAULT: '#1F2933',
          light:   '#3E4C59',
          muted:   '#52606D',
          subtle:  '#7B8794',
        },
        surface: {
          DEFAULT: '#F5F7FA',
          card:    '#ffffff',
          border:  '#CBD2D9',
          hover:   '#EDF2F7',
        }
      },
      fontFamily: {
        sans:    ['Roboto', 'sans-serif'],
        heading: ['"Encode Sans Expanded"', 'sans-serif'],
        accent:  ['Poppins', 'sans-serif'],
      },
    }
  },
  plugins: []
}
