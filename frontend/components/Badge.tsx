import { type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Radius, Typography, oklchToRgba } from '../lib/tokens';

export type BadgeTone = 'accent' | 'success' | 'warn' | 'danger';

export type BadgeProps = {
  style?: StyleProp<ViewStyle>;
  tone?: BadgeTone;
  value: ReactNode;
};

const toneStyles: Record<BadgeTone, { backgroundColor: string; textColor: string }> = {
  accent: {
    backgroundColor: oklchToRgba(Colors.accentDim),
    textColor: oklchToRgba(Colors.accentStrong),
  },
  success: {
    backgroundColor: 'rgba(86, 148, 92, 0.12)',
    textColor: oklchToRgba(Colors.success),
  },
  warn: {
    backgroundColor: 'rgba(169, 123, 0, 0.12)',
    textColor: oklchToRgba(Colors.warn),
  },
  danger: {
    backgroundColor: 'rgba(175, 70, 31, 0.12)',
    textColor: oklchToRgba(Colors.danger),
  },
};

export function Badge({ style, tone = 'accent', value }: BadgeProps) {
  const palette = toneStyles[tone];

  return (
    <View accessibilityRole="text" style={[styles.badge, { backgroundColor: palette.backgroundColor }, style]}>
      <Text style={[styles.text, { color: palette.textColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  text: {
    fontFamily: Typography.badge.family,
    fontSize: Typography.badge.fontSize,
    fontWeight: Typography.badge.fontWeight,
    lineHeight: Typography.badge.lineHeight,
  },
});
