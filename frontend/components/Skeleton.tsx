import { useEffect, useMemo } from 'react';
import {
  Animated,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useReducedMotion } from '../lib/accessibility';
import { Colors, Radius, oklchToRgba } from '../lib/tokens';

export type SkeletonVariant = 'card' | 'text' | 'circle';

export type SkeletonProps = {
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  variant?: SkeletonVariant;
};

export function Skeleton({
  accessibilityLabel = 'Đang tải...',
  style,
  variant = 'text',
}: SkeletonProps) {
  const prefersReducedMotion = useReducedMotion();
  const opacity = useMemo(() => new Animated.Value(0.35), []);

  useEffect(() => {
    if (prefersReducedMotion) {
      opacity.setValue(0.35);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          duration: 900,
          toValue: 0.72,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          duration: 900,
          toValue: 0.35,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [prefersReducedMotion, opacity]);

  function variantStyle(): StyleProp<ViewStyle> {
    switch (variant) {
      case 'card':
        return styles.card;
      case 'circle':
        return styles.circle;
      default:
        return styles.text;
    }
  }

  return (
    <Animated.View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      style={[styles.base, variantStyle(), { opacity }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: oklchToRgba(Colors.border),
  },
  card: {
    height: 200,
    borderRadius: Radius.md,
    width: '100%',
  },
  text: {
    height: 12,
    borderRadius: Radius.sm,
    width: '100%',
  },
  circle: {
    height: 44,
    width: 44,
    borderRadius: 22,
  },
});
