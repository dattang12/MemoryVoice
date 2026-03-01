import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        accent: {
          green: "#22c55e",
          red: "#ef4444",
          yellow: "#eab308",
        },
        // Badminton court colors
        court: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          surface: "#2d5a3d",
          line: "#ffffff",
        },
        // Shuttlecock colors
        shuttle: {
          feather: "#fafaf9",
          cork: "#a8845c",
          trail: "#0ea5e9",
        },
        // Coach accent
        coach: {
          gold: "#f59e0b",
          bronze: "#cd7f32",
          silver: "#9ca3af",
        },
        // Dark theme surfaces
        dark: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          850: "#172033",
          900: "#0f172a",
          950: "#020617",
        },
      },
      backgroundImage: {
        'court-pattern': "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
        'court-gradient': "linear-gradient(135deg, #166534 0%, #14532d 100%)",
        'shuttle-trail': "linear-gradient(90deg, transparent 0%, #0ea5e9 50%, transparent 100%)",
        'hero-gradient': "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)",
        'card-shine': "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)",
      },
      backgroundSize: {
        'court-grid': '40px 40px',
      },
      animation: {
        'shuttle-fly': 'shuttleFly 0.6s ease-out',
        'court-pulse': 'courtPulse 2s ease-in-out infinite',
        'score-pop': 'scorePop 0.3s ease-out',
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-up-delay-1': 'fadeUp 0.6s ease-out 0.1s forwards',
        'fade-up-delay-2': 'fadeUp 0.6s ease-out 0.2s forwards',
        'fade-up-delay-3': 'fadeUp 0.6s ease-out 0.3s forwards',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shuttleFly: {
          '0%': { transform: 'translateX(-10px) rotate(-15deg)', opacity: '0' },
          '100%': { transform: 'translateX(0) rotate(0)', opacity: '1' },
        },
        courtPulse: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.8' },
        },
        scorePop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(14, 165, 233, 0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(14, 165, 233, 0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'court': '0 4px 6px -1px rgba(22, 101, 52, 0.1), 0 2px 4px -1px rgba(22, 101, 52, 0.06)',
        'shuttle': '0 0 15px rgba(14, 165, 233, 0.3)',
        'card-hover': '0 20px 40px -12px rgba(0, 0, 0, 0.15)',
        'glow-blue': '0 0 30px rgba(14, 165, 233, 0.2)',
        'glow-green': '0 0 30px rgba(34, 197, 94, 0.2)',
        'dark-card': '0 4px 20px rgba(0, 0, 0, 0.25)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
