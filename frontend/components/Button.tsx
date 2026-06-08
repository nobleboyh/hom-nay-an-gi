import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { getFocusOutline } from '../lib/accessibility';
import {
  Colors,
  Radius,
  Spacing,
  Typography,
  oklchToRgba,
} from '../lib/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  children: string;
  fullWidth?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: ButtonVariant;
};

const variantStyles: Record<
  ButtonVariant,
  { backgroundColor: string; borderColor: string; textColor: string }
> = {
  primary: {
    backgroundColor: oklchToRgba(Colors.accentStrong),
    borderColor: oklchToRgba(Colors.accentStrong),
    textColor: oklchToRgba(Colors.surface),
  },
  secondary: {
    backgroundColor: oklchToRgba(Colors.surface),
    borderColor: oklchToRgba(Colors.border),
    textColor: oklchToRgba(Colors.fg),
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    textColor: oklchToRgba(Colors.muted),
  },
  destructive: {
    backgroundColor: oklchToRgba(Colors.danger),
    borderColor: oklchToRgba(Colors.danger),
    textColor: oklchToRgba(Colors.surface),
  },
};

export function Button({
  children,
  disabled,
  fullWidth,
  loading = false,
  style,
  textStyle,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const [isFocused, setIsFocused] = useState(false);
  const palette = variantStyles[variant];
  const isInteractiveDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInteractiveDisabled, busy: loading }}
      disabled={isInteractiveDisabled}
      focusable={!isInteractiveDisabled}
      onBlur={(event) => {
        setIsFocused(false);
        props.onBlur?.(event);
      }}
      onFocus={(event) => {
        setIsFocused(true);
        props.onFocus?.(event);
      }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: isInteractiveDisabled ? 0.55 : pressed ? 0.92 : 1,
        },
        isFocused && getFocusOutline(),
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={palette.textColor}
          size="small"
          style={styles.activityIndicator}
        />
      ) : null}
      <Text
        style={[
          styles.text,
          { color: palette.textColor },
          Platform.OS === 'web' ? styles.webText : null,
          textStyle,
        ]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: Spacing.xs,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontFamily: Typography.button.family,
    fontSize: Typography.button.fontSize,
    fontWeight: Typography.button.fontWeight,
    lineHeight: Typography.button.lineHeight,
  },
  webText: {
    userSelect: 'none',
  },
  activityIndicator: {
    marginRight: 2,
  },
});
