/** @type {import('tailwindcss').Config} */

/*
 * matriXO design tokens.
 *
 * Semantic colours (canvas, surface, ink, muted, line, accent…) read CSS
 * variables defined in app/globals.css, so a single class works in both
 * themes: `bg-surface text-ink border-line` needs no `dark:` twin.
 *
 * The raw palettes below are the brand's own scales. `gray` is a true neutral
 * (no blue cast), and the old violet/purple/indigo family is folded into the
 * matriXO blue so every legacy gradient across the site lands on-brand.
 */

const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

const brand = {
  50: '#EEF6FF',
  100: '#D9EBFF',
  200: '#B7D8FF',
  300: '#86BDF9',
  400: '#4BA3F5',
  500: '#1F86EA',
  600: '#0A6FD6',
  700: '#0858AE',
  800: '#0B4A8C',
  900: '#0E3E72',
  950: '#0A2747',
}

// Deeper, slightly cooler companion to `brand`, used where legacy markup asked
// for purple/indigo/violet. Keeps two-stop gradients readable but on-brand.
const brandDeep = {
  50: '#EFF3FF',
  100: '#DEE6FF',
  200: '#C2D0FE',
  300: '#99AFFA',
  400: '#6C88F2',
  500: '#4A67E6',
  600: '#3550D4',
  700: '#2B40B0',
  800: '#28388C',
  900: '#25336F',
  950: '#171F43',
}

const neutral = {
  50: '#F9F9FB',
  100: '#F2F2F5',
  200: '#E6E6EA',
  300: '#D2D2D7',
  400: '#A1A1A6',
  500: '#86868B',
  600: '#6E6E73',
  700: '#48484A',
  800: '#2C2C2E',
  900: '#1D1D1F',
  950: '#0A0A0B',
}

module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        'canvas-subtle': token('canvas-subtle'),
        surface: token('surface'),
        elevated: token('elevated'),
        ink: token('ink'),
        muted: token('muted'),
        subtle: token('subtle'),
        line: token('line'),
        'line-strong': token('line-strong'),
        accent: {
          DEFAULT: token('accent'),
          hover: token('accent-hover'),
          soft: token('accent-soft'),
          solid: token('accent-solid'),
          'solid-hover': token('accent-solid-hover'),
          fg: token('accent-fg'),
        },
        success: token('success'),
        warning: token('warning'),
        danger: token('danger'),

        brand,
        primary: brand,
        blue: brand,
        sky: brand,
        indigo: brandDeep,
        violet: brandDeep,
        purple: brandDeep,
        gray: neutral,
        slate: neutral,
        zinc: neutral,
        neutral,

        // Legacy name kept so existing `neon-*` markup keeps compiling.
        neon: {
          blue: brand[700],
          purple: brand[500],
          pink: brand[300],
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        // Display sizes with tuned line-height and tracking.
        'display-sm': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '600' }],
        'display-md': ['3rem', { lineHeight: '1.06', letterSpacing: '-0.03em', fontWeight: '600' }],
        'display-lg': ['3.75rem', { lineHeight: '1.04', letterSpacing: '-0.035em', fontWeight: '600' }],
        'display-xl': ['4.5rem', { lineHeight: '1.02', letterSpacing: '-0.04em', fontWeight: '600' }],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        control: 'var(--radius-control)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        raised: 'var(--shadow-raised)',
        overlay: 'var(--shadow-overlay)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        spring: 'cubic-bezier(0.34, 1.36, 0.64, 1)',
      },
      maxWidth: {
        site: '1200px',
        prose: '68ch',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-down': 'slideDown 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scaleIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        glow: 'glow 2s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
