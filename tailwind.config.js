/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // fontFamily: {
      //   roboto: ["Roboto-Regular", "sans-serif"],
      //   roboto_bold: ["Roboto-Bold", "sans-serif"],
      // },
      colors: {
        primary_green: "#67AB0F",
        primary_green_light: "#95BC54",
        primary_gray: "#A7B0AD",
        primary_blue: "#056CE5",
        secondary_green: "#233C35",
        secondary_green_deep: "#2E5B24",
        secondary_blue_deep: "#0C4BA5",
      },
    },
  },
  plugins: [],
};
