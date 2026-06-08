import { type ReactNode } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';

import { Chip, type ChipVariant } from './Chip';
import { Spacing } from '../lib/tokens';

export type ChipRowItem = {
  id: string;
  label: string;
};

export type ChipRowMode = 'multiSelect' | 'singleSelect';

export type ChipRowProps = ViewProps & {
  items: ChipRowItem[];
  mode?: ChipRowMode;
  onSelectionChange: (selectedIds: string[]) => void;
  selectedIds?: string[];
  variant?: ChipVariant;
  iconRight?: ReactNode;
};

export function ChipRow({
  iconRight,
  items,
  mode = 'multiSelect',
  onSelectionChange,
  selectedIds = [],
  style,
  variant,
  ...props
}: ChipRowProps) {
  function handleToggle(id: string) {
    if (mode === 'singleSelect') {
      if (selectedIds.includes(id)) {
        onSelectionChange([]);
      } else {
        onSelectionChange([id]);
      }

      return;
    }

    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  }

  return (
    <View {...props} style={[styles.wrapper, style]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        horizontal
        showsHorizontalScrollIndicator={false}>
        {items.map((item) => (
          <Chip
            iconRight={iconRight}
            key={item.id}
            label={item.label}
            onPress={() => handleToggle(item.id)}
            selected={selectedIds.includes(item.id)}
            variant={variant}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 44,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
});
