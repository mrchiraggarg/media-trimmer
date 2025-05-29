// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        clay: '10px 10px 20px #c8d0e7, -10px -10px 20px #ffffff',
        clayInset: 'inset 6px 6px 10px #c8d0e7, inset -6px -6px 10px #ffffff',
      },
      borderRadius: {
        clay: '1.5rem',
      },
    },
  },
  plugins: [],
};
