import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { BenefitsCard } from './BenefitsCard';
import { Button } from './Button';
import { InputField } from './InputField';
import { Toast } from './Toast';
import { useAuthStore, LoginError } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useNetworkStatus } from '../lib/networkStatus';
import { t } from '../lib/i18n';
import { Colors, Spacing, Typography, oklchToRgba } from '../lib/tokens';

const benefits = [
  { icon: '⭐', text: t('benefits.sync') },
  { icon: '💡', text: t('benefits.recommendations') },
  { icon: '🛒', text: t('benefits.shoppingLists') },
];

function getConfigAwareLoginMessage(error: LoginError, fallback: string): string {
  return error.message.startsWith('[env]') ? error.message : fallback;
}

export function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const addToast = useUIStore((s) => s.addToast);
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);
  const { isOnline } = useNetworkStatus();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const rateLimitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successRedirectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guestRedirectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (rateLimitTimerRef.current) {
        clearTimeout(rateLimitTimerRef.current);
      }
      if (successRedirectRef.current) {
        clearTimeout(successRedirectRef.current);
      }
      if (guestRedirectRef.current) {
        clearTimeout(guestRedirectRef.current);
      }
    };
  }, []);

  function clearRateLimit() {
    setIsRateLimited(false);
    rateLimitTimerRef.current = null;
  }

  async function handleLogin() {
    if (processingRef.current) return;
    processingRef.current = true;
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      processingRef.current = false;
      setErrorMessage('⚠️ ' + t('login.missingFields'));
      return;
    }

    if (!isOnline) {
      processingRef.current = false;
      setErrorMessage(t('login.offline'));
      return;
    }

    setLoading(true);

    try {
      await login(email.trim(), password);
      addToast('✅ ' + t('login.success'), 'success', 2000);
      successRedirectRef.current = setTimeout(() => router.replace('/(tabs)'), 800);
    } catch (err) {
      if (err instanceof LoginError) {
        if (err.code === 'AUTH_INVALID_CREDENTIALS') {
          setErrorMessage(t('login.invalidCredentials'));
        } else if (err.code === 'RATE_LIMIT_EXCEEDED') {
          addToast('⚠️ ' + t('login.rateLimited'), 'error', 5000);
          setIsRateLimited(true);
          rateLimitTimerRef.current = setTimeout(clearRateLimit, 5 * 60 * 1000);
        } else if (err.code === 'NETWORK_ERROR') {
          setErrorMessage(getConfigAwareLoginMessage(err, t('login.offline')));
        } else if (err.code === 'UNKNOWN') {
          addToast(t('state.error.generic'), 'error');
        } else {
          setErrorMessage(t('login.invalidCredentials'));
        }
      } else {
        setErrorMessage(t('login.invalidCredentials'));
      }
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  }

  function handleGuest() {
    addToast('👋 ' + t('guest.continue'), 'info', 2000);
    guestRedirectRef.current = setTimeout(() => router.replace('/(tabs)'), 500);
  }

  function handleRegister() {
    router.push('/register');
  }

  async function handleGoogle() {
    if (processingRef.current) return;
    processingRef.current = true;
    if (!isOnline) {
      processingRef.current = false;
      setErrorMessage(t('login.offline'));
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle();
      addToast('✅ ' + t('login.success'), 'success', 2000);
      successRedirectRef.current = setTimeout(() => router.replace('/(tabs)'), 800);
    } catch (err) {
      if (err instanceof LoginError && err.code === 'NETWORK_ERROR') {
        setErrorMessage(getConfigAwareLoginMessage(err, t('login.offline')));
      } else {
        addToast(t('state.error.generic'), 'error');
      }
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  }

  const buttonDisabled = loading || isRateLimited;

  return (
    <View style={styles.screen}>
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text
        accessibilityRole="header"
        style={styles.title}
      >
        {t('app.title')}
      </Text>

      <BenefitsCard
        benefits={benefits}
        title={t('benefits.title')}
        style={styles.benefitsCard}
      />

      <View accessibilityLabel={t('login.prompt')} style={styles.form}>
        <InputField
          accessibilityLabel={t('login.email')}
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
          error={errorMessage ? errorMessage : undefined}
          keyboardType="email-address"
          onChangeText={(text) => {
            setEmail(text);
            if (errorMessage) setErrorMessage(null);
          }}
          placeholder={t('login.email')}
          returnKeyType="next"
          value={email}
        />

        <InputField
          accessibilityLabel={t('login.password')}
          autoCapitalize="none"
          autoComplete="password"
          editable={!loading}
          error={errorMessage ? errorMessage : undefined}
          onChangeText={(text) => {
            setPassword(text);
            if (errorMessage) setErrorMessage(null);
          }}
          placeholder={t('login.password')}
          returnKeyType="done"
          secureTextEntry
          value={password}
        />

        {errorMessage ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {errorMessage}
          </Text>
        ) : null}

        <Button
          disabled={buttonDisabled}
          fullWidth
          loading={loading}
          onPress={handleLogin}
          variant="primary"
        >
          {t('login.submit')}
        </Button>

        <Button
          disabled={loading}
          fullWidth
          onPress={handleGoogle}
          style={styles.googleButton}
          variant="secondary"
        >
          {t('login.continueWithGoogle')}
        </Button>

        <Button
          disabled={loading}
          fullWidth
          onPress={handleGuest}
          variant="ghost"
        >
          {t('login.continueAsGuest')}
        </Button>

        <Text
          accessibilityRole="link"
          onPress={handleRegister}
          style={styles.registerLink}
        >
          {t('login.register')}
        </Text>
      </View>
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
  benefitsCard: {
    marginBottom: Spacing.sm,
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
  googleButton: {
    marginTop: Spacing.sm,
  },
  registerLink: {
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
