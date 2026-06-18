import { useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { Toast } from '../components/Toast';
import { useAuthStore, LoginError } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useNetworkStatus } from '../lib/networkStatus';
import { t } from '../lib/i18n';
import { Colors, Spacing, Typography, oklchToRgba } from '../lib/tokens';

export default function RegisterScreen() {
  const register = useAuthStore((s) => s.register);
  const addToast = useUIStore((s) => s.addToast);
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);
  const { isOnline } = useNetworkStatus();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const successRedirectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingRef = useRef(false);

  function clearFormError() {
    if (errorMessage) setErrorMessage(null);
  }

  async function handleRegister() {
    if (processingRef.current) return;
    processingRef.current = true;
    setErrorMessage(null);

    if (!displayName.trim()) {
      processingRef.current = false;
      setErrorMessage('⚠️ ' + t('register.missingDisplayName'));
      return;
    }

    if (!email.trim() || !password.trim()) {
      processingRef.current = false;
      setErrorMessage('⚠️ ' + t('register.missingFields'));
      return;
    }

    if (password.length < 8) {
      processingRef.current = false;
      setErrorMessage('⚠️ ' + t('register.passwordMinLength'));
      return;
    }

    if (password !== confirmPassword) {
      processingRef.current = false;
      setErrorMessage('⚠️ ' + t('register.passwordMismatch'));
      return;
    }

    if (!isOnline) {
      processingRef.current = false;
      setErrorMessage(t('register.offline'));
      return;
    }

    setLoading(true);

    try {
      await register(email.trim(), password, displayName.trim());
      addToast('✅ ' + t('register.success'), 'success', 2000);
      successRedirectRef.current = setTimeout(() => router.replace('/(tabs)'), 800);
    } catch (err) {
      if (err instanceof LoginError) {
        if (err.code === 'AUTH_INVALID_CREDENTIALS') {
          setErrorMessage(t('register.emailExists'));
        } else if (err.code === 'RATE_LIMIT_EXCEEDED') {
          addToast('⚠️ ' + t('login.rateLimited'), 'error', 5000);
        } else if (err.code === 'NETWORK_ERROR') {
          setErrorMessage(t('register.offline'));
        } else {
          setErrorMessage(t('register.error'));
        }
      } else {
        setErrorMessage(t('register.error'));
      }
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.backLink} onPress={() => router.back()}>
          ← {t('common.back')}
        </Text>

        <Text
          accessibilityRole="header"
          style={styles.title}
        >
          {t('register.title')}
        </Text>

        <View style={styles.form}>
          <InputField
            accessibilityLabel={t('register.displayName')}
            autoCapitalize="words"
            autoComplete="name"
            editable={!loading}
            onChangeText={(text) => {
              setDisplayName(text);
              clearFormError();
            }}
            placeholder={t('register.displayName')}
            returnKeyType="next"
            value={displayName}
          />

          <InputField
            accessibilityLabel={t('register.email')}
            autoCapitalize="none"
            autoComplete="email"
            editable={!loading}
            keyboardType="email-address"
            onChangeText={(text) => {
              setEmail(text);
              clearFormError();
            }}
            placeholder={t('register.email')}
            returnKeyType="next"
            value={email}
          />

          <InputField
            accessibilityLabel={t('register.password')}
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!loading}
            onChangeText={(text) => {
              setPassword(text);
              clearFormError();
            }}
            placeholder={t('register.password')}
            returnKeyType="next"
            secureTextEntry
            value={password}
          />

          <InputField
            accessibilityLabel={t('register.confirmPassword')}
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!loading}
            onChangeText={(text) => {
              setConfirmPassword(text);
              clearFormError();
            }}
            placeholder={t('register.confirmPassword')}
            returnKeyType="done"
            secureTextEntry
            value={confirmPassword}
          />

          {errorMessage ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              {errorMessage}
            </Text>
          ) : null}

          <Button
            disabled={loading}
            fullWidth
            loading={loading}
            onPress={handleRegister}
            variant="primary"
          >
            {t('register.submit')}
          </Button>
        </View>

        <Text
          accessibilityRole="link"
          onPress={() => router.back()}
          style={styles.loginLink}
        >
          {t('register.hasAccount')}
        </Text>
      </ScrollView>

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          durationMs={toast.durationMs}
          message={toast.message}
          onDismiss={() => dismissToast(toast.id)}
          tone={toast.type === 'error' ? 'danger' : toast.type === 'success' ? 'success' : 'neutral'}
          visible
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.md,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
    maxWidth: Spacing.screenMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontFamily: Typography.appTitle.family,
    fontSize: Typography.appTitle.fontSize,
    fontWeight: Typography.appTitle.fontWeight,
    lineHeight: Typography.appTitle.lineHeight,
    color: oklchToRgba(Colors.accent),
    textAlign: 'center',
    letterSpacing: -0.56,
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
  form: {
    gap: Spacing.gap,
  },
  error: {
    color: oklchToRgba(Colors.danger),
    fontFamily: Typography.meta.family,
    fontSize: Typography.meta.fontSize,
    fontWeight: Typography.meta.fontWeight,
    lineHeight: Typography.meta.lineHeight,
    textAlign: 'center',
  },
  backLink: {
    fontFamily: Typography.button.family,
    fontSize: Typography.button.fontSize,
    fontWeight: Typography.button.fontWeight,
    lineHeight: Typography.button.lineHeight,
    color: oklchToRgba(Colors.accent),
    ...(Platform.OS === 'web' ? { cursor: 'pointer', userSelect: 'none' } : {}),
  },
  loginLink: {
    fontFamily: Typography.button.family,
    fontSize: Typography.button.fontSize,
    fontWeight: Typography.button.fontWeight,
    lineHeight: Typography.button.lineHeight,
    color: oklchToRgba(Colors.accent),
    textAlign: 'center',
    minHeight: 44,
    textAlignVertical: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer', userSelect: 'none' } : {}),
  },
});
