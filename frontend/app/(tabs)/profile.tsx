import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoginScreen } from '../../components/LoginScreen';
import { Chip } from '../../components/Chip';
import { InputField } from '../../components/InputField';
import { Toast } from '../../components/Toast';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import { useUIStore } from '../../stores/uiStore';
import { getApiBaseUrlOrThrow, isApiBaseUrlConfigurationError } from '../../lib/env';
import { Colors, Radius, Spacing, Typography, oklchToRgba } from '../../lib/tokens';
import { t } from '../../lib/i18n';
import type { UserPreference } from '../../types/dish';
import {
  scheduleMealReminder,
  cancelMealReminder,
  scheduleDailySuggestion,
  cancelDailySuggestion,
  requestNotificationPermissions,
} from '../../lib/notifications';

const DIETARY_OPTIONS = ['Chay', 'Thuần chay', 'Không gluten', 'Ít carbs', 'Keto', 'Cân bằng'];
const CUISINE_OPTIONS = ['Việt Nam', 'Trung Hoa', 'Nhật Bản', 'Hàn Quốc', 'Ý', 'Pháp', 'Ấn Độ', 'Thái Lan', 'Mỹ', 'Khác'];
const SAMPLE_DISHES = [
  'Phở bò', 'Bún chả', 'Cơm tấm', 'Bánh mì', 'Bún bò Huế',
  'Bánh xèo', 'Gỏi cuốn', 'Chả giò', 'Mì Quảng', 'Bún riêu',
];

function getRandomDish(): string {
  return SAMPLE_DISHES[Math.floor(Math.random() * SAMPLE_DISHES.length)];
}

const NOTIFICATION_KEYS: { key: keyof UserPreference['notifications']; labelKey: string }[] = [
  { key: 'breakfastReminder', labelKey: 'settings.notifications.breakfast' },
  { key: 'lunchReminder', labelKey: 'settings.notifications.lunch' },
  { key: 'dinnerReminder', labelKey: 'settings.notifications.dinner' },
  { key: 'dailySuggestion', labelKey: 'settings.notifications.daily' },
];

const C_ACCENT = oklchToRgba(Colors.accent);
const C_ACCENT_DIM = oklchToRgba(Colors.accentDim);
const C_BG = oklchToRgba(Colors.bg);
const C_FG = oklchToRgba(Colors.fg);
const C_MUTED = oklchToRgba(Colors.muted);
const C_BORDER = oklchToRgba(Colors.border);
const C_SURFACE = oklchToRgba(Colors.surface);
const C_DANGER = oklchToRgba(Colors.danger);

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionTitle}>{label}</Text>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function PlaceholderAvatar({ name }: { name: string }) {
  const initials = (name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)) || '?';
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  const authState = useAuthStore((s) => s.authState);
  const user = useAuthStore((s) => s.user);
  const initialize = useAuthStore((s) => s.initialize);
  const logout = useAuthStore((s) => s.logout);

  const preferences = useDataStore((s) => s.preferences);
  const fetchPreferences = useDataStore((s) => s.fetchPreferences);
  const syncPreferences = useDataStore((s) => s.syncPreferences);
  const clearSearchHistory = useDataStore((s) => s.clearSearchHistory);
  const clearAllFavorites = useDataStore((s) => s.clearAllFavorites);
  const clearData = useDataStore((s) => s.clearData);
  const preferencesStatus = useDataStore((s) => s.preferencesStatus);

  const [newAllergy, setNewAllergy] = useState('');
  const [newDisliked, setNewDisliked] = useState('');
  const [deleting, setDeleting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingRef = useRef(false);
  const pendingNotifKey = useRef<keyof UserPreference['notifications'] | null>(null);
  const [timePickerTarget, setTimePickerTarget] = useState<keyof UserPreference['notifications'] | null>(null);
  const [timePickerValue, setTimePickerValue] = useState({ hour: 7, minute: 0 });
  const [notificationTimes, setNotificationTimes] = useState<Record<string, { hour: number; minute: number }>>({
    breakfastReminder: { hour: 7, minute: 0 },
    lunchReminder: { hour: 11, minute: 30 },
    dinnerReminder: { hour: 18, minute: 0 },
    dailySuggestion: { hour: 9, minute: 0 },
  });

  useEffect(() => {
    void initialize().catch((error) => {
      if (isApiBaseUrlConfigurationError(error)) {
        addToast(error.message, 'error');
      }
    });
  }, [initialize, addToast]);

  useEffect(() => {
    if (authState !== 'loading') {
      void fetchPreferences().catch((error) => {
        if (isApiBaseUrlConfigurationError(error)) {
          addToast(error.message, 'error');
        }
      });
    }
  }, [authState, fetchPreferences, addToast]);

  useEffect(() => {
    if (preferencesStatus === 'error') {
      addToast(t('state.error.generic'), 'error');
    }
  }, [preferencesStatus, addToast]);

  const prefs = useMemo((): UserPreference => {
    const fallback: UserPreference = {
      dietaryPreferences: [],
      allergies: [],
      dislikedIngredients: [],
      preferredCuisines: [],
      measurementUnit: 'metric',
      theme: 'light',
      language: 'vi',
      notifications: {
        breakfastReminder: false,
        lunchReminder: false,
        dinnerReminder: false,
        dailySuggestion: false,
      },
    };
    return preferences ?? fallback;
  }, [preferences]);

  function confirmOrAlert(title: string, message: string, onConfirm: () => void) {
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), style: 'destructive', onPress: onConfirm },
      ]);
    }
  }

  const debouncedSync = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const state = useDataStore.getState();
      if (state.preferences) {
        syncPreferences(state.preferences);
      }
    }, 500);
  }, [syncPreferences]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const optimisticUpdate = useCallback(
    (update: Partial<UserPreference>) => {
      useDataStore.setState((state) => {
        const defaults: UserPreference = {
          dietaryPreferences: [],
          allergies: [],
          dislikedIngredients: [],
          preferredCuisines: [],
          measurementUnit: 'metric',
          theme: 'light',
          language: 'vi',
          notifications: {
            breakfastReminder: false,
            lunchReminder: false,
            dinnerReminder: false,
            dailySuggestion: false,
          },
        };
        const base = state.preferences ?? defaults;
        return { preferences: { ...base, ...update } };
      });
    },
    [],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active' && pendingNotifKey.current) {
        const { granted } = await requestNotificationPermissions();
        if (granted) {
          const key = pendingNotifKey.current;
          pendingNotifKey.current = null;
          try {
            const time = notificationTimes[key];
            if (key === 'dailySuggestion') {
              await scheduleDailySuggestion(time.hour, time.minute, getRandomDish());
            } else {
              const mealType = key === 'breakfastReminder' ? 'breakfast' : key === 'lunchReminder' ? 'lunch' : 'dinner';
              await scheduleMealReminder(mealType, time.hour, time.minute);
            }
            const current = useDataStore.getState().preferences?.notifications;
            const notifs = { ...(current ?? { breakfastReminder: false, lunchReminder: false, dinnerReminder: false, dailySuggestion: false }), [key]: true };
            optimisticUpdate({ notifications: notifs });
            debouncedSync();
          } catch {
            addToast(t('notifications.error.schedule'), 'error');
          }
        } else {
          pendingNotifKey.current = null;
        }
      }
    });
    return () => subscription.remove();
  }, [optimisticUpdate, debouncedSync, addToast, notificationTimes]);

  const handleDietaryToggle = useCallback(
    (option: string) => {
      const current = useDataStore.getState().preferences?.dietaryPreferences ?? [];
      const next = current.includes(option)
        ? current.filter((c) => c !== option)
        : [...current, option];
      optimisticUpdate({ dietaryPreferences: next });
      debouncedSync();
    },
    [optimisticUpdate, debouncedSync],
  );

  const handleAllergyAdd = useCallback(() => {
    const trimmed = newAllergy.trim();
    const current = useDataStore.getState().preferences?.allergies ?? [];
    const dup = current.some((a) => a.toLowerCase() === trimmed.toLowerCase());
    if (!trimmed || dup) return;
    const next = [...current, trimmed];
    optimisticUpdate({ allergies: next });
    setNewAllergy('');
    debouncedSync();
  }, [newAllergy, optimisticUpdate, debouncedSync]);

  const handleAllergyRemove = useCallback(
    (item: string) => {
      const current = useDataStore.getState().preferences?.allergies ?? [];
      const next = current.filter((c) => c !== item);
      optimisticUpdate({ allergies: next });
      debouncedSync();
    },
    [optimisticUpdate, debouncedSync],
  );

  const handleDislikedAdd = useCallback(() => {
    const trimmed = newDisliked.trim();
    const current = useDataStore.getState().preferences?.dislikedIngredients ?? [];
    const dup = current.some((a) => a.toLowerCase() === trimmed.toLowerCase());
    if (!trimmed || dup) return;
    const next = [...current, trimmed];
    optimisticUpdate({ dislikedIngredients: next });
    setNewDisliked('');
    debouncedSync();
  }, [newDisliked, optimisticUpdate, debouncedSync]);

  const handleDislikedRemove = useCallback(
    (item: string) => {
      const current = useDataStore.getState().preferences?.dislikedIngredients ?? [];
      const next = current.filter((c) => c !== item);
      optimisticUpdate({ dislikedIngredients: next });
      debouncedSync();
    },
    [optimisticUpdate, debouncedSync],
  );

  const handleCuisineToggle = useCallback(
    (option: string) => {
      const current = useDataStore.getState().preferences?.preferredCuisines ?? [];
      const next = current.includes(option)
        ? current.filter((c) => c !== option)
        : [...current, option];
      optimisticUpdate({ preferredCuisines: next });
      debouncedSync();
    },
    [optimisticUpdate, debouncedSync],
  );

  const handleUnitToggle = useCallback(
    (value: boolean) => {
      const unit = value ? 'imperial' : 'metric';
      optimisticUpdate({ measurementUnit: unit });
      debouncedSync();
    },
    [optimisticUpdate, debouncedSync],
  );

  const handleThemeToggle = useCallback(
    (value: boolean) => {
      const theme = value ? 'dark' : 'light';
      optimisticUpdate({ theme });
      debouncedSync();
      if (value) {
        addToast(t('settings.theme.deferred'), 'info');
      }
    },
    [optimisticUpdate, debouncedSync, addToast],
  );

  const handleNotificationToggle = useCallback(
    async (key: keyof UserPreference['notifications'], value: boolean) => {
      if (processingRef.current) return;
      processingRef.current = true;
      try {
        if (!value) {
          const current = useDataStore.getState().preferences?.notifications;
          const notifs = { ...(current ?? { breakfastReminder: false, lunchReminder: false, dinnerReminder: false, dailySuggestion: false }), [key]: false };
          optimisticUpdate({ notifications: notifs });
          debouncedSync();

          if (key === 'dailySuggestion') {
            await cancelDailySuggestion();
          } else {
            const mealType = key === 'breakfastReminder' ? 'breakfast' : key === 'lunchReminder' ? 'lunch' : 'dinner';
            await cancelMealReminder(mealType);
          }
          return;
        }

        const { granted, canAskAgain } = await requestNotificationPermissions();
        if (!granted) {
          if (canAskAgain) return;
          pendingNotifKey.current = key;
          const openSettingsLabel = Platform.OS === 'web' ? null : t('notifications.permission.open');
          const buttons: { text: string; style?: 'cancel'; onPress?: () => void }[] = [
            { text: t('common.cancel'), style: 'cancel' },
          ];
          if (openSettingsLabel) {
            buttons.push({ text: openSettingsLabel, onPress: () => Linking.openSettings() });
          }
          Alert.alert(
            t('settings.notifications'),
            t('notifications.permission.denied'),
            buttons,
          );
          return;
        }

        const time = notificationTimes[key];
        if (key === 'dailySuggestion') {
          await scheduleDailySuggestion(time.hour, time.minute, getRandomDish());
        } else {
          const mealType = key === 'breakfastReminder' ? 'breakfast' : key === 'lunchReminder' ? 'lunch' : 'dinner';
          await scheduleMealReminder(mealType, time.hour, time.minute);
        }

        const current = useDataStore.getState().preferences?.notifications;
        const notifs = { ...(current ?? { breakfastReminder: false, lunchReminder: false, dinnerReminder: false, dailySuggestion: false }), [key]: true };
        optimisticUpdate({ notifications: notifs });
        debouncedSync();
      } catch {
        addToast(t('notifications.error.schedule'), 'error');
      } finally {
        processingRef.current = false;
      }
    },
    [optimisticUpdate, debouncedSync, addToast, notificationTimes],
  );

  const handleClearHistory = useCallback(() => {
    confirmOrAlert(t('settings.clearHistory'), t('settings.clearHistory.confirm'), async () => {
      try {
        await clearSearchHistory();
        addToast(t('settings.clearHistory.done'), 'success');
      } catch (error) {
        if (isApiBaseUrlConfigurationError(error)) {
          addToast(error.message, 'error');
          return;
        }
        addToast(t('state.error.generic'), 'error');
      }
    });
  }, [clearSearchHistory, addToast]);

  const handleClearFavorites = useCallback(() => {
    confirmOrAlert(t('settings.clearFavorites'), t('settings.clearFavorites.confirm'), async () => {
      try {
        await clearAllFavorites();
        addToast(t('settings.clearFavorites.done'), 'success');
      } catch (error) {
        if (isApiBaseUrlConfigurationError(error)) {
          addToast(error.message, 'error');
          return;
        }
        addToast(t('state.error.generic'), 'error');
      }
    });
  }, [clearAllFavorites, addToast]);

  const handleDeleteAccount = useCallback(() => {
    confirmOrAlert(t('settings.deleteAccount'), t('settings.deleteAccount.confirm1'), () => {
      confirmOrAlert(t('settings.deleteAccount'), t('settings.deleteAccount.confirm2'), async () => {
        if (deleting) return;
        setDeleting(true);
        try {
          const token = useAuthStore.getState().accessToken;
          const response = await fetch(`${getApiBaseUrlOrThrow()}/api/v1/account`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (!response.ok) {
            addToast(t('state.error.generic'), 'error');
            return;
          }
          await clearData();
          await logout();
          router.replace('/(tabs)/discover');
          addToast(t('settings.deleteAccount.done'), 'info');
        } catch (error) {
          if (isApiBaseUrlConfigurationError(error)) {
            addToast(error.message, 'error');
            return;
          }
          addToast(t('state.error.generic'), 'error');
        } finally {
          setDeleting(false);
        }
      });
    });
  }, [clearData, logout, addToast, router, deleting]);

  const handleTimePickerConfirm = useCallback(async () => {
    if (!timePickerTarget) return;
    const key = timePickerTarget;
    setNotificationTimes((prev) => ({ ...prev, [key]: timePickerValue }));
    setTimePickerTarget(null);
    if (prefs.notifications[key]) {
      try {
        if (key === 'dailySuggestion') {
          await cancelDailySuggestion();
          await scheduleDailySuggestion(timePickerValue.hour, timePickerValue.minute, getRandomDish());
        } else {
          const mealType = key === 'breakfastReminder' ? 'breakfast' : key === 'lunchReminder' ? 'lunch' : 'dinner';
          await cancelMealReminder(mealType);
          await scheduleMealReminder(mealType, timePickerValue.hour, timePickerValue.minute);
        }
      } catch {
        addToast(t('notifications.error.schedule'), 'error');
      }
    }
  }, [timePickerTarget, timePickerValue, prefs.notifications, addToast]);

  if (authState === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C_ACCENT} size="large" />
      </View>
    );
  }

  if (authState === 'guest') {
    return <LoginScreen />;
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(Spacing.xl2, insets.bottom + Spacing.md) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.greetingCard}>
          <PlaceholderAvatar name={user?.displayName || 'U'} />
          <View style={styles.greetingTextWrap}>
            <Text accessibilityRole="header" style={styles.greetingText}>
              {t('settings.greeting').replace('{name}', user?.displayName ?? '')}
            </Text>
          </View>
        </View>

        <Divider />

        <SectionHeader label={t('settings.dietary')} />
        <View style={styles.chipRow}>
          {DIETARY_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={option}
              onPress={() => handleDietaryToggle(option)}
              selected={prefs.dietaryPreferences.includes(option)}
              variant="tag"
            />
          ))}
        </View>

        <Divider />

        <SectionHeader label={t('settings.allergies')} />
        <InputField
          maxLength={100}
          onChangeText={setNewAllergy}
          onSubmitEditing={handleAllergyAdd}
          placeholder={t('settings.allergies.add')}
          returnKeyType="done"
          value={newAllergy}
        />
        {prefs.allergies.length > 0 && (
          <View style={styles.chipRow}>
            {prefs.allergies.map((item) => (
              <Chip
                key={item}
                label={item}
                onRemove={() => handleAllergyRemove(item)}
                variant="ingredient"
              />
            ))}
          </View>
        )}

        <Divider />

        <SectionHeader label={t('settings.disliked')} />
        <InputField
          maxLength={100}
          onChangeText={setNewDisliked}
          onSubmitEditing={handleDislikedAdd}
          placeholder={t('settings.disliked.add')}
          returnKeyType="done"
          value={newDisliked}
        />
        {prefs.dislikedIngredients.length > 0 && (
          <View style={styles.chipRow}>
            {prefs.dislikedIngredients.map((item) => (
              <Chip
                key={item}
                label={item}
                onRemove={() => handleDislikedRemove(item)}
                variant="ingredient"
              />
            ))}
          </View>
        )}

        <Divider />

        <SectionHeader label={t('settings.cuisines')} />
        <View style={styles.chipRow}>
          {CUISINE_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={option}
              onPress={() => handleCuisineToggle(option)}
              selected={prefs.preferredCuisines.includes(option)}
              variant="cuisine"
            />
          ))}
        </View>

        <Divider />

        <SectionHeader label={t('settings.units')} />
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t('settings.units.metric')}</Text>
          <Switch
            accessibilityLabel={t('settings.units')}
            onValueChange={handleUnitToggle}
            trackColor={{ false: C_BORDER, true: C_ACCENT }}
            value={prefs.measurementUnit === 'imperial'}
          />
          <Text style={styles.toggleLabel}>{t('settings.units.imperial')}</Text>
        </View>

        <Divider />

        <SectionHeader label={t('settings.theme')} />
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t('settings.theme.light')}</Text>
          <Switch
            accessibilityLabel={t('settings.theme')}
            onValueChange={handleThemeToggle}
            trackColor={{ false: C_BORDER, true: C_ACCENT }}
            value={prefs.theme === 'dark'}
          />
          <Text style={styles.toggleLabel}>{t('settings.theme.dark')}</Text>
        </View>

        <Divider />

        <SectionHeader label={t('settings.notifications')} />
        <View style={styles.notificationsSection}>
          {NOTIFICATION_KEYS.map(({ key, labelKey }) => (
            <View key={key} style={styles.toggleRow}>
              <View style={styles.notifLabelWrap}>
                <Text style={styles.toggleLabel}>{t(labelKey)}</Text>
                {prefs.notifications[key] && (
                  <Pressable onPress={() => { setTimePickerTarget(key); setTimePickerValue(notificationTimes[key]); }} style={styles.timeBadge}>
                    <Text style={styles.timeText}>
                      {String(notificationTimes[key].hour).padStart(2, '0')}:{String(notificationTimes[key].minute).padStart(2, '0')}
                    </Text>
                  </Pressable>
                )}
              </View>
              <Switch
                disabled={processingRef.current}
                onValueChange={(value) => handleNotificationToggle(key, value)}
                trackColor={{ false: C_BORDER, true: C_ACCENT }}
                value={prefs.notifications[key]}
              />
            </View>
          ))}
        </View>

        <Divider />

        <SectionHeader label={t('settings.privacy')} />
        <View style={styles.privacySection}>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={handleClearHistory}
            style={styles.actionRow}
          >
            <Text style={styles.actionText}>{t('settings.clearHistory')}</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity
            onPress={handleClearFavorites}
            style={styles.actionRow}
          >
            <Text style={styles.actionText}>{t('settings.clearFavorites')}</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={styles.actionRow}
          >
            <Text style={[styles.actionText, styles.actionTextDanger]}>
              {t('settings.deleteAccount')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity
            onPress={() => {
              confirmOrAlert(t('settings.logout'), 'Bạn có chắc chắn muốn đăng xuất?', async () => {
                await logout();
                addToast('👋 ' + t('guest.continue'), 'info', 2000);
              });
            }}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>{t('settings.logout')}</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </View>

      {timePickerTarget && (
        <Modal transparent animationType="fade" visible={!!timePickerTarget} onRequestClose={() => setTimePickerTarget(null)}>
          <Pressable style={styles.modalOverlay} onPress={() => setTimePickerTarget(null)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>{t('notifications.setTime.title')}</Text>
              <View style={styles.timeInputRow}>
                <TextInput
                  style={styles.timeInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={String(timePickerValue.hour).padStart(2, '0')}
                  onChangeText={(text) => {
                    const h = parseInt(text, 10);
                    if (!isNaN(h)) setTimePickerValue((v) => ({ ...v, hour: Math.min(23, Math.max(0, h)) }));
                  }}
                />
                <Text style={styles.timeColon}>:</Text>
                <TextInput
                  style={styles.timeInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={String(timePickerValue.minute).padStart(2, '0')}
                  onChangeText={(text) => {
                    const m = parseInt(text, 10);
                    if (!isNaN(m)) setTimePickerValue((v) => ({ ...v, minute: Math.min(59, Math.max(0, m)) }));
                  }}
                />
              </View>
              <View style={styles.timeModalButtons}>
                <Pressable onPress={() => setTimePickerTarget(null)} style={styles.timeModalBtn}>
                  <Text style={styles.timeModalBtnText}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable onPress={handleTimePickerConfirm} style={[styles.timeModalBtn, styles.timeModalBtnPrimary]}>
                  <Text style={[styles.timeModalBtnText, styles.timeModalBtnTextPrimary]}>{t('common.confirm')}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

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
    backgroundColor: C_BG,
  },
  container: {
    flex: 1,
    maxWidth: Platform.OS === 'web' ? 1200 : Spacing.screenMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  scrollContent: {
    padding: Spacing.md2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C_ACCENT_DIM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Typography.screenTitle.family,
    fontSize: Typography.screenTitle.fontSize,
    fontWeight: Typography.screenTitle.fontWeight,
    color: C_ACCENT,
  },
  greetingTextWrap: {
    flex: 1,
  },
  greetingText: {
    fontFamily: Typography.screenTitle.family,
    fontSize: Typography.screenTitle.fontSize,
    fontWeight: Typography.screenTitle.fontWeight,
    lineHeight: Typography.screenTitle.lineHeight,
    color: C_FG,
  },
  sectionTitle: {
    fontFamily: Typography.sectionTitle.family,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    lineHeight: Typography.sectionTitle.lineHeight,
    color: C_MUTED,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: C_BORDER,
    marginVertical: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  toggleLabel: {
    fontFamily: Typography.body.family,
    fontSize: Typography.body.fontSize,
    fontWeight: Typography.body.fontWeight,
    lineHeight: Typography.body.lineHeight,
    color: C_FG,
  },
  notificationsSection: {
    gap: Spacing.xs,
  },
  privacySection: {
    borderRadius: Radius.md,
    backgroundColor: C_SURFACE,
    overflow: 'hidden',
  },
  actionRow: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  actionText: {
    fontFamily: Typography.body.family,
    fontSize: Typography.body.fontSize,
    fontWeight: Typography.body.fontWeight,
    lineHeight: Typography.body.lineHeight,
    color: C_FG,
  },
  actionTextDanger: {
    color: C_DANGER,
  },
  actionDivider: {
    height: 1,
    backgroundColor: C_BORDER,
    marginLeft: Spacing.md,
  },
  notifLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  timeBadge: {
    backgroundColor: C_SURFACE,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  timeText: {
    fontFamily: Typography.body.family,
    fontSize: Typography.body.fontSize,
    color: C_ACCENT,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: C_BG,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    width: 260,
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: Typography.sectionTitle.family,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    color: C_FG,
    marginBottom: Spacing.md,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  timeInput: {
    width: 60,
    height: 44,
    borderWidth: 1,
    borderColor: C_BORDER,
    borderRadius: Radius.sm,
    textAlign: 'center',
    fontFamily: Typography.body.family,
    fontSize: Typography.body.fontSize,
    color: C_FG,
  },
  timeColon: {
    fontFamily: Typography.body.family,
    fontSize: Typography.screenTitle.fontSize,
    color: C_FG,
  },
  timeModalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timeModalBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.sm,
  },
  timeModalBtnPrimary: {
    backgroundColor: C_ACCENT,
  },
  timeModalBtnText: {
    fontFamily: Typography.body.family,
    fontSize: Typography.body.fontSize,
    color: C_FG,
  },
  timeModalBtnTextPrimary: {
    color: '#fff',
  },
  logoutSection: {
    marginTop: Spacing.lg,
  },
  logoutButton: {
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C_DANGER,
  },
  logoutText: {
    fontFamily: Typography.body.family,
    fontSize: Typography.body.fontSize,
    fontWeight: Typography.body.fontWeight,
    color: C_DANGER,
  },
});
