import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';

import { Button, EmptyState, Skeleton, TipCard, Toast } from '../components';
import type { ToastProps } from '../components/Toast';
import { formatTime } from '../lib/formatTime';
import { t } from '../lib/i18n';
import { Colors, Radius, Spacing, Typography, oklchToRgba } from '../lib/tokens';
import { storageAdapter } from '../stores/storageAdapter';
import { useUIStore } from '../stores/uiStore';

function toastTone(type: 'success' | 'error' | 'info'): ToastProps['tone'] {
  if (type === 'error') return 'danger';
  if (type === 'success') return 'success';
  return 'neutral';
}

function renderToasts(
  toasts: { id: string; durationMs?: number; message: string; type: 'success' | 'error' | 'info' }[],
  dismissToast: (id: string) => void,
) {
  return toasts.map((toast) => (
    <Toast
      key={toast.id}
      durationMs={toast.durationMs}
      message={toast.message}
      onDismiss={() => dismissToast(toast.id)}
      tone={toastTone(toast.type)}
      visible
    />
  ));
}

function ShoppingListSkeleton() {
  return (
    <ScrollView style={styles.skeletonContainer}>
      <View style={styles.skeletonHeader}>
        <Skeleton variant="text" style={styles.skeletonTopBar} />
      </View>
      <Skeleton variant="card" style={styles.skeletonRecipeCard} />
      <View style={styles.skeletonSection}>
        <Skeleton variant="text" style={styles.skeletonSectionHeader} />
        <Skeleton variant="text" style={styles.skeletonItem} />
        <Skeleton variant="text" style={styles.skeletonItem} />
      </View>
      <View style={styles.skeletonSection}>
        <Skeleton variant="text" style={styles.skeletonSectionHeader} />
        <Skeleton variant="text" style={styles.skeletonItem} />
        <Skeleton variant="text" style={styles.skeletonItem} />
        <Skeleton variant="text" style={styles.skeletonItem} />
      </View>
    </ScrollView>
  );
}

function generateListText(
  dishName: string,
  servings: string,
  owned: string[],
  missing: string[],
  checkedState: Record<string, boolean>,
): string {
  const lines: string[] = [];
  lines.push(`📋 ${dishName} — ${servings} ${t('recipe.servings').toLowerCase()}`);
  lines.push('');

  if (owned.length > 0) {
    lines.push(`✓ ${t('shopping.ownedItems').toUpperCase()}:`);
    for (const name of owned) {
      lines.push(`☑ ${name}`);
    }
    lines.push('');
  }

  if (missing.length > 0) {
    lines.push(`🛒 ${t('shopping.needToBuy').toUpperCase()}:`);
    for (const name of missing) {
      const checked = checkedState[name];
      lines.push(`${checked ? '☑' : '☐'} ${name}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export default function ShoppingListScreen() {
  const params = useLocalSearchParams<{
    dishId?: string;
    dishName?: string;
    owned?: string;
    missing?: string;
    servings?: string;
    cookTime?: string;
  }>();

  const addToast = useUIStore((s) => s.addToast);
  const dismissToast = useUIStore((s) => s.dismissToast);
  const toasts = useUIStore((s) => s.toasts);

  const [isLoading, setIsLoading] = useState(true);
  const [isError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);

  const dishId = params.dishId || '';
  const dishName = params.dishName || '';
  const servings = params.servings || '2';
  const cookTimeRaw = params.cookTime || '';
  const cookTime = /^\d+$/.test(cookTimeRaw) ? cookTimeRaw : '';

  const owned = useMemo(() => {
    if (!params.owned) return [];
    return params.owned.split(',').filter(Boolean);
  }, [params.owned]);

  const missing = useMemo(() => {
    if (!params.missing) return [];
    return params.missing.split(',').filter((name) => name && !owned.includes(name));
  }, [params.missing, owned]);

  const [checkedState, setCheckedState] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const name of owned) {
      initial[name] = true;
    }
    for (const name of missing) {
      initial[name] = false;
    }
    return initial;
  });

  const allMissingChecked = useMemo(
    () => missing.length > 0 && missing.every((name) => checkedState[name]),
    [missing, checkedState],
  );

  const bannerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (allMissingChecked) {
      setShowCompletionBanner(true);
      Animated.timing(bannerOpacity, {
        duration: 300,
        toValue: 1,
        useNativeDriver: true,
      }).start();
      const timer = setTimeout(() => {
        Animated.timing(bannerOpacity, {
          duration: 300,
          toValue: 0,
          useNativeDriver: true,
        }).start(() => {
          if (mountedRef.current) setShowCompletionBanner(false);
        });
      }, 5000);
      return () => {
        clearTimeout(timer);
        setShowCompletionBanner(false);
      };
    } else {
      setShowCompletionBanner(false);
    }
  }, [allMissingChecked, bannerOpacity]);

  const handleToggle = useCallback((name: string) => {
    setCheckedState((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  }, []);

  const handleCopy = useCallback(async () => {
    const text = generateListText(dishName, servings, owned, missing, checkedState);
    try {
      await Clipboard.setStringAsync(text);
      addToast(t('shopping.copySuccess'), 'success');
    } catch {
      addToast(t('state.error.generic'), 'error');
    }
  }, [dishName, servings, owned, missing, checkedState, addToast]);

  const handleShare = useCallback(async () => {
    const text = generateListText(dishName, servings, owned, missing, checkedState);
    try {
      if (Platform.OS === 'web' && typeof navigator.share === 'function') {
        await navigator.share({ text });
        return;
      }
      await Share.share({ message: text });
    } catch {
      addToast(t('state.error.generic'), 'error');
    }
  }, [dishName, servings, owned, missing, checkedState, addToast]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    const listData = {
      dishId,
      dishName,
      ingredients: [...owned, ...missing],
      checkedState,
    };
    const id = `shopping-${dishId || Date.now()}`;
    await storageAdapter.write('shopping_lists_guest', id, listData);
    addToast(t('shopping.saveSuccess'), 'success');
    setIsSaving(false);
  }, [dishId, dishName, owned, missing, checkedState, isSaving, addToast]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const hasData = owned.length > 0 || missing.length > 0;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <ShoppingListSkeleton />
        {renderToasts(toasts, dismissToast)}
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.screen}>
        <EmptyState
          icon="⚠️"
          title={t('state.error.generic')}
          description=""
          ctaLabel={t('aria.back')}
          onCtaPress={handleBack}
        />
        {renderToasts(toasts, dismissToast)}
      </SafeAreaView>
    );
  }

  if (!hasData) {
    return (
      <SafeAreaView style={styles.screen}>
        <EmptyState
          icon="🛒"
          title={t('shopping.empty')}
          description=""
          ctaLabel={t('shopping.backToResults')}
          onCtaPress={handleBack}
        />
        {renderToasts(toasts, dismissToast)}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Pressable
        accessibilityRole="link"
        onPress={() => {
          if (Platform.OS === 'web') {
            const el = document.getElementById('shopping-content');
            el?.focus();
          }
        }}
        style={styles.skipLink}
      >
        <Text style={styles.skipLinkText}>{t('home.skipNavigation')}</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          {...(Platform.OS === 'web' ? { id: 'shopping-content', role: 'main' as const } : {})}
          style={styles.content}
        >
          <View style={styles.topBar}>
            <Pressable
              accessibilityLabel={t('aria.back')}
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleBack}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>‹</Text>
            </Pressable>
            <Button onPress={handleCopy} variant="ghost">
              {t('shopping.copy')}
            </Button>
          </View>

          {showCompletionBanner && (
            <Animated.View
              accessibilityLiveRegion="polite"
              style={[styles.completionBanner, { opacity: bannerOpacity }]}
            >
              <Text style={styles.completionBannerText}>{t('shopping.complete')}</Text>
            </Animated.View>
          )}

          <View style={styles.recipeCard}>
            <View style={styles.recipeThumbnail}>
              <Text style={styles.recipeThumbnailIcon}>🍽️</Text>
            </View>
            <View style={styles.recipeInfo}>
              <Text numberOfLines={2} style={styles.recipeName}>
                {dishName}
              </Text>
              <Text style={styles.recipeMeta}>
                {servings} {t('recipe.servings').toLowerCase()}{cookTime ? ` • ${formatTime(Number(cookTime))}` : ''}
              </Text>
            </View>
          </View>

          {owned.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderIcon}>✓</Text>
                <Text accessibilityRole="header" style={styles.ownedSectionTitle}>
                  {t('shopping.ownedItems')}
                </Text>
              </View>
              {owned.map((name) => (
                <View key={name} style={styles.checkboxRow}>
                  <Pressable
                    accessibilityLabel={`${name}, ${t('shopping.ownedItems')}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: true, disabled: true }}
                    style={styles.checkboxTouchable}
                  >
                    <View style={[styles.checkbox, styles.checkboxChecked]}>
                      <Text style={styles.checkboxCheckmark}>✓</Text>
                    </View>
                  </Pressable>
                  <Text style={styles.itemChecked}>
                    {name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {missing.length > 0 && (
            <View style={styles.section}>
              <Text accessibilityRole="header" style={styles.missingSectionTitle}>
                {t('shopping.missingItems')}
              </Text>
              {missing.map((name) => {
                const checked = checkedState[name];
                return (
                  <Pressable
                    key={name}
                    accessibilityLabel={`${name}, ${checked ? t('state.success') : t('shopping.missingItems')}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    hitSlop={4}
                    onPress={() => handleToggle(name)}
                    style={styles.checkboxRow}
                  >
                    <View style={[styles.checkbox, checked ? styles.checkboxChecked : styles.checkboxUnchecked]}>
                      {checked && <Text style={styles.checkboxCheckmark}>✓</Text>}
                    </View>
                    <View style={styles.itemContent}>
                      <Text style={[
                        styles.itemText,
                        checked ? styles.itemCheckedStyle : styles.itemMissingStyle,
                      ]}>
                        {name}
                      </Text>
                      {!checked && <Text style={styles.missingWarning}>⚠️</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.tipSection}>
            <TipCard content={t('shopping.tip')} title={t('shopping.tipLabel')} />
          </View>

          <View style={styles.actionsSection}>
            <Button fullWidth onPress={handleSave} variant="primary">
              {t('shopping.save')}
            </Button>
            <Button fullWidth onPress={handleShare} variant="secondary">
              {t('shopping.share')}
            </Button>
          </View>
        </View>
      </ScrollView>

      {renderToasts(toasts, dismissToast)}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: oklchToRgba(Colors.bg),
  },
  skipLink: {
    position: 'absolute',
    top: -100,
    left: Spacing.md,
    zIndex: 100,
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
  scrollContent: {
    paddingBottom: Spacing.xl2,
  },
  content: {
    position: 'relative',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: oklchToRgba(Colors.surface),
    borderWidth: 1,
    borderColor: oklchToRgba(Colors.border),
  },
  backButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: oklchToRgba(Colors.fg),
  },
  copyButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  copyButtonText: {
    fontFamily: Typography.button.family,
    fontSize: Typography.button.fontSize,
    fontWeight: Typography.button.fontWeight,
    lineHeight: Typography.button.lineHeight,
    color: oklchToRgba(Colors.muted),
  },
  completionBanner: {
    backgroundColor: oklchToRgba(Colors.accent),
    paddingHorizontal: Spacing.gap,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  completionBannerText: {
    fontFamily: Typography.button.family,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: Typography.button.lineHeight,
    color: oklchToRgba(Colors.surface),
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    padding: Spacing.gap,
    backgroundColor: oklchToRgba(Colors.surface),
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: oklchToRgba(Colors.border),
    gap: Spacing.gap,
  },
  recipeThumbnail: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: oklchToRgba(Colors.border),
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeThumbnailIcon: {
    fontSize: 24,
    lineHeight: 24,
  },
  recipeInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  recipeName: {
    fontFamily: Typography.cardTitle.family,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
    color: oklchToRgba(Colors.fg),
  },
  recipeMeta: {
    fontFamily: Typography.meta.family,
    fontSize: Typography.meta.fontSize,
    fontWeight: Typography.meta.fontWeight,
    lineHeight: Typography.meta.lineHeight,
    color: oklchToRgba(Colors.muted),
  },
  section: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionHeaderIcon: {
    fontSize: 16,
    lineHeight: 16,
    color: oklchToRgba(Colors.success),
  },
  ownedSectionTitle: {
    fontFamily: Typography.sectionTitle.family,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: Typography.sectionTitle.lineHeight,
    color: oklchToRgba(Colors.fg),
  },
  missingSectionTitle: {
    fontFamily: Typography.sectionTitle.family,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: Typography.sectionTitle.lineHeight,
    color: oklchToRgba(Colors.accentStrong),
    marginBottom: Spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.gap,
    minHeight: 44,
    paddingVertical: Spacing.xs,
  },
  checkboxTouchable: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.xs,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxUnchecked: {
    borderColor: oklchToRgba(Colors.border),
  },
  checkboxChecked: {
    borderColor: oklchToRgba(Colors.accent),
    backgroundColor: oklchToRgba(Colors.accent),
  },
  checkboxCheckmark: {
    fontSize: 14,
    lineHeight: 14,
    color: oklchToRgba(Colors.surface),
    fontWeight: '700',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  itemText: {
    flex: 1,
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    fontWeight: Typography.cardSubtitle.fontWeight,
    lineHeight: Typography.cardSubtitle.lineHeight,
  },
  itemCheckedStyle: {
    color: oklchToRgba(Colors.muted),
    textDecorationLine: 'line-through',
  },
  itemMissingStyle: {
    color: oklchToRgba(Colors.accentStrong),
  },
  itemChecked: {
    flex: 1,
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    fontWeight: Typography.cardSubtitle.fontWeight,
    lineHeight: Typography.cardSubtitle.lineHeight,
    color: oklchToRgba(Colors.muted),
    textDecorationLine: 'line-through',
  },
  missingWarning: {
    fontSize: 16,
    lineHeight: 16,
  },
  tipSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  actionsSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    gap: Spacing.gap,
  },
  skeletonContainer: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  skeletonHeader: {
    marginBottom: Spacing.sm,
  },
  skeletonTopBar: {
    height: 44,
    width: '100%',
    borderRadius: Radius.md,
  },
  skeletonRecipeCard: {
    height: 80,
    borderRadius: Radius.md,
  },
  skeletonSection: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  skeletonSectionHeader: {
    height: 22,
    width: '40%',
    borderRadius: Radius.sm,
  },
  skeletonItem: {
    height: 44,
    width: '100%',
    borderRadius: Radius.sm,
  },
});
