/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep dark base surfaces for the glassmorphism window aesthetic
        abyss: {
          950: '#020408',
          900: '#0a0f1a',
          800: '#111827',
        },
        // Neon accent ramp used for glows, active states, and focal points
        neon: {
          blue: '#3b82f6',
          indigo: '#6366f1',
          violet: '#8b5cf6',
          cyan: '#22d3ee',
        },
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
      },
      backgroundImage: {
        'neon-gradient': 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
        'glass-radial':
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent)',
        'glow-blue':
          'radial-gradient(circle at center, rgba(59, 130, 246, 0.25), transparent 70%)',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'neon-sm': '0 0 12px rgba(99, 102, 241, 0.35)',
        neon: '0 0 24px rgba(99, 102, 241, 0.45)',
        'neon-lg': '0 0 48px rgba(139, 92, 246, 0.5)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(99, 102, 241, 0.25)' },
          '50%': { boxShadow: '0 0 28px rgba(99, 102, 241, 0.55)' },
        },
      },
    },
  },
  plugins: [],
}
