const preset = require('@myworkouts/config/tailwind');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [preset, require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};
