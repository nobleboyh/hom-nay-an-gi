import {
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Button } from './Button';
import { Colors, Spacing, Typography, oklchToRgba } from '../lib/tokens';

export type EmptyStateProps = {
  ctaLabel?: string;
  description: string;
  icon: string;
  onCtaPress?: () => void;
  style?: StyleProp<ViewStyle>;
  title: string;
};

export function EmptyState({
  ctaLabel,
  description,
  icon,
  onCtaPress,
  style,
  title,
}: EmptyStateProps) {
  return (
    <View
      accessibilityRole="alert"
      style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.iconText}
          {...(Platform.OS === 'web' ? { 'aria-hidden': true } : {})}>
          {icon}
        </Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {ctaLabel && onCtaPress ? (
        <Button onPress={onCtaPress} variant="primary">
          {ctaLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: oklchToRgba(Colors.border),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontFamily: Typography.sectionTitle.family,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    lineHeight: Typography.sectionTitle.lineHeight,
    color: oklchToRgba(Colors.fg),
    textAlign: 'center',
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
  description: {
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    fontWeight: Typography.cardSubtitle.fontWeight,
    lineHeight: Typography.cardSubtitle.lineHeight,
    color: oklchToRgba(Colors.muted),
    textAlign: 'center',
    maxWidth: 280,
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
});
