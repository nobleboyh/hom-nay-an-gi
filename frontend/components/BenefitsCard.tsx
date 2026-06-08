import {
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Card } from './Card';
import { Colors, Spacing, Typography, oklchToRgba } from '../lib/tokens';

export type BenefitsCardItem = {
  icon: string;
  text: string;
};

export type BenefitsCardProps = {
  benefits: BenefitsCardItem[];
  style?: StyleProp<ViewStyle>;
  title?: string;
};

export function BenefitsCard({ benefits, style, title = 'Lợi ích khi đăng nhập' }: BenefitsCardProps) {
  return (
    <Card
      accessibilityRole="header"
      style={[
        styles.card,
        {
          backgroundColor: oklchToRgba(Colors.accentDim),
          borderColor: oklchToRgba(Colors.accent),
        },
        style,
      ]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {benefits.map((benefit) => (
        <View key={benefit.text} style={styles.row}>
          <Text style={styles.icon}>{benefit.icon}</Text>
          <Text style={styles.text}>{benefit.text}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  title: {
    fontFamily: Typography.cardTitle.family,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
    color: oklchToRgba(Colors.accentStrong),
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
  text: {
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    fontWeight: '500',
    lineHeight: Typography.cardSubtitle.lineHeight,
    color: oklchToRgba(Colors.fg),
    flex: 1,
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
});
