import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Radius, Spacing, Typography, oklchToRgba } from '../lib/tokens';

export type TimelineStep = {
  duration: string;
  label: string;
  parallelGroup?: string;
};

export type TimelineProps = {
  steps: TimelineStep[];
  style?: StyleProp<ViewStyle>;
};

function groupSteps(steps: TimelineStep[]): TimelineStep[][] {
  const groups: TimelineStep[][] = [];
  let currentGroup: TimelineStep[] = [];
  let currentGroupId: string | undefined;

  for (const step of steps) {
    if (step.parallelGroup && step.parallelGroup === currentGroupId) {
      currentGroup.push(step);
    } else {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [step];
      currentGroupId = step.parallelGroup;
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  return groups;
}

export function Timeline({ steps }: TimelineProps) {
  const grouped = groupSteps(steps);

  return (
    <View accessibilityRole="list" style={styles.list}>
      {grouped.map((group, groupIndex) => {
        const isLast = groupIndex === grouped.length - 1;

        return (
          <View
            key={`group-${groupIndex}`}
            role="listitem"
            accessibilityLabel={group.map((s) => `${s.label}, ${s.duration}`).join('; ')}
            style={styles.row}>
            <View style={styles.markerColumn}>
              <View style={styles.dot} />
              {!isLast ? <View style={styles.bar} /> : null}
            </View>
            <View style={styles.content}>
              {group.map((step, stepIndex) => (
                <View key={`step-${stepIndex}`} style={stepIndex > 0 ? styles.parallelStep : undefined}>
                  <Text style={styles.label}>{step.label}</Text>
                  <Text style={styles.duration}>{step.duration}</Text>
                </View>
              ))}
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
  parallelStep: {
    marginTop: Spacing.sm,
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
