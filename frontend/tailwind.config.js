/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'memory-bg': '#faf6f1',
        'memory-bg-secondary': '#ede8e1',
        'memory-bg-card': '#ffffff',
        'memory-accent': '#c0392b',
        'memory-accent-dim': '#922b21',
        'memory-accent-glow': 'rgba(192, 57, 43, 0.2)',
        'memory-purple': '#1a3a5c',
        'memory-purple-light': '#2e6da4',
        'memory-blue': '#1a3a5c',
        'memory-text': '#1c1c1c',
        'memory-text-muted': '#666666',
        'memory-glass': 'rgba(0, 0, 0, 0.03)',
        'memory-glass-border': 'rgba(0, 0, 0, 0.12)',
      },
      fontFamily: {
        heading: ['Georgia', 'Times New Roman', 'serif'],
        body: ['system-ui', '-apple-system', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'glow-gold': '0 2px 8px rgba(192, 57, 43, 0.2)',
        'glow-purple': '0 2px 8px rgba(26, 58, 92, 0.2)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'paper': '0 2px 12px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.08)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'float-slow': 'float 8s ease-in-out 1s infinite',
        'memory-entrance': 'memoryEntrance 0.5s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'waveform': 'waveform 0.8s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 4s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'orb-pulse': 'orbPulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        memoryEntrance: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
        waveform: {
          '0%': { transform: 'scaleY(0.3)' },
          '100%': { transform: 'scaleY(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        orbPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
      },
      backgroundImage: {
        'shimmer-gradient':
          'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.04) 50%, transparent 100%)',
        'radial-glow':
          'radial-gradient(ellipse at center, rgba(26, 58, 92, 0.08) 0%, transparent 70%)',
        'gold-glow':
          'radial-gradient(ellipse at center, rgba(192, 57, 43, 0.08) 0%, transparent 60%)',
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
      },
    },
  },
  plugins: [],
}
