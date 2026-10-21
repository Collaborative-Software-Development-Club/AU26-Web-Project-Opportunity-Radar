module.exports = {
  // NativeWind's Expo web stylesheet observer sets the scheme after CSS loads.
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        "lora-bold": ["Lora_700Bold"],
      },
    },
  },
  plugins: [],
};
