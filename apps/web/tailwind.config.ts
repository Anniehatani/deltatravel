import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        gold: {
          50: '#fbf9f1',
          100: '#f5f0dc',
          200: '#ebdcb5',
          300: '#dec288',
          400: '#cfa55b',
          500: '#b88939',
          600: '#9b6c2c',
          700: '#7a5126',
          800: '#634224',
          900: '#523722',
        },
      },
      boxShadow: {
        'luxury': '0 10px 35px -5px rgba(28, 25, 23, 0.05), 0 4px 12px -2px rgba(28, 25, 23, 0.03)',
        'luxury-hover': '0 20px 45px -10px rgba(184, 137, 57, 0.12), 0 8px 20px -4px rgba(28, 25, 23, 0.04)',
      },
    },
  },
  plugins: [],
} satisfies Config;

