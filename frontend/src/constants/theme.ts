import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1E293B',          // Slate 800
    textSecondary: '#64748B', // Slate 500
    textMuted: '#94A3B8',     // Slate 400
    background: '#F8FAFC',    // Slate 50
    card: '#FFFFFF',
    border: '#E2E8F0',        // Slate 200
    primary: '#6366F1',       // Indigo 500
    primaryLight: '#EEF2FF',  // Indigo 50
    success: '#10B981',       // Emerald 500
    danger: '#F43F5E',        // Rose 500
    warning: '#F59E0B',       // Amber 500
    info: '#0EA5E9',          // Sky 500
    glassBg: 'rgba(255, 255, 255, 0.75)',
    glassBorder: 'rgba(255, 255, 255, 0.5)',
    gradientStart: '#EEF2FF',
    gradientEnd: '#E0E7FF',
    tint: '#6366F1',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#6366F1',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
  },
  dark: {
    text: '#F8FAFC',          // Slate 50
    textSecondary: '#94A3B8', // Slate 400
    textMuted: '#475569',     // Slate 600
    background: '#0F172A',    // Slate 900
    card: '#1E293B',          // Slate 800
    border: '#334155',        // Slate 700
    primary: '#818CF8',       // Indigo 400
    primaryLight: '#312E81',  // Indigo 900
    success: '#34D399',       // Emerald 400
    danger: '#FB7185',        // Rose 400
    warning: '#FBBF24',       // Amber 400
    info: '#38BDF8',          // Sky 400
    glassBg: 'rgba(30, 41, 59, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    gradientStart: '#0F172A',
    gradientEnd: '#1E1B4B',   // Deep Purple / Indigo base
    tint: '#818CF8',
    tabIconDefault: '#475569',
    tabIconSelected: '#818CF8',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    mono: 'Courier New',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    mono: 'monospace',
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export const BottomTabInset = Platform.select({ ios: 34, android: 16 }) ?? 0;
export const MaxContentWidth = 800;
