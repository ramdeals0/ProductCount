export const colors = {
  background: '#F5F5F4',
  surface: '#FFFFFF',
  text: '#1C1917',
  textSecondary: '#78716C',
  border: '#E7E5E4',
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  success: '#16A34A',
  successBg: '#DCFCE7',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  restricted: '#7C3AED',
  restrictedBg: '#EDE9FE',
  muted: '#A8A29E',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const tapTarget = 48;

export const typography = {
  title: { fontSize: 24, fontWeight: '700' as const },
  heading: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  label: { fontSize: 14, fontWeight: '500' as const },
};
