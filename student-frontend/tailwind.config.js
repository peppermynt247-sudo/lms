/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Main Brand Colors
        primary: "#FF5B00", // Orange
        secondary: "#1a2b4e", // dark blue
        
        // Core UI Colors
        "body-bg": "#fbfbfb",
        "body-bg-1": "#F7F7F7",
        white: "#ffffff",
        black: "#000000",
        
        // Content & Text Colors
        content: "#5F6C76",
        "content-2": "#5C727D",
        "white-grey": "#6A7C92",
        "light-grey": "#7B8696",
        "light-black": "rgba(0,0,0,.5)",
        
        // Border Colors
        border: "#eeeeee",
        
        // Accent Colors
        green: "#44CEA9",
        orange: "#FF5B00",
        yellow: "#FF912C",
        indigo: "#B13BFF",
        sky: "#03A9F4",
        
        // Status Colors for LMS
        neutral: "#6B7280", // Gray for neutral states
        info: "#3B82F6", // Blue for informational messages
        success: "#10B981", // Green for success states
        warning: "#F59E0B", // Amber for warnings
        error: "#EF4444", // Red for errors
      
      },
    },
  },
  plugins: [],
}
