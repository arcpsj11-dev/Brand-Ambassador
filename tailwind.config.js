/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        brand: {
          primary: "#00E0FF", // Neon Blue
          secondary: "#0057FF",
          accent: "#7000FF",
        },
        card: "rgba(255, 255, 255, 0.03)",
      },
      boxShadow: {
        neon: "0 0 20px rgba(0, 224, 255, 0.5)",
      },
    },
  },
  plugins: [],

}

