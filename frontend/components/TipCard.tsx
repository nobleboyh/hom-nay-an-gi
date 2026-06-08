import { type ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Card } from './Card';
import { Colors, Typography, oklchToRgba } from '../lib/tokens';

export type TipCardProps = {
  content: ReactNode;
  style?: StyleProp<ViewStyle>;
  title?: string;
};

export function TipCard({ content, style, title = 'Mẹo tiết kiệm' }: TipCardProps) {
  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: oklchToRgba(Colors.accentDim),
          borderColor: oklchToRgba(Colors.accent),
        },
        style,
      ]}>
      <Text style={styles.title}>{title}</Text>
      {typeof content === 'string' ? (
        <Text style={styles.contentText}>{content}</Text>
      ) : (
        content
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 4,
  },
  title: {
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    fontWeight: '600',
    lineHeight: Typography.cardSubtitle.lineHeight,
    color: oklchToRgba(Colors.accentStrong),
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
  contentText: {
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    fontWeight: '400',
    lineHeight: Typography.cardSubtitle.lineHeight,
    color: oklchToRgba(Colors.fg),
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
});
