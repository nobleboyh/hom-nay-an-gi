import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useReducedMotion } from '../lib/accessibility';
import { Colors, Radius, Spacing, Typography, ZIndex, oklchToRgba } from '../lib/tokens';

export type ToastProps = {
  durationMs?: number;
  message: string;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
  tone?: 'neutral' | 'success' | 'warn' | 'danger';
  visible: boolean;
};

const toneStyles = {
  neutral: {
    backgroundColor: oklchToRgba(Colors.fg),
    textColor: oklchToRgba(Colors.surface),
  },
  success: {
    backgroundColor: oklchToRgba(Colors.success),
    textColor: oklchToRgba(Colors.surface),
  },
  warn: {
    backgroundColor: oklchToRgba(Colors.warn),
    textColor: oklchToRgba(Colors.fg),
  },
  danger: {
    backgroundColor: oklchToRgba(Colors.danger),
    textColor: oklchToRgba(Colors.surface),
  },
} as const;

export function Toast({
  durationMs = 4000,
  message,
  onDismiss,
  style,
  tone = 'neutral',
  visible,
}: ToastProps) {
  const prefersReducedMotion = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(0));
  const [rendered, setRendered] = useState(visible);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (visible && !rendered) {
      const openTimer = setTimeout(() => setRendered(true), 0);

      return () => {
        clearTimeout(openTimer);
      };
    }

    if (visible) {
      Animated.timing(opacity, {
        duration: prefersReducedMotion ? 0 : 160,
        toValue: 1,
        useNativeDriver: true,
      }).start();

      timerRef.current = setTimeout(() => {
        if (onDismiss) {
          onDismiss();
          return;
        }

        Animated.timing(opacity, {
          duration: prefersReducedMotion ? 0 : 160,
          toValue: 0,
          useNativeDriver: true,
        }).start(() => setRendered(false));
      }, Math.max(4000, durationMs));

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }

    if (rendered) {
      Animated.timing(opacity, {
        duration: prefersReducedMotion ? 0 : 120,
        toValue: 0,
        useNativeDriver: true,
      }).start(() => setRendered(false));
    } else {
      opacity.setValue(0);
    }

    return undefined;
  }, [durationMs, onDismiss, opacity, prefersReducedMotion, rendered, visible]);

  if (!rendered) {
    return null;
  }

  const palette = toneStyles[tone];

  return (
    <View pointerEvents="box-none" style={styles.portal}>
      <Animated.View
        accessibilityLiveRegion="polite"
        role="status"
        style={[
          styles.toast,
          { backgroundColor: palette.backgroundColor, opacity },
          style,
        ]}>
        <View style={styles.content}>
          <Text style={[styles.message, { color: palette.textColor }]}>{message}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  portal: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: 100,
    zIndex: ZIndex.toast,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 430,
    borderRadius: Radius.md,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontFamily: Typography.button.family,
    fontSize: Typography.button.fontSize,
    fontWeight: Typography.button.fontWeight,
    lineHeight: Typography.button.lineHeight,
    textAlign: 'center',
  },
});
