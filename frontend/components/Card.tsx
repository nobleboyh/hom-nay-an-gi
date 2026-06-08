import { type ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { Radius, Shadows, Spacing, oklchToRgba, Colors } from '../lib/tokens';

export type CardProps = ViewProps & {
  accessibilityRole?: ViewProps['accessibilityRole'];
  children: ReactNode;
  padding?: number;
  style?: StyleProp<ViewStyle>;
};

export function Card({
  accessibilityRole = 'summary',
  children,
  padding = 16,
  style,
  ...props
}: CardProps) {
  return (
    <View
      {...props}
      accessibilityRole={accessibilityRole}
      style={[
        styles.card,
        {
          padding,
          backgroundColor: oklchToRgba(Colors.surface),
          borderColor: oklchToRgba(Colors.border),
          shadowColor: Shadows.sm.shadowColor,
          shadowOffset: Shadows.sm.shadowOffset,
          shadowOpacity: Shadows.sm.shadowOpacity,
          shadowRadius: Shadows.sm.shadowRadius,
          elevation: Shadows.sm.elevation,
        },
        Platform.OS === 'web' ? styles.webCard : null,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  webCard: {
    boxSizing: 'border-box',
  },
});
