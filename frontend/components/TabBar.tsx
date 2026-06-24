import { type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Link, type Href } from 'expo-router';

import { Colors, Spacing, Typography, ZIndex, oklchToRgba } from '../lib/tokens';

export type TabBarItem = {
  active?: boolean;
  href?: Href;
  icon: (active: boolean) => ReactNode;
  key: string;
  label: string;
  onPress?: () => void;
};

export type TabBarProps = {
  style?: StyleProp<ViewStyle>;
  tabs: TabBarItem[];
};

function TabButton({ tab }: { tab: TabBarItem }) {
  const active = Boolean(tab.active);
  const content = (
    <Pressable
      accessibilityRole={tab.href ? 'link' : 'button'}
      accessibilityState={{ selected: active }}
      hitSlop={8}
      onPress={tab.onPress}
      style={({ pressed }) => [
        styles.tabButton,
        { opacity: pressed ? 0.7 : 1 },
      ]}>
      <View style={styles.iconWrap}>{tab.icon(active)}</View>
      <Text style={[styles.label, active ? styles.activeLabel : null]}>{tab.label}</Text>
    </Pressable>
  );

  if (tab.href) {
    return (
      <Link asChild href={tab.href}>
        {content}
      </Link>
    );
  }

  return content;
}

export function TabBar({ style, tabs }: TabBarProps) {
  return (
    <View
      pointerEvents="box-none"
      role="navigation"
      style={[styles.shell, style]}>
      <View style={styles.bar}>
        {tabs.map((tab) => (
          <TabButton key={tab.key} tab={tab} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: ZIndex.tabBar,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 600 : 430,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: oklchToRgba(Colors.border),
    backgroundColor: oklchToRgba(Colors.surface),
    paddingTop: 8,
    paddingBottom: 20,
  },
  tabButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: 4,
  },
  iconWrap: {
    minHeight: 24,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: oklchToRgba(Colors.muted),
    fontFamily: Typography.meta.family,
    fontSize: Typography.meta.fontSize,
    fontWeight: Typography.button.fontWeight,
    lineHeight: Typography.meta.lineHeight,
  },
  activeLabel: {
    color: oklchToRgba(Colors.accent),
  },
});
