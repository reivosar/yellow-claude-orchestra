/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Monaco', 'Menlo', 'Ubuntu Mono', 'monospace'],
      },
      colors: {
        terminal: {
          bg: '#1a1a1a',
          text: '#00ff00',
          producer: '#ff6b6b',
          director: '#4ecdc4',
          actor: '#45b7d1',
          system: '#96ceb4',
        }
      }
    },
  },
  plugins: [],
}