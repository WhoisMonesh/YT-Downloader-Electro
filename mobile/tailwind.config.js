/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        foreground: '#ffffff',
        border: 'rgba(255,255,255,0.1)',
        primary: {
          DEFAULT: '#8b5cf6',
          dark: '#6d28d9',
        }
      }
    },
  },
  plugins: [],
}
