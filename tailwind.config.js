const theme = require("./src/theme");

module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: theme.screens,
      spacing: theme.spacing,
      boxShadow: theme.boxShadow,
      fontFamily: theme.fontFamily,
      colors: {
        ...theme.colors.gold,
        ...theme.colors.black,
        ...theme.colors.semantic,
        gold: theme.colors.gold,
        black: theme.colors.black,
        brand: theme.colors.semantic,
      },
    },
  },
  plugins: [],
};
