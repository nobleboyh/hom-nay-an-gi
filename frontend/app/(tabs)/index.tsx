import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { createApiClient, type ApiError } from '../../lib/api';
import { Colors, Radius, Spacing, Typography, oklchToRgba } from '../../lib/tokens';

type HelloResponse = {
  message: string;
  source: string;
};

const apiClient = createApiClient({
  baseUrl: process.env.API_BASE_URL || 'http://localhost:8080',
  getToken: async () => null,
  onTokenExpired: async () => {},
  onUnauthenticated: () => {},
});

export default function HomeScreen() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Checking backend connection...');

  const webMainContentProps =
    Platform.OS === 'web'
      ? ({ id: 'main-content', tabIndex: -1 } as { id: string; tabIndex: number })
      : {};

  async function loadHello() {
    setStatus('loading');
    setMessage('Checking backend connection...');

    try {
      const response = await apiClient.get<HelloResponse>('/api/v1/hello');
      setStatus('success');
      setMessage(`${response.data.message} (${response.data.source})`);
    } catch (error) {
      const apiError = error as ApiError;
      setStatus('error');
      setMessage(apiError.message || 'Unable to reach backend');
    }
  }

  useEffect(() => {
    void loadHello();
  }, []);

  return (
    <View style={styles.screen}>
      <Pressable accessibilityRole="link" onPress={() => {}} style={styles.skipLink}>
        <Text style={styles.skipLinkText}>Bỏ qua điều hướng → #main-content</Text>
      </Pressable>

      <View {...webMainContentProps} accessibilityRole="summary" nativeID="main-content" style={styles.card}>
        <Text style={styles.eyebrow}>Backend Smoke Test</Text>
        <Text style={styles.title}>Trang chủ</Text>
        <Text style={styles.description}>
          This screen calls <Text style={styles.inlineCode}>/api/v1/hello</Text> to verify the
          frontend can reach the backend.
        </Text>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text
            style={[
              styles.statusValue,
              status === 'success' ? styles.success : status === 'error' ? styles.error : null,
            ]}>
            {status.toUpperCase()}
          </Text>
          <Text style={styles.message}>{message}</Text>
        </View>

        <Pressable accessibilityRole="button" onPress={() => void loadHello()} style={styles.button}>
          <Text style={styles.buttonText}>Retry hello check</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: oklchToRgba(Colors.bg),
    paddingHorizontal: Spacing.md2,
    paddingVertical: Spacing.md2,
    justifyContent: 'center',
  },
  skipLink: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.gap,
    borderRadius: Radius.sm,
    backgroundColor: oklchToRgba(Colors.fg),
    paddingHorizontal: Spacing.gap,
    paddingVertical: Spacing.sm2,
  },
  skipLinkText: {
    color: oklchToRgba(Colors.surface),
    fontFamily: Typography.button.family,
    fontSize: Typography.cardSubtitle.fontSize,
    fontWeight: Typography.button.fontWeight,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: oklchToRgba(Colors.border),
    backgroundColor: oklchToRgba(Colors.surface),
    paddingHorizontal: Spacing.lg,
    paddingVertical: 28,
    gap: Spacing.md2,
  },
  eyebrow: {
    fontFamily: Typography.badge.family,
    fontSize: Typography.badge.fontSize,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: oklchToRgba(Colors.accentStrong),
  },
  title: {
    fontFamily: Typography.appTitle.family,
    fontSize: Typography.appTitle.fontSize,
    fontWeight: '800',
    color: oklchToRgba(Colors.fg),
  },
  description: {
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardTitle.fontSize,
    lineHeight: 24,
    color: oklchToRgba(Colors.muted),
  },
  inlineCode: {
    fontFamily: 'Courier',
    color: oklchToRgba(Colors.fg),
  },
  statusBox: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: oklchToRgba(Colors.border),
    backgroundColor: oklchToRgba(Colors.accentDim),
    padding: Spacing.md2,
    gap: Spacing.sm2,
  },
  statusLabel: {
    fontFamily: Typography.badge.family,
    fontSize: Typography.badge.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: oklchToRgba(Colors.muted),
  },
  statusValue: {
    fontFamily: Typography.cardTitle.family,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: '700',
    color: oklchToRgba(Colors.fg),
  },
  success: {
    color: '#1E7A46',
  },
  error: {
    color: '#B63737',
  },
  message: {
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    lineHeight: 22,
    color: oklchToRgba(Colors.fg),
  },
  button: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    backgroundColor: oklchToRgba(Colors.accentStrong),
    paddingHorizontal: Spacing.md2,
    paddingVertical: Spacing.sm2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: Typography.button.family,
    fontSize: Typography.button.fontSize,
    fontWeight: Typography.button.fontWeight,
  },
});
