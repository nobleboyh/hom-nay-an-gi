import 'react-native-reanimated';
import { useEffect } from 'react';

import * as Sentry from 'sentry-expo';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  setNotificationHandler,
  addNotificationResponseReceivedListener,
} from 'expo-notifications';

import { ErrorBoundary } from '../components/ErrorBoundary';
import { NetworkStatusProvider } from '../lib/networkStatus';

const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn && !sentryDsn.startsWith('replace-with-')) {
  Sentry.init({
    dsn: sentryDsn,
    enableInExpoDevelopment: false,
    debug: false,
    tracesSampleRate: 0.1,
  });
}

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const responseListener = addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      router.push(data?.target ?? '/');
    });

    return () => {
      responseListener.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NetworkStatusProvider>
        <ErrorBoundary>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="recipe/[id]" />
            <Stack.Screen name="shopping-list" />
            <Stack.Screen name="register" options={{ animation: 'slide_from_bottom' }} />
          </Stack>
        </ErrorBoundary>
      </NetworkStatusProvider>
    </SafeAreaProvider>
  );
}
