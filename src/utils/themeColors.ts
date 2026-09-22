import { ApplicationSettings } from '../types.ts';

export const DEFAULT_THEME_COLORS = {
  primary: '#005a71',
  secondary: '#ab3425',
  accent: '#d97706',
  topbar: '#005a71',
};

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  topbar: string;
}

export const THEME_COLOR_PRESETS: ThemePreset[] = [
  {
    id: 'default-teal',
    name: 'Teal & Terracotta (Default)',
    description: 'Nuansa sejuk & inklusif standar platform Kemenag',
    primary: '#005a71',
    secondary: '#ab3425',
    accent: '#d97706',
    topbar: '#005a71',
  },
  {
    id: 'kemenag-emerald',
    name: 'Hijau Kemenag & Emas Islami',
    description: 'Nuansa hijau Kementerian Agama dengan aksen emas mulia',
    primary: '#047857',
    secondary: '#0f766e',
    accent: '#ca8a04',
    topbar: '#065f46',
  },
  {
    id: 'royal-navy',
    name: 'Royal Navy & Crimson',
    description: 'Kombinasi biru maritim terpercaya dan merah hangat',
    primary: '#1d4ed8',
    secondary: '#be123c',
    accent: '#f59e0b',
    topbar: '#1e3a8a',
  },
  {
    id: 'forest-coral',
    name: 'Deep Forest & Coral',
    description: 'Keindahan alam hijau botani dengan sentuhan koral ramah',
    primary: '#15803d',
    secondary: '#c2410c',
    accent: '#eab308',
    topbar: '#14532d',
  },
  {
    id: 'midnight-violet',
    name: 'Indigo Malam & Ungu Dinamis',
    description: 'Palet modern kontemporer dengan kontras tajam',
    primary: '#4338ca',
    secondary: '#7c3aed',
    accent: '#0891b2',
    topbar: '#312e81',
  },
  {
    id: 'slate-bronze',
    name: 'Dark Slate & Perunggu Elegan',
    description: 'Gaya monokrom profesional dengan aksen hangat',
    primary: '#334155',
    secondary: '#b45309',
    accent: '#d97706',
    topbar: '#1e293b',
  },
];

// Check if hex is valid
export function isValidHex(hex?: string): boolean {
  if (!hex) return false;
  return /^#([0-9A-F]{3}){1,2}$/i.test(hex.trim());
}

// Convert hex to rgb
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

// Calculate relative luminance / brightness to determine contrast text (black or white)
export function getContrastTextColor(hex: string): '#ffffff' | '#0d1c2f' {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#ffffff';
  // Standard luminance formula
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq >= 150 ? '#0d1c2f' : '#ffffff';
}

// Generate container tint (soft background with opacity)
export function getContainerBg(hex: string, alpha = 0.14): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

// Apply theme colors to document root
export function applyThemeColors(settings?: Partial<ApplicationSettings>) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  const primary = settings?.primaryColor && isValidHex(settings.primaryColor)
    ? settings.primaryColor.trim()
    : DEFAULT_THEME_COLORS.primary;

  const secondary = settings?.secondaryColor && isValidHex(settings.secondaryColor)
    ? settings.secondaryColor.trim()
    : DEFAULT_THEME_COLORS.secondary;

  const accent = settings?.accentColor && isValidHex(settings.accentColor)
    ? settings.accentColor.trim()
    : DEFAULT_THEME_COLORS.accent;

  const topbar = settings?.topbarColor && isValidHex(settings.topbarColor)
    ? settings.topbarColor.trim()
    : primary;

  // Primary variables
  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-surface-tint', primary);
  root.style.setProperty('--color-primary-container', getContainerBg(primary, 0.15));
  root.style.setProperty('--color-on-primary', getContrastTextColor(primary));
  root.style.setProperty('--color-on-primary-container', primary);

  // Secondary variables
  root.style.setProperty('--color-secondary', secondary);
  root.style.setProperty('--color-secondary-container', getContainerBg(secondary, 0.15));
  root.style.setProperty('--color-on-secondary', getContrastTextColor(secondary));
  root.style.setProperty('--color-on-secondary-container', secondary);

  // Accent & Tertiary variables
  root.style.setProperty('--color-accent', accent);
  root.style.setProperty('--color-accent-container', getContainerBg(accent, 0.18));
  root.style.setProperty('--color-on-accent', getContrastTextColor(accent));
  root.style.setProperty('--color-on-accent-container', accent);
  root.style.setProperty('--color-tertiary', accent);
  root.style.setProperty('--color-tertiary-container', getContainerBg(accent, 0.18));
  root.style.setProperty('--color-on-tertiary', getContrastTextColor(accent));

  // Topbar variables
  root.style.setProperty('--color-topbar-bg', topbar);
  root.style.setProperty('--color-on-topbar', getContrastTextColor(topbar));
}
