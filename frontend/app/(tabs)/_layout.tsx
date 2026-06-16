import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { StyleSheet, Text } from 'react-native';
import { useUIStore, type TabName } from '../../stores/uiStore';

function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return (
    <Text accessibilityElementsHidden style={[styles.icon, { color: color as string }]}>
      {glyph}
    </Text>
  );
}

const tabNameMap: Record<string, TabName> = {
  index: 'home',
  discover: 'discover',
  favorites: 'favorites',
  profile: 'profile',
};

export default function TabsLayout() {
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#A8461F',
        tabBarInactiveTintColor: '#5A6772',
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      }}
      screenListeners={{
        state: (e) => {
          const routeName = e.data?.state?.routes?.[e.data?.state?.index ?? 0]?.name;
          if (routeName && tabNameMap[routeName]) {
            setActiveTab(tabNameMap[routeName]);
          }
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <TabIcon color={color} glyph="⌂" />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Khám phá',
          tabBarIcon: ({ color }) => <TabIcon color={color} glyph="🧭" />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Yêu thích',
          tabBarIcon: ({ color }) => <TabIcon color={color} glyph="♡" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color }) => <TabIcon color={color} glyph="◉" />,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 18,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabBar: {
    height: 72,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderTopColor: '#D7DCE2',
  },
  tabItem: {
    minHeight: 44,
  },
});
