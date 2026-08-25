import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: '#0A0A0C',
        surface: {
          DEFAULT: '#141417',
          raised: '#1C1C21',
        },
        border: {
          subtle: '#2A2A30',
          strong: '#3D3D45',
        },
        text: {
          primary: '#F5F5F7',
          secondary: '#A1A1AA',
          tertiary: '#6B6B76',
        },
        accent: {
          DEFAULT: '#6C5CE7',
          hover: '#7D6FF0',
          muted: 'rgba(108, 92, 231, 0.12)',
          glow: 'rgba(108, 92, 231, 0.3)',
        },
        status: {
          success: '#22C55E',
          warning: '#F5A623',
          danger: '#F04438',
          info: '#38BDF8',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
