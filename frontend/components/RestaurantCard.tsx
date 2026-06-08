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
import { Colors, Radius, Spacing, Typography, oklchToRgba } from '../lib/tokens';
import { formatDistance } from '../lib/formatTime';

export type RestaurantCardProps = {
  accessibilityLabel: string;
  distanceMeters: number;
  name: string;
  onPress: () => void;
  price?: string;
  rating?: string;
  style?: StyleProp<ViewStyle>;
  thumbnail?: string;
};

export function RestaurantCard({
  accessibilityLabel,
  distanceMeters,
  name,
  onPress,
  price,
  rating,
  style,
}: RestaurantCardProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        { opacity: pressed ? 0.88 : 1 },
        style,
      ]}>
      <Card padding={Spacing.md} style={styles.card}>
        <View
          accessibilityLabel={`${name} thumbnail placeholder`}
          style={styles.thumbnail}>
          <Text style={styles.thumbnailText}>📸</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{formatDistance(distanceMeters)}</Text>
            {rating ? <Text style={styles.metaText}>{rating}</Text> : null}
            {price ? <Text style={styles.metaText}>{price}</Text> : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: Radius.sm,
    backgroundColor: oklchToRgba(Colors.border),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  thumbnailText: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    gap: Spacing.xs,
  },
  name: {
    fontFamily: Typography.cardTitle.family,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
    color: oklchToRgba(Colors.fg),
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    flexWrap: 'wrap',
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
