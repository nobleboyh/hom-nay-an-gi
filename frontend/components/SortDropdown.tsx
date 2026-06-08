import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { getFocusOutline } from '../lib/accessibility';
import { Colors, Radius, Spacing, Typography, oklchToRgba } from '../lib/tokens';

export type SortKey = 'best_match' | 'lowest_cal' | 'fastest' | 'dish_type';

export type SortOption = {
  key: SortKey;
  label: string;
};

const defaultOptions: SortOption[] = [
  { key: 'best_match', label: 'Phù hợp nhất' },
  { key: 'lowest_cal', label: 'Ít calo nhất' },
  { key: 'fastest', label: 'Nấu nhanh nhất' },
  { key: 'dish_type', label: 'Loại món' },
];

export type SortDropdownProps = {
  onChange: (sortKey: SortKey) => void;
  options?: SortOption[];
  style?: StyleProp<ViewStyle>;
  value?: SortKey;
};

export function SortDropdown({
  onChange,
  options = defaultOptions,
  style,
  value = 'best_match',
}: SortDropdownProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find((o) => o.key === value)?.label ?? options[0]?.label ?? '';

  function handleSelect(key: SortKey) {
    onChange(key);
    setIsOpen(false);
  }

  return (
    <View style={[styles.container, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onBlur={() => setIsFocused(false)}
        onFocus={() => setIsFocused(true)}
        onPress={() => setIsOpen(!isOpen)}
        style={({ pressed }) => [
          styles.trigger,
          isFocused && getFocusOutline(),
          { opacity: pressed ? 0.88 : 1 },
        ]}>
        <Text style={styles.triggerText}>{selectedLabel}</Text>
        <Text style={styles.chevron}>{isOpen ? '▼' : '▶'}</Text>
      </Pressable>

      {isOpen ? (
        <Modal
          animationType="none"
          onRequestClose={() => setIsOpen(false)}
          transparent
          visible={isOpen}>
          <Pressable
            onPress={() => setIsOpen(false)}
            style={styles.backdrop}>
            <View style={styles.menuContainer}>
              <View style={styles.menu}>
                {options.map((option) => (
                  <Pressable
                    accessibilityRole="menuitem"
                    key={option.key}
                    onPress={() => handleSelect(option.key)}
                    style={({ pressed }) => [
                      styles.option,
                      option.key === value ? styles.optionSelected : null,
                      { backgroundColor: pressed ? oklchToRgba(Colors.accentDim) : undefined },
                    ]}>
                    <Text
                      style={[
                        styles.optionText,
                        option.key === value ? styles.optionTextSelected : null,
                      ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  trigger: {
    backgroundColor: oklchToRgba(Colors.surface),
    borderColor: oklchToRgba(Colors.border),
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm2,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    gap: Spacing.sm,
  },
  triggerText: {
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    fontWeight: Typography.cardSubtitle.fontWeight,
    color: oklchToRgba(Colors.fg),
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
  chevron: {
    fontSize: 10,
    color: oklchToRgba(Colors.muted),
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'web' ? 80 : 120,
    paddingHorizontal: Spacing.md,
  },
  menuContainer: {
    maxWidth: Spacing.screenMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  menu: {
    backgroundColor: oklchToRgba(Colors.surface),
    borderColor: oklchToRgba(Colors.border),
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor: oklchToRgba(Colors.accentDim),
  },
  optionText: {
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    fontWeight: Typography.cardSubtitle.fontWeight,
    color: oklchToRgba(Colors.fg),
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
  optionTextSelected: {
    color: oklchToRgba(Colors.accentStrong),
  },
});
