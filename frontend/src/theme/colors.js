// Quibet design system — calm recovery palette (no casino red/gold).
export const palette = {
  primary: '#1E3A5F',
  primaryDark: '#152A45',
  // Neutral soft fill — keep brand via icons/text, not a blue wash behind content.
  primarySoft: '#E8ECF1',
  secondary: '#2A9D8F',
  secondaryDark: '#1F7F73',
  secondarySoft: '#DDF3F0',
  background: '#F4F6F9',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF2F6',
  text: '#2B2D42',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E3E7EE',
  warning: '#E9C46A',
  warningSoft: '#FBF4DF',
  // Darker amber for small text on light backgrounds (WCAG AA).
  warningText: '#7A6210',
  success: '#4CAF87',
  successSoft: '#E4F5ED',
  white: '#FFFFFF',
  black: '#0F1419',
};

export const lightColors = {
  background: palette.background,
  surface: palette.surface,
  surfaceMuted: palette.surfaceMuted,
  primary: palette.primary,
  primaryMuted: palette.primarySoft,
  secondary: palette.secondary,
  secondaryMuted: palette.secondarySoft,
  // Streaks / links / progress accents use calm teal.
  accent: palette.secondary,
  accentMuted: palette.secondarySoft,
  text: palette.text,
  textSecondary: palette.textSecondary,
  textInverse: palette.white,
  border: palette.border,
  success: palette.success,
  successMuted: palette.successSoft,
  // Alerts / restrictions use muted amber — never bright red.
  warning: palette.warning,
  warningMuted: palette.warningSoft,
  danger: palette.warningText,
  dangerMuted: palette.warningSoft,
  overlay: 'rgba(43, 45, 66, 0.45)',
  gradient: [palette.primary, palette.secondary],
  splashGradient: [palette.primaryDark, palette.primary, palette.secondary],
  // Soft professional canvas (navy mist → white → teal mist).
  canvasGradient: ['#E9EEF5', '#F7F9FC', '#EAF4F2'],
  statusBar: 'dark',
};

export const darkColors = {
  // Clear elevation layers so cards, chips, and text separate from the canvas.
  background: '#0E1218',
  surface: '#1A2230',
  surfaceMuted: '#273246',
  primary: '#A9C2DE',
  primaryMuted: '#2C4058',
  secondary: '#5ECDC0',
  secondaryMuted: '#1B4540',
  accent: '#5ECDC0',
  accentMuted: '#1B4540',
  text: '#F5F7FA',
  textSecondary: '#C5CDD8',
  textInverse: '#0E1218',
  border: '#3E4C61',
  success: '#7DD4A8',
  successMuted: '#1A3D30',
  warning: '#F0D078',
  warningMuted: '#4A4020',
  danger: '#F0D078',
  dangerMuted: '#4A4020',
  overlay: 'rgba(0, 0, 0, 0.62)',
  gradient: ['#3D5A80', '#2A9D8F'],
  splashGradient: ['#0E1218', '#152A45', '#1B4540'],
  // Enough tonal separation that screens don't read as one black slab.
  canvasGradient: ['#182338', '#0E1218', '#142820'],
  statusBar: 'light',
};
