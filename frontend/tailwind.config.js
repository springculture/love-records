/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 马卡龙粉色系
        'macaron-pink': {
          50: '#FFF5F7',
          100: '#FFE0EC',
          200: '#FFC1D8',
          300: '#FFA2C4',
          400: '#F883AC',
          500: '#F06494',
          600: '#E8457C',
          700: '#D42664',
          800: '#B81A52',
          900: '#9C0E40',
        },
        // 马卡龙蓝色系
        'macaron-blue': {
          50: '#F0F8FF',
          100: '#D6EDFF',
          200: '#ADD8FF',
          300: '#85C7FF',
          400: '#5CB6FF',
          500: '#3399FF',
          600: '#1A7AE8',
          700: '#0D5CC7',
          800: '#0642A6',
          900: '#003085',
        },
        // 额外可爱色
        'candy-pink': '#FFB6C1',
        'candy-blue': '#B0D4F1',
        'candy-lavender': '#E8D5F5',
        'candy-mint': '#B5EAD7',
        'candy-peach': '#FFDAB9',
        'candy-cream': '#FFF8F0',
      },
      fontFamily: {
        'rounded': ['"Rounded Mplus 1c"', '"M PLUS Rounded 1c"', 'system-ui', 'sans-serif'],
        'cute': ['"ZCOOL KuaiLe"', 'cursive', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'cute': '0 4px 15px rgba(248, 131, 172, 0.15)',
        'cute-lg': '0 8px 30px rgba(248, 131, 172, 0.2)',
        'cute-blue': '0 4px 15px rgba(51, 153, 255, 0.15)',
      },
    },
  },
  plugins: [],
}
