import 'react-native-reanimated';
import { useEffect } from 'react';

import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  setNotificationHandler,
  addNotificationResponseReceivedListener,
} from 'expo-notifications';

import { ErrorBoundary } from '../components/ErrorBoundary';
import { initMonitoring } from '../lib/monitoring';
import { NetworkStatusProvider } from '../lib/networkStatus';
import { useAuthStore } from '../stores/authStore';

initMonitoring();

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Handle Google OAuth redirect callback on web
    useAuthStore.getState().handleGoogleCallback();
  }, []);

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
      if (typeof data?.target === 'string') {
        router.push(data.target as any);
      }
    });

    return () => {
      responseListener.remove();
    };
  }, [router]);

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
