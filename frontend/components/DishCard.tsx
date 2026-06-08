import { useState, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Card } from './Card';
import { useReducedMotion } from '../lib/accessibility';
import { Colors, Spacing, Typography, oklchToRgba } from '../lib/tokens';

export type DishCardProps = {
  accessibilityLabel: string;
  dishName: string;
  imageSource?: ReactNode;
  onPress: () => void;
  price?: string;
  rating?: string;
  restaurantName?: string;
  style?: StyleProp<ViewStyle>;
};

export function DishCard({
  accessibilityLabel,
  dishName,
  imageSource,
  onPress,
  price,
  rating,
  restaurantName,
  style,
}: DishCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.pressable,
        !prefersReducedMotion && isPressed ? styles.pressed : null,
        style,
      ]}>
      <Card padding={0} style={styles.card}>
        <View style={styles.imageArea}>
          {imageSource ?? (
            <View accessibilityLabel={`${dishName} photo placeholder`} style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>📸</Text>
            </View>
          )}
        </View>
        <View style={styles.body}>
          <Text style={styles.name}>{dishName}</Text>
          {restaurantName ? (
            <Text style={styles.restaurant}>{restaurantName}</Text>
          ) : null}
          {(rating || price) ? (
            <View style={styles.metaRow}>
              {rating ? (
                <Text style={styles.metaText}>{rating}</Text>
              ) : null}
              {price ? (
                <Text style={styles.metaText}>{price}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  pressed: {
    transform: [{ translateY: -2 }],
  },
  card: {
    overflow: 'hidden',
    gap: 0,
  },
  imageArea: {
    aspectRatio: 4 / 3,
    backgroundColor: oklchToRgba(Colors.border),
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 28,
  },
  body: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  name: {
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    fontWeight: '600',
    lineHeight: Typography.cardSubtitle.lineHeight,
    color: oklchToRgba(Colors.fg),
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
  restaurant: {
    fontFamily: Typography.meta.family,
    fontSize: Typography.meta.fontSize,
    fontWeight: Typography.meta.fontWeight,
    lineHeight: Typography.meta.lineHeight,
    color: oklchToRgba(Colors.muted),
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  metaText: {
    fontFamily: Typography.meta.family,
    fontSize: Typography.meta.fontSize,
    fontWeight: Typography.meta.fontWeight,
    lineHeight: Typography.meta.lineHeight,
    color: oklchToRgba(Colors.muted),
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
});
