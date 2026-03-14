/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#0f172a',
        'sidebar-hover': '#1e293b',
        medical: '#059669',
        police: '#2563eb',
        fire: '#ea580c',
        accident: '#d97706',
      },
    },
  },
  plugins: [],
};
