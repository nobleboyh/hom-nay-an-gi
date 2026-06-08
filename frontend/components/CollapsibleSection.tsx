import { useState, type ReactNode } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useReducedMotion } from '../lib/accessibility';
import { Colors, Spacing, Typography, oklchToRgba } from '../lib/tokens';

export type CollapsibleSectionProps = {
  children: ReactNode;
  defaultExpanded?: boolean;
  style?: StyleProp<ViewStyle>;
  title: string;
};

export function CollapsibleSection({
  children,
  defaultExpanded = false,
  style,
  title,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const prefersReducedMotion = useReducedMotion();

  function handleToggle() {
    if (!prefersReducedMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpanded((prev) => !prev);
  }

  return (
    <View style={[styles.container, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={handleToggle}
        style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.chevron}>{expanded ? '▼' : '▶'}</Text>
      </Pressable>
      {expanded ? (
        <View style={styles.body}>{children}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    gap: Spacing.sm,
  },
  title: {
    fontFamily: Typography.sectionTitle.family,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    lineHeight: Typography.sectionTitle.lineHeight,
    color: oklchToRgba(Colors.fg),
    flex: 1,
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
  chevron: {
    fontSize: 10,
    color: oklchToRgba(Colors.muted),
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
  body: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
});
