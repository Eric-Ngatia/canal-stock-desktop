/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Design system "Precision Logistics" (Stitch) — voir stitch-screens/00-design-system.
      // Couleurs pilotées par des variables CSS (voir index.css :root / .dark) pour le mode
      // sombre. Le format rgb(var(...) / <alpha-value>) garde le support des modificateurs
      // d'opacité Tailwind (ex. outline-variant/20) tout en permettant la bascule de thème.
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-container': 'rgb(var(--color-primary-container) / <alpha-value>)',
        'on-primary': 'rgb(var(--color-on-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        'secondary-container': 'rgb(var(--color-secondary-container) / <alpha-value>)',
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-container-lowest': 'rgb(var(--color-surface-container-lowest) / <alpha-value>)',
        'surface-container-low': 'rgb(var(--color-surface-container-low) / <alpha-value>)',
        'surface-container': 'rgb(var(--color-surface-container) / <alpha-value>)',
        'surface-container-high': 'rgb(var(--color-surface-container-high) / <alpha-value>)',
        'on-surface': 'rgb(var(--color-on-surface) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--color-on-surface-variant) / <alpha-value>)',
        outline: 'rgb(var(--color-outline) / <alpha-value>)',
        'outline-variant': 'rgb(var(--color-outline-variant) / <alpha-value>)',
        'border-color': 'rgb(var(--color-border-color) / <alpha-value>)',
        'table-header-bg': 'rgb(var(--color-table-header-bg) / <alpha-value>)',
        'table-hover-bg': 'rgb(var(--color-table-hover-bg) / <alpha-value>)',
        'status-gray-bg': 'rgb(var(--color-status-gray-bg) / <alpha-value>)',
        'status-gray-text': 'rgb(var(--color-status-gray-text) / <alpha-value>)',
        'status-orange-bg': 'rgb(var(--color-status-orange-bg) / <alpha-value>)',
        'status-orange-text': 'rgb(var(--color-status-orange-text) / <alpha-value>)',
        'status-green-bg': 'rgb(var(--color-status-green-bg) / <alpha-value>)',
        'status-green-text': 'rgb(var(--color-status-green-text) / <alpha-value>)',
        'status-red-bg': 'rgb(var(--color-status-red-bg) / <alpha-value>)',
        'status-red-text': 'rgb(var(--color-status-red-text) / <alpha-value>)',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      spacing: {
        base_unit: '4px',
        gutter: '16px',
        margin_mobile: '16px',
        margin_desktop: '24px',
        container_max_width: '1440px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'body-table': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'page-title': ['20px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'label-metadata': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '500' }],
        subtitle: ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'key-value': ['28px', { lineHeight: '34px', letterSpacing: '-0.02em', fontWeight: '600' }],
      },
      boxShadow: {
        'level-1': '0 1px 3px rgba(0,0,0,0.05)',
        'level-2': '0 10px 15px -3px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: { themes: ['corporate'] },
};
