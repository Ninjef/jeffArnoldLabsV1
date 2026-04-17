import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'idea-glow': {
          '0%, 100%': { textShadow: 'none' },
          '50%': {
            textShadow:
              '0 0 10px rgba(250, 204, 21, 0.9), 0 0 2px rgba(202, 138, 4, 0.6)',
            color: 'rgb(161, 98, 7)',
          },
        },
        'bulb-float': {
          '0%':   { opacity: '0', transform: 'translate(-50%, 0.2em) scale(0.6)' },
          '25%':  { opacity: '1', transform: 'translate(-50%, -0.3em) scale(1.1)' },
          '75%':  { opacity: '1', transform: 'translate(-50%, -0.1em) scale(1.0)' },
          '100%': { opacity: '0', transform: 'translate(-50%, -0.4em) scale(0.9)' },
        },
        'bulb-float-stay': {
          '0%':   { opacity: '0', transform: 'translate(-50%, 0.2em) scale(0.6)' },
          '50%':  { opacity: '1', transform: 'translate(-50%, -0.35em) scale(1.15)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -0.2em) scale(1.0)' },
        },
      },
      animation: {
        'idea-glow': 'idea-glow 1.4s ease-in-out',
        'bulb-float': 'bulb-float 1.4s ease-in-out forwards',
        'bulb-float-stay': 'bulb-float-stay 1.0s ease-in-out forwards',
      },
    },
  },
  plugins: [typography],
};
