import 'react-native-reanimated';

import * as Sentry from 'sentry-expo';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '../components/ErrorBoundary';
import { NetworkStatusProvider } from '../lib/networkStatus';

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  enableInExpoDevelopment: false,
  debug: false,
  tracesSampleRate: 0.1,
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NetworkStatusProvider>
        <ErrorBoundary>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="recipe/[id]" />
            <Stack.Screen name="shopping-list" />
          </Stack>
        </ErrorBoundary>
      </NetworkStatusProvider>
    </SafeAreaProvider>
  );
}
