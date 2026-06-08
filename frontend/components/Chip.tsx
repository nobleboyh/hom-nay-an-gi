import { useState, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { getFocusOutline } from '../lib/accessibility';
import { Colors, Radius, Spacing, Typography, oklchToRgba } from '../lib/tokens';

export type ChipVariant = 'tag' | 'cuisine' | 'time' | 'ingredient';

export type ChipProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  onRemove?: () => void;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: ChipVariant;
  iconRight?: ReactNode;
};

function getChipPalette(variant: ChipVariant, selected: boolean) {
  if (variant === 'ingredient') {
    return {
      backgroundColor: oklchToRgba(Colors.accentDim),
      borderColor: oklchToRgba(Colors.accent),
      textColor: oklchToRgba(Colors.accentStrong),
    };
  }

  if (selected) {
    return {
      backgroundColor: oklchToRgba(Colors.accentDim),
      borderColor: oklchToRgba(Colors.accent),
      textColor: oklchToRgba(Colors.accentStrong),
    };
  }

  return {
    backgroundColor: oklchToRgba(Colors.surface),
    borderColor: oklchToRgba(Colors.border),
    textColor: oklchToRgba(Colors.fg),
  };
}

export function Chip({
  disabled,
  iconRight,
  label,
  onPress,
  onRemove,
  selected = false,
  style,
  variant = 'tag',
  ...props
}: ChipProps) {
  const [isFocused, setIsFocused] = useState(false);
  const palette = getChipPalette(variant, selected);
  const removable = variant === 'ingredient' && Boolean(onRemove);
  const isInteractiveDisabled = Boolean(disabled);

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInteractiveDisabled, selected }}
      disabled={isInteractiveDisabled}
      focusable={!isInteractiveDisabled}
      hitSlop={8}
      onBlur={(event) => {
        setIsFocused(false);
        props.onBlur?.(event);
      }}
      onFocus={(event) => {
        setIsFocused(true);
        props.onFocus?.(event);
      }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: isInteractiveDisabled ? 0.55 : pressed ? 0.9 : 1,
        },
        isFocused && getFocusOutline(),
        style,
      ]}>
      <Text
        style={[
          styles.label,
          { color: palette.textColor },
          Platform.OS === 'web' ? styles.webLabel : null,
        ]}>
        {label}
      </Text>
      {iconRight ? <View style={styles.trailing}>{iconRight}</View> : null}
      {removable ? (
        <Pressable
          accessibilityLabel={`Remove ${label}`}
          accessibilityRole="button"
          hitSlop={10}
          onPress={onRemove}
          style={({ pressed }) => [
            styles.removeButton,
            { opacity: pressed ? 0.72 : 1 },
          ]}>
          <Text style={[styles.removeLabel, { color: palette.textColor }]}>×</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: Spacing.xs,
  },
  label: {
    fontFamily: Typography.chipLabel.family,
    fontSize: Typography.chipLabel.fontSize,
    fontWeight: Typography.chipLabel.fontWeight,
    lineHeight: Typography.chipLabel.lineHeight,
  },
  webLabel: {
    userSelect: 'none',
  },
  trailing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4,
    marginRight: -8,
  },
  removeLabel: {
    fontFamily: Typography.button.family,
    fontSize: 18,
    lineHeight: 18,
    fontWeight: Typography.button.fontWeight,
  },
});
