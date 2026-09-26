const { gold, black, semantic } = require("./colors");
const { fontFamily } = require("./typography");

const screens = {
  xs: "480px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

const spacing = {
  18: "4.5rem",
  22: "5.5rem",
  30: "7.5rem",
  72: "18rem",
  80: "20rem",
  96: "24rem",
};

const boxShadow = {
  goldGlow:
    "0 0 0 1px rgba(217, 175, 87, 0.45), 0 0 18px rgba(217, 175, 87, 0.25), 0 18px 48px rgba(0, 0, 0, 0.6)",
  goldInset:
    "inset 0 0 0 1px rgba(245, 220, 154, 0.35), inset 0 0 20px rgba(217, 175, 87, 0.12)",
  luxe: "0 20px 80px rgba(0, 0, 0, 0.7)",
};

module.exports = {
  colors: {
    gold,
    black,
    semantic,
  },
  fontFamily,
  screens,
  spacing,
  boxShadow,
};
