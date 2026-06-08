import { useState, type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { getFocusOutline } from '../lib/accessibility';
import { Colors, Radius, Spacing, Typography, oklchToRgba } from '../lib/tokens';

export type InputFieldProps = Omit<TextInputProps, 'style'> & {
  error?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  inputStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};

export function InputField({
  error,
  iconLeft,
  iconRight,
  inputStyle,
  onBlur,
  onFocus,
  style,
  ...props
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const invalidAccessibilityProps = error ? ({ 'aria-invalid': true } as any) : undefined;

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.field,
          {
            borderColor: error
              ? oklchToRgba(Colors.danger)
              : isFocused
                ? oklchToRgba(Colors.accent)
                : oklchToRgba(Colors.border),
          },
          isFocused && getFocusOutline(),
        ]}>
        {iconLeft ? <View style={styles.icon}>{iconLeft}</View> : null}
        <TextInput
          {...props}
          {...invalidAccessibilityProps}
          accessibilityState={{ disabled: props.editable === false }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={oklchToRgba(Colors.muted)}
          style={[
            styles.input,
            iconLeft ? styles.inputWithLeftIcon : null,
            iconRight ? styles.inputWithRightIcon : null,
            inputStyle,
          ]}
        />
        {iconRight ? <View style={styles.icon}>{iconRight}</View> : null}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  field: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    backgroundColor: oklchToRgba(Colors.surface),
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  icon: {
    minWidth: 24,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: oklchToRgba(Colors.fg),
    fontFamily: Typography.cardSubtitle.family,
    fontSize: 16,
    lineHeight: 22,
    padding: 0,
  },
  inputWithLeftIcon: {
    marginLeft: Spacing.xs,
  },
  inputWithRightIcon: {
    marginRight: Spacing.xs,
  },
  errorText: {
    color: oklchToRgba(Colors.danger),
    fontFamily: Typography.meta.family,
    fontSize: Typography.meta.fontSize,
    fontWeight: Typography.meta.fontWeight,
    lineHeight: Typography.meta.lineHeight,
  },
});
