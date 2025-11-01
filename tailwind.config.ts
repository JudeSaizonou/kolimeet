import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '3rem',
        '2xl': '4rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1400px',
      },
    },
    extend: {
      // Système d'espacement baseline grid (multiples de 4px)
      spacing: {
        '0.25': '0.0625rem', // 1px
        '0.75': '0.1875rem', // 3px
        '1.25': '0.3125rem', // 5px
        '1.5': '0.375rem',   // 6px
        '2.5': '0.625rem',   // 10px
        '3.5': '0.875rem',   // 14px
        '4.5': '1.125rem',   // 18px
        '5.5': '1.375rem',   // 22px
        '6.5': '1.625rem',   // 26px
        '7.5': '1.875rem',   // 30px
        '8.5': '2.125rem',   // 34px
        '9.5': '2.375rem',   // 38px
        '15': '3.75rem',     // 60px
        '17': '4.25rem',     // 68px
        '18': '4.5rem',      // 72px
        '19': '4.75rem',     // 76px
        '21': '5.25rem',     // 84px
        '22': '5.5rem',      // 88px
        '25': '6.25rem',     // 100px
        '30': '7.5rem',      // 120px
        '35': '8.75rem',     // 140px
        '40': '10rem',       // 160px
      },
      // Typographie fluide avec clamp
      fontSize: {
        'fluid-xs': ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        'fluid-sm': ['clamp(0.875rem, 0.8rem + 0.375vw, 1rem)', { lineHeight: '1.5', letterSpacing: '0.005em' }],
        'fluid-base': ['clamp(1rem, 0.95rem + 0.25vw, 1.125rem)', { lineHeight: '1.6', letterSpacing: '0' }],
        'fluid-lg': ['clamp(1.125rem, 1rem + 0.625vw, 1.25rem)', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        'fluid-xl': ['clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)', { lineHeight: '1.4', letterSpacing: '-0.015em' }],
        'fluid-2xl': ['clamp(1.5rem, 1.2rem + 1.5vw, 2rem)', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        'fluid-3xl': ['clamp(1.875rem, 1.4rem + 2.375vw, 2.5rem)', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        'fluid-4xl': ['clamp(2.25rem, 1.6rem + 3.25vw, 3.5rem)', { lineHeight: '1.15', letterSpacing: '-0.03em' }],
        'fluid-5xl': ['clamp(3rem, 2rem + 5vw, 4.5rem)', { lineHeight: '1.1', letterSpacing: '-0.035em' }],
        'fluid-6xl': ['clamp(3.75rem, 2.5rem + 6.25vw, 6rem)', { lineHeight: '1.05', letterSpacing: '-0.04em' }],
      },
      // Grid system 12 colonnes
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))',
        '14': 'repeat(14, minmax(0, 1fr))',
        '15': 'repeat(15, minmax(0, 1fr))',
        '16': 'repeat(16, minmax(0, 1fr))',
      },
      // Backdrop filters pour liquid glass
      backdropBlur: {
        xs: '2px',
        '4xl': '72px',
        '5xl': '96px',
      },
      backdropSaturate: {
        25: '.25',
        75: '.75',
        125: '1.25',
      },
      // Box shadows pour glow effects
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.2)',
        'glass-lg': '0 16px 64px 0 rgba(31, 38, 135, 0.5)',
        'glow-white': '0 0 20px rgba(255, 255, 255, 0.5)',
        'glow-primary': '0 0 30px rgba(31, 111, 235, 0.6)',
        'glow-success': '0 0 30px rgba(16, 185, 129, 0.6)',
        'glow-warning': '0 0 30px rgba(245, 158, 11, 0.6)',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
