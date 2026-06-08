import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { getFocusOutline } from '../lib/accessibility';
import { Colors, Radius, Spacing, Typography, oklchToRgba } from '../lib/tokens';

export type ServingAdjusterProps = {
  max: number;
  min: number;
  onChange: (value: number) => void;
  style?: StyleProp<ViewStyle>;
  value: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ServingAdjuster({ max, min, onChange, style, value }: ServingAdjusterProps) {
  const [minusFocused, setMinusFocused] = useState(false);
  const [plusFocused, setPlusFocused] = useState(false);
  const previousValue = clamp(value, min, max);

  const updateValue = (nextValue: number) => {
    const resolved = clamp(nextValue, min, max);
    if (resolved !== previousValue) {
      onChange(resolved);
    }
  };

  return (
    <View accessibilityRole="adjustable" accessibilityValue={{ min, max, now: previousValue }} style={[styles.container, style]}>
      <Pressable
        accessibilityLabel="Decrease servings"
        accessibilityRole="button"
        disabled={previousValue <= min}
        hitSlop={8}
        onBlur={() => setMinusFocused(false)}
        onFocus={() => setMinusFocused(true)}
        onPress={() => updateValue(previousValue - 1)}
        style={({ pressed }) => [
          styles.control,
          previousValue <= min ? styles.controlDisabled : null,
          pressed ? styles.controlPressed : null,
          minusFocused ? getFocusOutline() : null,
        ]}>
        <Text style={styles.symbol}>−</Text>
      </Pressable>

      <View style={styles.valuePill}>
        <Text style={styles.value}>{previousValue}</Text>
      </View>

      <Pressable
        accessibilityLabel="Increase servings"
        accessibilityRole="button"
        disabled={previousValue >= max}
        hitSlop={8}
        onBlur={() => setPlusFocused(false)}
        onFocus={() => setPlusFocused(true)}
        onPress={() => updateValue(previousValue + 1)}
        style={({ pressed }) => [
          styles.control,
          previousValue >= max ? styles.controlDisabled : null,
          pressed ? styles.controlPressed : null,
          plusFocused ? getFocusOutline() : null,
        ]}>
        <Text style={styles.symbol}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  control: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: oklchToRgba(Colors.border),
    backgroundColor: oklchToRgba(Colors.surface),
  },
  controlDisabled: {
    opacity: 0.45,
  },
  controlPressed: {
    opacity: 0.88,
  },
  symbol: {
    color: oklchToRgba(Colors.fg),
    fontFamily: Typography.button.family,
    fontSize: 20,
    lineHeight: 20,
    fontWeight: Typography.button.fontWeight,
  },
  valuePill: {
    minWidth: 56,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    backgroundColor: oklchToRgba(Colors.accentDim),
  },
  value: {
    color: oklchToRgba(Colors.accentStrong),
    fontFamily: Typography.cardTitle.family,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
  },
});
