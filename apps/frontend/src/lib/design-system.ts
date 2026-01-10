import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Theme Types
export type Theme = 'light' | 'dark' | 'system'

export interface ColorPalette {
  // Primary colors
  primary: {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
    800: string
    900: string
  }
  // Secondary colors
  secondary: {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
    800: string
    900: string
  }
  // Semantic colors
  success: string
  warning: string
  error: string
  info: string
  // Neutral colors
  gray: {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
    800: string
    900: string
  }
  // Background colors
  background: {
    primary: string
    secondary: string
    tertiary: string
  }
  // Text colors
  text: {
    primary: string
    secondary: string
    tertiary: string
    inverse: string
  }
  // Border colors
  border: {
    primary: string
    secondary: string
    tertiary: string
  }
}

export interface Typography {
  fontFamily: {
    sans: string[]
    serif: string[]
    mono: string[]
  }
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    '4xl': string
    '5xl': string
    '6xl': string
  }
  fontWeight: {
    thin: number
    light: number
    normal: number
    medium: number
    semibold: number
    bold: number
    extrabold: number
    black: number
  }
  lineHeight: {
    tight: number
    snug: number
    normal: number
    relaxed: number
    loose: number
  }
  letterSpacing: {
    tight: string
    normal: string
    wide: string
  }
}

export interface Spacing {
  0: string
  1: string
  2: string
  3: string
  4: string
  5: string
  6: string
  8: string
  10: string
  12: string
  16: string
  20: string
  24: string
  32: string
  40: string
  48: string
  56: string
  64: string
}

export interface Breakpoints {
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
}

export interface Shadows {
  sm: string
  base: string
  md: string
  lg: string
  xl: string
  '2xl': string
  inner: string
}

export interface BorderRadius {
  none: string
  sm: string
  base: string
  md: string
  lg: string
  xl: string
  '2xl': string
  full: string
}

export interface DesignTokens {
  colors: ColorPalette
  typography: Typography
  spacing: Spacing
  breakpoints: Breakpoints
  shadows: Shadows
  borderRadius: BorderRadius
  transitions: {
    fast: string
    normal: string
    slow: string
  }
  zIndex: {
    hide: number
    auto: number
    base: number
    docked: number
    dropdown: number
    sticky: number
    banner: number
    overlay: number
    modal: number
    popover: number
    skipLink: number
    toast: number
    tooltip: number
  }
}

// Light theme colors
const lightColors: ColorPalette = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6'
  },
  text: {
    primary: '#111827',
    secondary: '#4b5563',
    tertiary: '#6b7280',
    inverse: '#ffffff'
  },
  border: {
    primary: '#e5e7eb',
    secondary: '#d1d5db',
    tertiary: '#9ca3af'
  }
}

// Dark theme colors
const darkColors: ColorPalette = {
  primary: {
    50: '#1e3a8a',
    100: '#1e40af',
    200: '#1d4ed8',
    300: '#2563eb',
    400: '#3b82f6',
    500: '#60a5fa',
    600: '#93c5fd',
    700: '#bfdbfe',
    800: '#dbeafe',
    900: '#eff6ff'
  },
  secondary: {
    50: '#0f172a',
    100: '#1e293b',
    200: '#334155',
    300: '#475569',
    400: '#64748b',
    500: '#94a3b8',
    600: '#cbd5e1',
    700: '#e2e8f0',
    800: '#f1f5f9',
    900: '#f8fafc'
  },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  gray: {
    50: '#111827',
    100: '#1f2937',
    200: '#374151',
    300: '#4b5563',
    400: '#6b7280',
    500: '#9ca3af',
    600: '#d1d5db',
    700: '#e5e7eb',
    800: '#f3f4f6',
    900: '#f9fafb'
  },
  background: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155'
  },
  text: {
    primary: '#f9fafb',
    secondary: '#d1d5db',
    tertiary: '#9ca3af',
    inverse: '#111827'
  },
  border: {
    primary: '#374151',
    secondary: '#4b5563',
    tertiary: '#6b7280'
  }
}

// Typography tokens
const typography: Typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
    mono: ['Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace']
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem'  // 60px
  },
  fontWeight: {
    thin: 100,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900
  },
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em'
  }
}

// Spacing tokens
const spacing: Spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem'     // 256px
}

// Breakpoint tokens
const breakpoints: Breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}

// Shadow tokens
const shadows: Shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
}

// Border radius tokens
const borderRadius: BorderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px'
}

// Complete design tokens
export const designTokens: DesignTokens = {
  colors: lightColors,
  typography,
  spacing,
  breakpoints,
  shadows,
  borderRadius,
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out'
  },
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  }
}

// Theme context
interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  colors: ColorPalette
  tokens: DesignTokens
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Theme provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme
    if (storedTheme) {
      setTheme(storedTheme)
    }
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setResolvedTheme(systemTheme)
      root.classList.remove('light', 'dark')
      root.classList.add(systemTheme)
    } else {
      setResolvedTheme(theme)
      root.classList.remove('light', 'dark')
      root.classList.add(theme)
    }

    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const colors = resolvedTheme === 'dark' ? darkColors : lightColors
  const tokens = { ...designTokens, colors }

  return (
    <ThemeContext.Provider value={{
      theme,
      resolvedTheme,
      colors,
      tokens,
      setTheme,
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Utility functions for design system
export const designUtils = {
  // Color utilities
  getColor: (color: string, opacity?: number) => {
    // In a real implementation, this would handle color manipulation
    return color
  },

  // Spacing utilities
  getSpacing: (value: keyof Spacing) => spacing[value],

  // Typography utilities
  getFontSize: (size: keyof Typography['fontSize']) => typography.fontSize[size],
  getFontWeight: (weight: keyof Typography['fontWeight']) => typography.fontWeight[weight],

  // Breakpoint utilities
  getBreakpoint: (bp: keyof Breakpoints) => breakpoints[bp],

  // Shadow utilities
  getShadow: (shadow: keyof Shadows) => shadows[shadow],

  // Border radius utilities
  getBorderRadius: (radius: keyof BorderRadius) => borderRadius[radius],

  // Responsive utilities
  responsive: (values: Record<string, any>) => {
    // In a real implementation, this would generate responsive CSS
    return values
  },

  // Animation utilities
  transition: (properties: string[], duration: keyof DesignTokens['transitions'] = 'normal') => {
    return `${properties.join(', ')} ${designTokens.transitions[duration]}`
  },

  // Accessibility utilities
  getA11yProps: (role: string, options?: any) => {
    // In a real implementation, this would generate accessibility attributes
    return {}
  }
}

// Component variants
export interface ComponentVariants {
  button: {
    primary: string
    secondary: string
    outline: string
    ghost: string
    danger: string
  }
  input: {
    default: string
    error: string
    success: string
  }
  card: {
    default: string
    elevated: string
    outlined: string
  }
}

export const componentVariants: ComponentVariants = {
  button: {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500'
  },
  input: {
    default: 'border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    error: 'border border-red-300 bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500',
    success: 'border border-green-300 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500'
  },
  card: {
    default: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    elevated: 'bg-white border border-gray-200 rounded-lg shadow-md',
    outlined: 'bg-white border-2 border-gray-300 rounded-lg'
  }
}

// CSS-in-JS utilities
export const cssUtils = {
  // Generate CSS variables
  generateCSSVars: (tokens: DesignTokens) => {
    const vars: Record<string, string> = {}
    
    // Color variables
    Object.entries(tokens.colors).forEach(([category, values]) => {
      if (typeof values === 'object') {
        Object.entries(values).forEach(([key, value]) => {
          vars[`--color-${category}-${key}`] = value
        })
      } else {
        vars[`--color-${category}`] = values
      }
    })

    // Typography variables
    Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
      vars[`--font-size-${key}`] = value
    })

    // Spacing variables
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      vars[`--spacing-${key}`] = value
    })

    return vars
  },

  // Generate responsive styles
  responsive: (styles: Record<string, Record<string, string>>) => {
    // In a real implementation, this would generate responsive CSS
    return styles
  },

  // Generate theme-aware styles
  themeAware: (lightStyles: Record<string, string>, darkStyles: Record<string, string>) => {
    // In a real implementation, this would generate theme-aware CSS
    return { light: lightStyles, dark: darkStyles }
  }
}
