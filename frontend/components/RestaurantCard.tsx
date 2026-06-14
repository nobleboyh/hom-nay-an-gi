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
  restaurantName?: string;
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
  restaurantName,
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
          <Text style={styles.metaText}>
            {restaurantName}{restaurantName && distanceMeters != null ? ' • ' : ''}{distanceMeters != null ? formatDistance(distanceMeters) : ''}
          </Text>
          <Text style={styles.metaText}>
            {rating != null ? `⭐ ${rating}` : ''}{rating != null && price ? ' • ' : ''}{price ?? ''}
          </Text>
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
    fontWeight: '600',
    lineHeight: Typography.cardTitle.lineHeight,
    color: oklchToRgba(Colors.fg),
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
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
