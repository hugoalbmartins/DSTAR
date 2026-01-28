export const designTokens = {
  colors: {
    primary: {
      50: '#e6f0ff',
      100: '#b3d4ff',
      200: '#80b8ff',
      300: '#4d9cff',
      400: '#1a80ff',
      500: '#0066e6',
      600: '#0052b8',
      700: '#003d8a',
      800: '#00295c',
      900: '#00142e',
    },
    secondary: {
      50: '#f0f9ff',
      100: '#d9eeff',
      200: '#b3ddff',
      300: '#8cccff',
      400: '#66bbff',
      500: '#40aaff',
      600: '#1a99ff',
      700: '#0077cc',
      800: '#005599',
      900: '#003366',
    },
    accent: {
      50: '#e6f7ff',
      100: '#b3e5ff',
      200: '#80d4ff',
      300: '#4dc2ff',
      400: '#1ab1ff',
      500: '#009fe6',
      600: '#0080b8',
      700: '#00608a',
      800: '#00405c',
      900: '#00202e',
    },
    success: {
      50: '#e6fff2',
      100: '#b3ffd9',
      200: '#80ffc0',
      300: '#4dffa7',
      400: '#1aff8e',
      500: '#00e675',
      600: '#00b85c',
      700: '#008a43',
      800: '#005c2a',
      900: '#002e15',
    },
    warning: {
      50: '#fff8e6',
      100: '#ffedb3',
      200: '#ffe080',
      300: '#ffd44d',
      400: '#ffc81a',
      500: '#e6b300',
      600: '#b88f00',
      700: '#8a6b00',
      800: '#5c4700',
      900: '#2e2400',
    },
    error: {
      50: '#ffe6e6',
      100: '#ffb3b3',
      200: '#ff8080',
      300: '#ff4d4d',
      400: '#ff1a1a',
      500: '#e60000',
      600: '#b80000',
      700: '#8a0000',
      800: '#5c0000',
      900: '#2e0000',
    },
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    gradient: {
      primary: 'linear-gradient(135deg, #0066e6 0%, #003d8a 100%)',
      primaryHover: 'linear-gradient(135deg, #1a80ff 0%, #0052b8 100%)',
      secondary: 'linear-gradient(135deg, #40aaff 0%, #0077cc 100%)',
      accent: 'linear-gradient(135deg, #009fe6 0%, #00608a 100%)',
      success: 'linear-gradient(135deg, #00e675 0%, #008a43 100%)',
      dark: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      glass: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    }
  },

  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
  },

  typography: {
    fontFamily: {
      sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      mono: '"Fira Code", "Courier New", monospace',
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },

  borderRadius: {
    none: '0',
    sm: '0.25rem',
    base: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(0, 102, 230, 0.4)',
    glowHover: '0 0 30px rgba(0, 102, 230, 0.6)',
  },

  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  animation: {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    slideDown: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },
    slideLeft: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    },
    slideRight: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
    },
  },
};

export const getColorValue = (colorPath) => {
  const keys = colorPath.split('.');
  let value = designTokens.colors;

  for (const key of keys) {
    value = value[key];
    if (value === undefined) return colorPath;
  }

  return value;
};

export const getSpacing = (size) => {
  return designTokens.spacing[size] || size;
};

export const getTransition = (type = 'base') => {
  return designTokens.transitions[type] || designTokens.transitions.base;
};
