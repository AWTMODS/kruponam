/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kerala: {
          deep: '#0D472B',       // Deep Kerala Green
          dark: '#052E16',       // Rich Forest Green
          emerald: '#14532D',    // Emerald Leaf
          light: '#166534',      // Soft Green
          mint: '#DCFCE7',       // Mint background
        },
        gold: {
          light: '#FDE68A',      // Warm Gold Light
          royal: '#D4AF37',      // Royal Kerala Gold
          metallic: '#DAA520',   // Metallic Gold
          dark: '#B45309',       // Deep Gold
          amber: '#D97706',      // Amber Accent
        },
        cream: {
          ivory: '#FAF7F0',      // Ivory White
          warm: '#FDFBF7',       // Warm Cream
          soft: '#FBF5E8',       // Warm Soft Cream
          card: '#FFFFFF',       // Card background
        },
        maroon: {
          accent: '#7E1B1B',    // Kerala Maroon Accent
          deep: '#450A0A',      // Deep Maroon
        },
        floral: {
          yellow: '#FACC15',    // Marigold Yellow
          orange: '#EA580C',    // Marigold Orange
          red: '#DC2626',       // Rose Red
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
        display: ['Cinzel', 'serif'],
      },
      boxShadow: {
        'gold-glow': '0 10px 30px -10px rgba(212, 175, 55, 0.35)',
        'kerala-glow': '0 10px 30px -10px rgba(13, 71, 43, 0.25)',
        'card-soft': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 20px 40px rgba(13, 71, 43, 0.12)',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'spin-slow': 'spin 25s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(3deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.9', filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.4))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 25px rgba(212,175,55,0.8))' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
