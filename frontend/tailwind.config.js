/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Основний брендовий колір
        primary: '#006ADC',
        // Текстові кольори
        main: '#111111',
        secondary: '#555555',
        muted: '#888888',
        // Кольори інтерфейсу
        border: '#E0E0E0',
        bg: '#F9FAFB',
        surface: '#FFFFFF',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}