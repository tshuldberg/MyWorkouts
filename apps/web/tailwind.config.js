const preset = require('@myworkouts/config/tailwind');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  presets: [preset],
  theme: {
    extend: {},
  },
  plugins: [],
};
