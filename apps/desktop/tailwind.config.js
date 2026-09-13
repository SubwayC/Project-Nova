/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Primary brand colors
        nova: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bcfd',
          400: '#8196fa',
          500: '#6172f3',
          600: '#4f56e8',
          700: '#4145cc',
          800: '#353aa4',
          900: '#2f3582',
        },
        // Surface colors (light theme)
        surface: {
          bg: '#FFFFFF',
          panel: '#FFFFFF',
          sidebar: '#FFFFFF',
          hover: '#F2F2F2',
          active: '#E8E8E8',
          border: '#E5E5E5',
          'border-strong': '#D4D4D4',
        },
        // Text colors
        text: {
          primary: '#1A1A1A',
          secondary: '#555555',
          tertiary: '#888888',
          disabled: '#BBBBBB',
          inverse: '#FFFFFF',
          'on-accent': '#FFFFFF',
        },
      },
      spacing: {
        'toolbar': '40px',
        'activity-bar': '48px',
        'sidebar': '260px',
        'properties': '260px',
        'status-bar': '24px',
        'bottom-panel': '200px',
      },
      borderRadius: {
        'sm': '3px',
        DEFAULT: '4px',
        'md': '6px',
        'lg': '8px',
      },
      boxShadow: {
        'panel': '1px 0 0 0 #E0E0E0',
        'panel-left': '-1px 0 0 0 #E0E0E0',
        'panel-top': '0 -1px 0 0 #E0E0E0',
        'panel-bottom': '0 1px 0 0 #E0E0E0',
        'dropdown': '0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
        'modal': '0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)',
      },
      fontSize: {
        'xxs': ['10px', '14px'],
        'xs': ['11px', '16px'],
        'sm': ['12px', '18px'],
        'base': ['13px', '20px'],
        'md': ['14px', '20px'],
        'lg': ['16px', '24px'],
        'xl': ['18px', '28px'],
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-in-left': 'slideInLeft 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.2s ease-out',
        'scale-in': 'scaleIn 0.1s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideInLeft: {
          from: { transform: 'translateX(-8px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          from: { transform: 'translateX(8px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
