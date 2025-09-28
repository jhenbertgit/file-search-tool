/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./src/index.html"
  ],
  // Optimize for development and production builds
  corePlugins: {
    // Disable unused features for smaller bundle size
    float: false,
    clear: false,
    skew: false,
    caretColor: false,
    sepia: false,
    backdropSepia: false,
    backdropHueRotate: false,
    backdropInvert: false,
    hueRotate: false,
    invert: false,
    saturate: false,
    backdropSaturate: false,
  },
  theme: {
    extend: {
      screens: {
        'xs': '480px',
        'desktop': '1024px',
        'wide': '1440px',
        'ultrawide': '1920px',
      },
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#dde8ff',
          200: '#c2d4ff',
          300: '#9cb5ff',
          400: '#748bff',
          500: '#4361ee',
          600: '#3a56d4',
          700: '#2d42a8',
          800: '#253587',
          900: '#202970',
        },
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#7209b7',
          600: '#6b2ca5',
          700: '#5b2493',
          800: '#4c1d7a',
          900: '#3e1862',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: [
          'Segoe UI',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif'
        ],
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 8px 25px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
}