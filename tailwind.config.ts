import type { Config } from 'tailwindcss';

/**
 * I colori puntano a CSS custom properties definite in `src/index.css`.
 * Usiamo il formato a canali RGB (`<alpha-value>`) così i modificatori di
 * opacità di Tailwind (es. `bg-primary/50`) continuano a funzionare.
 *
 * Per ri-brandizzare l'app basta cambiare le variabili in `:root`
 * (o sovrascriverle a runtime da `settings.theme`): nessun colore è hard-coded.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        muted: {
          DEFAULT: 'rgb(var(--color-muted) / <alpha-value>)',
          foreground: 'rgb(var(--color-muted-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--color-card) / <alpha-value>)',
          foreground: 'rgb(var(--color-card-foreground) / <alpha-value>)',
        },
        border: 'rgb(var(--color-border) / <alpha-value>)',
        input: 'rgb(var(--color-input) / <alpha-value>)',
        ring: 'rgb(var(--color-ring) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          foreground: 'rgb(var(--color-primary-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          foreground: 'rgb(var(--color-accent-foreground) / <alpha-value>)',
        },
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        destructive: {
          DEFAULT: 'rgb(var(--color-destructive) / <alpha-value>)',
          foreground: 'rgb(var(--color-destructive-foreground) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      boxShadow: {
        // Ombre morbide e calde (tinta espresso anziché nero puro)
        card: '0 1px 2px 0 rgb(43 33 26 / 0.04), 0 6px 16px -8px rgb(43 33 26 / 0.10)',
        'card-hover': '0 10px 34px -10px rgb(43 33 26 / 0.18), 0 4px 12px -6px rgb(43 33 26 / 0.10)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-slow': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-in-slow': 'fade-in-slow 0.6s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
