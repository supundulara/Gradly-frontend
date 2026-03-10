// Gradly Design System — mirrors the web dark green theme
export const colors = {
    background: '#0f0f0f',
    surface: '#181818',
    surfaceElevated: '#202020',
    surfaceHover: '#242424',
    primary: '#22c55e',
    primaryDark: '#16a34a',
    primaryLight: '#4ade80',
    border: '#2a2a2a',
    borderSubtle: '#1e1e1e',
    text: '#ffffff',
    textSecondary: '#a1a1a1',
    textMuted: '#6b7280',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#22c55e',
    // Badge colors
    badgeGreenBg: 'rgba(34,197,94,0.1)',
    badgeGreenText: '#22c55e',
    badgeGrayBg: '#202020',
    badgeGrayText: '#a1a1a1',
};

export const spacing = {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24,
};

export const radius = {
    sm: 8, md: 12, lg: 16, xl: 20, full: 9999,
};

export const typography = {
    h1: { fontSize: 24, fontWeight: '700', color: colors.text },
    h2: { fontSize: 20, fontWeight: '700', color: colors.text },
    h3: { fontSize: 16, fontWeight: '600', color: colors.text },
    body: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    small: { fontSize: 12, color: colors.textMuted },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    bold: { fontWeight: '700' },
};
