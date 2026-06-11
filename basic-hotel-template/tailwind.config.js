/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",

        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },

        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },

        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },

        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },

        border: "var(--border)",
        gold: "var(--gold)",
      },

      fontFamily: {
        sans: ["Work Sans", "sans-serif"],
        serif: ["Instrument Serif", "serif"],
      },

      boxShadow: {
        elegant: "0 20px 60px rgba(15, 23, 42, 0.25)",
      },

      backgroundImage: {
        hero:
          "linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#0ea5e9 100%)",
      },
    },
  },

  plugins: [],
};
