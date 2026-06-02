import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        "accent-from": "hsl(var(--accent-from))",
        "accent-to": "hsl(var(--accent-to))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
        space: {
          50: "hsl(var(--space-50))",
          100: "hsl(var(--space-100))",
          200: "hsl(var(--space-200))",
          300: "hsl(var(--space-300))",
          400: "hsl(var(--space-400))",
          500: "hsl(var(--space-500))",
          600: "hsl(var(--space-600))",
          700: "hsl(var(--space-700))",
          800: "hsl(var(--space-800))",
          900: "hsl(var(--space-900))",
          950: "hsl(var(--space-950))"
        }
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 12px 36px hsla(var(--accent-to), 0.30)",
        panel: "var(--neu-shadow-out)",
        "panel-sm": "var(--neu-shadow-out-sm)",
        "panel-inset": "var(--neu-shadow-in)"
      },
      backgroundImage: {
        "accent-gradient": "var(--accent-gradient)"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
