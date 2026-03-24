/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        // Richer, modern primary brand colors
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Success / Progress
        success: {
          500: '#10b981',
          600: '#059669',
        },
        // Info / Analytics
        info: {
          500: '#0ea5e9',
        },
        // Warning
        warning: {
          500: '#f59e0b',
          600: '#d97706',
        },
        // Error
        error: {
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      borderRadius: {
        xs: '0.375rem',
        sm: '0.5rem',
        base: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        soft: '0 10px 40px -10px rgba(0,0,0,0.08)',
        glow: '0 0 20px rgba(99, 102, 241, 0.2)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out both',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      spacing: {
        '3xl': '2rem',
        '4xl': '3rem',
      },
      maxWidth: {
        '2xl': '42rem',
        '4xl': '56rem',
        '5xl': '64rem',
        '6xl': '72rem',
      },
    },
  },
  plugins: [],
};
