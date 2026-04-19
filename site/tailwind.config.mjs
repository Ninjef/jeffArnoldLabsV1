import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'text-flash': {
          '0%, 100%': { textShadow: 'none' },
          '50%': {
            textShadow:
              '0 0 10px var(--flash-color), 0 0 2px var(--flash-color)',
            color: 'var(--flash-color)',
          },
        },
        'sequence-glow': {
          '0%, 100%': { textShadow: 'none' },
          '50%': {
            textShadow:
              '0 0 10px var(--flash-color), 0 0 2px var(--flash-color)',
            color: 'var(--flash-color)',
          },
        },
        'emoji-float': {
          '0%':   { opacity: '0', transform: 'translate(-50%, 0.2em) scale(0.6)' },
          '25%':  { opacity: '1', transform: 'translate(-50%, -0.3em) scale(1.1)' },
          '75%':  { opacity: '1', transform: 'translate(-50%, -0.1em) scale(1.0)' },
          '100%': { opacity: '0', transform: 'translate(-50%, -0.4em) scale(0.9)' },
        },
        'emoji-stretch-blur': {
          '0%':   { opacity: '0', transform: 'translate(-60%, -50%) scaleX(1)',   filter: 'blur(0)' },
          '15%':  { opacity: '1', transform: 'translate(-30%, -50%) scaleX(2)',   filter: 'blur(2px)' },
          '60%':  { opacity: '1', transform: 'translate(20%, -50%) scaleX(4.5)',  filter: 'blur(6px)' },
          '85%':  { opacity: '0.85', transform: 'translate(50%, -50%) scaleX(5.5)', filter: 'blur(10px)' },
          '100%': { opacity: '0', transform: 'translate(80%, -50%) scaleX(6)',    filter: 'blur(14px)' },
        },
        'emoji-stretch-blur-left': {
          '0%':   { opacity: '0', transform: 'translate(60%, -50%) scaleX(1)',    filter: 'blur(0)' },
          '15%':  { opacity: '1', transform: 'translate(30%, -50%) scaleX(2)',    filter: 'blur(2px)' },
          '60%':  { opacity: '1', transform: 'translate(-20%, -50%) scaleX(4.5)', filter: 'blur(6px)' },
          '85%':  { opacity: '0.85', transform: 'translate(-50%, -50%) scaleX(5.5)', filter: 'blur(10px)' },
          '100%': { opacity: '0', transform: 'translate(-80%, -50%) scaleX(6)',   filter: 'blur(14px)' },
        },
        'emoji-expand': {
          '0%':   { opacity: '1',   transform: 'translate(-50%, -50%) scale(0.3)' },
          '60%':  { opacity: '0.6', transform: 'translate(-50%, -50%) scale(2.5)' },
          '100%': { opacity: '0',   transform: 'translate(-50%, -50%) scale(5)' },
        },
        'lightning-bolt': {
          '0%':   { opacity: '0', strokeDashoffset: '1' },
          '5%':   { opacity: '1', strokeDashoffset: '1' },
          '18%':  { opacity: '1', strokeDashoffset: '0' },
          '40%':  { opacity: '1', strokeDashoffset: '0' },
          '85%':  { opacity: '0.35', strokeDashoffset: '0' },
          '100%': { opacity: '0', strokeDashoffset: '0' },
        },
        'lightning-branch': {
          '0%':   { opacity: '0', strokeDashoffset: '1' },
          '12%':  { opacity: '0', strokeDashoffset: '1' },
          '16%':  { opacity: '1', strokeDashoffset: '1' },
          '26%':  { opacity: '1', strokeDashoffset: '0' },
          '45%':  { opacity: '1', strokeDashoffset: '0' },
          '85%':  { opacity: '0.3', strokeDashoffset: '0' },
          '100%': { opacity: '0', strokeDashoffset: '0' },
        },
        'lightning-flash': {
          '0%':   { opacity: '0' },
          '15%':  { opacity: '0' },
          '19%':  { opacity: '0.65' },
          '26%':  { opacity: '0.15' },
          '38%':  { opacity: '0' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'text-flash':              'text-flash 1.4s ease-in-out',
        'sequence-glow':           'sequence-glow 1.2s ease-in-out',
        'emoji-float':             'emoji-float 1.4s ease-in-out forwards',
        'emoji-stretch-blur':      'emoji-stretch-blur 2.4s ease-out forwards',
        'emoji-stretch-blur-left': 'emoji-stretch-blur-left 2.4s ease-out forwards',
        'emoji-expand-fast':       'emoji-expand 0.7s ease-out forwards',
        'emoji-expand-slow':       'emoji-expand 1.8s ease-out forwards',
        'lightning-bolt':          'lightning-bolt 1.6s ease-out forwards',
        'lightning-branch':        'lightning-branch 1.6s ease-out forwards',
        'lightning-flash':         'lightning-flash 1.6s ease-out forwards',
      },
    },
  },
  plugins: [typography],
};
