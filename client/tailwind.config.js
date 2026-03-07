/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
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
