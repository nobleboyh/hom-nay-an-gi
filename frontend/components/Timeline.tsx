import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Radius, Spacing, Typography, oklchToRgba } from '../lib/tokens';

export type TimelineStep = {
  duration: string;
  label: string;
};

export type TimelineProps = {
  steps: TimelineStep[];
  style?: StyleProp<ViewStyle>;
};

export function Timeline({ steps }: TimelineProps) {
  return (
    <View accessibilityRole="list" style={styles.list}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <View
            key={`${step.label}-${index}`}
            role="listitem"
            accessibilityLabel={`${step.label}, ${step.duration}`}
            style={styles.row}>
            <View style={styles.markerColumn}>
              <View style={styles.dot} />
              {!isLast ? <View style={styles.bar} /> : null}
            </View>
            <View style={styles.content}>
              <Text style={styles.label}>{step.label}</Text>
              <Text style={styles.duration}>{step.duration}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  markerColumn: {
    alignItems: 'center',
    width: 24,
  },
  dot: {
    width: 15,
    height: 15,
    borderRadius: Radius.full,
    backgroundColor: oklchToRgba(Colors.accent),
    borderWidth: 3,
    borderColor: oklchToRgba(Colors.surface),
  },
  bar: {
    flex: 1,
    width: 3,
    minHeight: 18,
    backgroundColor: oklchToRgba(Colors.border),
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingBottom: Spacing.xs,
  },
  label: {
    color: oklchToRgba(Colors.fg),
    fontFamily: Typography.cardTitle.family,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
  duration: {
    color: oklchToRgba(Colors.muted),
    fontFamily: Typography.meta.family,
    fontSize: Typography.meta.fontSize,
    fontWeight: Typography.meta.fontWeight,
    lineHeight: Typography.meta.lineHeight,
  },
});
