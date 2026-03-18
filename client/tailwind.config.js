/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        wa: {
          green: '#25D366',
          dark: '#075E54',
          light: '#dcf8c6'
        },
        surface: {
          bg: 'var(--bg-base)',
          card: 'var(--bg-card)',
          elevated: 'var(--bg-elevated)',
          border: 'var(--border)'
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)'
        },
        accent: {
          green: 'var(--accent-green)',
          greenHover: 'var(--accent-green-dim)',
          amber: 'var(--accent-amber)',
          red: 'var(--accent-red)',
          blue: 'var(--accent-blue)'
        }
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        heading: ['"Syne"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
