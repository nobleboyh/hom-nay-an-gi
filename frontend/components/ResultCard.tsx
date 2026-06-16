import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { ChipRow, type ChipRowItem, type ChipRowMode } from './ChipRow';
import { useReducedMotion } from '../lib/accessibility';
import { Colors, Radius, Spacing, Typography, oklchToRgba } from '../lib/tokens';

export type ResultCardDish = {
  dishId: string;
  name: string;
  matchPercentage: number;
  cuisineTags: ChipRowItem[];
  cookTimeMinutes: number;
  caloriesPerServing: number;
};

export type ResultCardAction =
  | { key: 'viewRecipe'; label: string; onPress: () => void; accessibilityLabel?: string }
  | { key: 'shopping'; label: string; onPress: () => void; accessibilityLabel?: string }
  | { key: 'save'; label: string; onPress: () => void; isSaved?: boolean; accessibilityLabel?: string };

export type ResultCardProps = {
  actions: ResultCardAction[];
  cuisineTags: ChipRowItem[];
  cuisineTagMode?: ChipRowMode;
  dish: ResultCardDish;
  expanded: boolean;
  onToggle: () => void;
};

export function ResultCard({
  actions,
  cuisineTags,
  cuisineTagMode = 'multiSelect',
  dish,
  expanded,
  onToggle,
}: ResultCardProps) {
  const prefersReducedMotion = useReducedMotion();

  function handleToggle() {
    if (!prefersReducedMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    onToggle();
  }

  return (
    <Card padding={0} style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={handleToggle}
        style={({ pressed }) => [
          styles.header,
          expanded ? styles.headerExpanded : null,
          { opacity: pressed ? 0.88 : 1 },
        ]}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{dish.name}</Text>
          <Text style={styles.meta}>
            {dish.cookTimeMinutes} phút • {dish.caloriesPerServing} cal
          </Text>
        </View>
        <Badge tone="accent" value={`${dish.matchPercentage}%`} />
      </Pressable>
      {expanded ? (
        <View style={styles.body}>
          <View
            accessibilityLabel={`${dish.name} photo placeholder`}
            style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>
              📸
            </Text>
          </View>
          <ChipRow
            items={cuisineTags}
            mode={cuisineTagMode}
            onSelectionChange={() => {}}
            selectedIds={cuisineTags.map((t) => t.id)}
            variant="cuisine"
          />
          <View style={styles.actions}>
            {actions.map((action) => (
              <Button
                key={action.key}
                accessibilityLabel={action.accessibilityLabel}
                onPress={action.onPress}
                variant={action.key === 'viewRecipe' ? 'primary' : 'secondary'}>
                {action.label}
              </Button>
            ))}
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  header: {
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
    gap: Spacing.xs,
  },
  headerExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: oklchToRgba(Colors.border),
  },
  name: {
    fontFamily: Typography.cardTitle.family,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
    color: oklchToRgba(Colors.fg),
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
  meta: {
    fontFamily: Typography.meta.family,
    fontSize: Typography.meta.fontSize,
    fontWeight: Typography.meta.fontWeight,
    lineHeight: Typography.meta.lineHeight,
    color: oklchToRgba(Colors.muted),
  },
  body: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  imagePlaceholder: {
    aspectRatio: 16 / 9,
    backgroundColor: oklchToRgba(Colors.border),
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 32,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
});
