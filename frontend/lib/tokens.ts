export type SemanticColorKey =
  | 'bg'
  | 'surface'
  | 'fg'
  | 'muted'
  | 'border'
  | 'accent'
  | 'accentDim'
  | 'accentStrong'
  | 'success'
  | 'warn'
  | 'danger';

export const Colors = {
  bg: 'oklch(98% 0.004 240)',
  surface: 'oklch(100% 0 0)',
  fg: 'oklch(20% 0.02 240)',
  muted: 'oklch(42% 0.022 240)',
  border: 'oklch(78% 0.012 240)',
  accent: 'oklch(55% 0.18 35)',
  accentDim: 'oklch(55% 0.18 35 / 0.15)',
  accentStrong: 'oklch(48% 0.19 35)',
  success: 'oklch(52% 0.12 145)',
  warn: 'oklch(60% 0.14 85)',
  danger: 'oklch(52% 0.16 30)',
} as const satisfies Record<SemanticColorKey, string>;

export const TypographyFamilies = {
  display: "'Söhne', 'Avenir Next', -apple-system, system-ui, sans-serif",
  body: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
  mono: "ui-monospace, 'JetBrains Mono', monospace",
} as const;

export const Typography = {
  appTitle: {
    family: TypographyFamilies.display,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.56,
  },
  screenTitle: {
    family: TypographyFamilies.display,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 29,
    letterSpacing: -0.48,
  },
  sectionTitle: {
    family: TypographyFamilies.body,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  body: {
    family: TypographyFamilies.body,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  cardTitle: {
    family: TypographyFamilies.body,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 21,
  },
  cardSubtitle: {
    family: TypographyFamilies.body,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  button: {
    family: TypographyFamilies.body,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 18,
  },
  chipLabel: {
    family: TypographyFamilies.body,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 17,
  },
  meta: {
    family: TypographyFamilies.body,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 17,
  },
  badge: {
    family: TypographyFamilies.body,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 14,
  },
  micro: {
    family: TypographyFamilies.body,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
  },
} as const;

export const Spacing = {
  xs2: 2,
  xs: 4,
  sm: 8,
  sm2: 10,
  gap: 12,
  md: 16,
  md2: 20,
  lg: 24,
  xl: 32,
  xl2: 44,
  screenMaxWidth: 430,
} as const;

export const Radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 18,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    cssValue: '0 1px 3px oklch(0 0 0 / 0.06)',
    shadowColor: oklchToRgba('oklch(0% 0 0 / 0.06)'),
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    cssValue: '0 4px 12px oklch(0 0 0 / 0.08)',
    shadowColor: oklchToRgba('oklch(0% 0 0 / 0.08)'),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    cssValue: '0 8px 24px oklch(0 0 0 / 0.12)',
    shadowColor: oklchToRgba('oklch(0% 0 0 / 0.12)'),
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const ZIndex = {
  base: 1,
  dropdown: 50,
  tabBar: 100,
  toast: 200,
  modal: 300,
} as const;

export const Animation = {
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
  },
  easing: {
    default: 'ease-in-out',
    enter: 'ease-out',
    exit: 'ease-in',
  },
  resolveDuration(duration: number, prefersReducedMotion: boolean) {
    return prefersReducedMotion ? 0 : duration;
  },
} as const;

export const accessibilityDefaults = {
  minimumTouchTarget: 44,
  focusOutlineWidth: 2,
  focusOutlineOffset: 2,
  focusOutlineColor: Colors.accent,
  prefersReducedMotionDuration: 0,
} as const;

type ParsedOklch = {
  alpha: number;
  chroma: number;
  hue: number;
  lightness: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function gammaCorrect(channel: number) {
  if (channel <= 0.0031308) {
    return 12.92 * channel;
  }

  return 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
}

function parsePercentOrNumber(value: string) {
  const trimmed = value.trim();
  if (trimmed.endsWith('%')) {
    return Number.parseFloat(trimmed.slice(0, -1)) / 100;
  }

  return Number.parseFloat(trimmed);
}

function parseOklch(input: string): ParsedOklch {
  const match = input
    .trim()
    .match(/^oklch\(\s*([^)\/\s]+)\s+([^)\/\s]+)\s+([^)\/\s]+)(?:\s*\/\s*([^)]+))?\s*\)$/i);

  if (!match) {
    throw new Error(`Invalid OKLCH color: ${input}`);
  }

  return {
    lightness: parsePercentOrNumber(match[1]),
    chroma: Number.parseFloat(match[2]),
    hue: Number.parseFloat(match[3]),
    alpha: match[4] ? parsePercentOrNumber(match[4]) : 1,
  };
}

export function oklchToRgba(input: string) {
  const { alpha, chroma, hue, lightness } = parseOklch(input);
  const hueRadians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(hueRadians);
  const b = chroma * Math.sin(hueRadians);

  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b;

  const l = lPrime ** 3;
  const m = mPrime ** 3;
  const s = sPrime ** 3;

  const linearRed = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const linearGreen = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const linearBlue = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const red = Math.round(clamp(gammaCorrect(clamp(linearRed, 0, 1)), 0, 1) * 255);
  const green = Math.round(clamp(gammaCorrect(clamp(linearGreen, 0, 1)), 0, 1) * 255);
  const blue = Math.round(clamp(gammaCorrect(clamp(linearBlue, 0, 1)), 0, 1) * 255);
  const resolvedAlpha = clamp(alpha, 0, 1);

  return `rgba(${red}, ${green}, ${blue}, ${Number(resolvedAlpha.toFixed(3))})`;
}

export const tokens = {
  colors: Colors,
  typography: Typography,
  typographyFamilies: TypographyFamilies,
  spacing: Spacing,
  radius: Radius,
  shadows: Shadows,
  zIndex: ZIndex,
  animation: Animation,
  accessibility: accessibilityDefaults,
} as const;
