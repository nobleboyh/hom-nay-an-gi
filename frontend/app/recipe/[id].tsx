import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';

import { Button, EmptyState, ServingAdjuster, Skeleton, Timeline, Toast } from '../../components';
import type { TimelineStep } from '../../components/Timeline';
import { formatTime } from '../../lib/formatTime';
import { isApiBaseUrlConfigurationError } from '../../lib/env';
import { t } from '../../lib/i18n';
import { useNetworkStatus } from '../../lib/networkStatus';
import { Colors, Radius, Spacing, Typography, oklchToRgba } from '../../lib/tokens';
import { useDataStore } from '../../stores/dataStore';
import { useUIStore } from '../../stores/uiStore';
import type { RecipeIngredient } from '../../types/dish';
import type { ToastProps } from '../../components/Toast';

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

const DEFAULT_SERVINGS = 2;
const MIN_SERVINGS = 1;
const MAX_SERVINGS = 10;

function isIngredientOwned(recipeName: string, userIngredients: string[]): boolean {
  const normalized = recipeName.toLowerCase();
  return userIngredients.some((u) => normalized.includes(u.toLowerCase()));
}

function adjustQuantity(baseQuantity: number, baseServings: number, newServings: number): number {
  if (baseServings <= 0 || newServings <= 0) return baseQuantity;
  const adjusted = (baseQuantity * newServings) / baseServings;
  const rounded = Math.round(adjusted * 10) / 10;
  return Number.isInteger(rounded) ? Math.round(rounded) : rounded;
}

function formatQuantity(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function ServingAdjusterSkeleton() {
  return (
    <View style={styles.skeletonRow}>
      <Skeleton variant="circle" style={styles.skeletonCircle} />
      <Skeleton variant="text" style={styles.skeletonPill} />
      <Skeleton variant="circle" style={styles.skeletonCircle} />
    </View>
  );
}

function InfoRowSkeleton() {
  return (
    <View style={styles.skeletonInfoRow}>
      <Skeleton variant="text" style={styles.skeletonInfoItem} />
      <Skeleton variant="text" style={styles.skeletonInfoItem} />
    </View>
  );
}

function IngredientBarSkeleton() {
  return (
    <View style={styles.skeletonIngredientRow}>
      <Skeleton variant="circle" style={styles.skeletonIngredientIcon} />
      <Skeleton variant="text" style={styles.skeletonIngredientText} />
    </View>
  );
}

function RecipeSkeleton() {
  return (
    <ScrollView style={styles.skeletonContainer}>
      <Skeleton variant="card" style={styles.skeletonHero} />
      <View style={styles.skeletonBody}>
        <Skeleton variant="text" style={styles.skeletonTitle} />
        <InfoRowSkeleton />
        <ServingAdjusterSkeleton />
        <View style={styles.skeletonSection}>
          <Skeleton variant="text" style={styles.skeletonSectionHeader} />
          <IngredientBarSkeleton />
          <IngredientBarSkeleton />
          <IngredientBarSkeleton />
        </View>
        <View style={styles.skeletonSection}>
          <Skeleton variant="text" style={styles.skeletonSectionHeader} />
          <IngredientBarSkeleton />
          <IngredientBarSkeleton />
        </View>
      </View>
    </ScrollView>
  );
}

export default function RecipeDetailScreen() {
  const { id, ingredients } = useLocalSearchParams<{ id: string; ingredients?: string }>();
  const { isOnline } = useNetworkStatus();

  const recipeDetail = useDataStore((s) => s.recipeDetail);
  const recipeStatus = useDataStore((s) => s.recipeStatus);
  const favorites = useDataStore((s) => s.favorites);
  const fetchRecipeDetail = useDataStore((s) => s.fetchRecipeDetail);
  const saveFavorite = useDataStore((s) => s.saveFavorite);
  const removeFavorite = useDataStore((s) => s.removeFavorite);
  const dishes = useDataStore((s) => s.dishes);
  const addToast = useUIStore((s) => s.addToast);
  const dismissToast = useUIStore((s) => s.dismissToast);
  const toasts = useUIStore((s) => s.toasts);

  const [servings, setServings] = useState(DEFAULT_SERVINGS);

  useEffect(() => {
    if (id) {
      void fetchRecipeDetail(id).catch((error) => {
        if (isApiBaseUrlConfigurationError(error)) {
          addToast(error.message, 'error');
          return;
        }
        addToast(t('state.error.recipe'), 'error');
      });
    }
  }, [id, fetchRecipeDetail, addToast]);

  const offlineToastShown = useRef(false);
  const prevRecipeStatus = useRef(recipeStatus);

  useEffect(() => {
    if (!isOnline && recipeDetail && !offlineToastShown.current) {
      offlineToastShown.current = true;
      addToast(t('state.offline'), 'info');
    }
    if (isOnline) {
      offlineToastShown.current = false;
    }
  }, [isOnline, recipeDetail, addToast]);

  useEffect(() => {
    if (prevRecipeStatus.current !== 'error' && recipeStatus === 'error' && !recipeDetail) {
      addToast(t('state.error.recipe'), 'error');
    }
    prevRecipeStatus.current = recipeStatus;
  }, [recipeStatus, recipeDetail, addToast]);

  const userIngredients = useMemo(() => {
    if (!ingredients) return [];
    return ingredients.split(',').map((s) => s.trim()).filter(Boolean);
  }, [ingredients]);

  const isSaved = useMemo(
    () => favorites.some((f) => f.dishId === id),
    [favorites, id],
  );

  const ownedIngredients = useMemo<RecipeIngredient[]>(() => {
    if (!recipeDetail?.ingredients) return [];
    return recipeDetail.ingredients.filter((ing) =>
      isIngredientOwned(ing.name, userIngredients),
    );
  }, [recipeDetail, userIngredients]);

  const missingIngredients = useMemo<RecipeIngredient[]>(() => {
    if (!recipeDetail?.ingredients) return [];
    return recipeDetail.ingredients.filter(
      (ing) => !isIngredientOwned(ing.name, userIngredients),
    );
  }, [recipeDetail, userIngredients]);

  const adjustedOwned = useMemo(
    () =>
      ownedIngredients.map((ing) => ({
        ...ing,
        adjustedQuantity: adjustQuantity(ing.quantity, DEFAULT_SERVINGS, servings),
      })),
    [ownedIngredients, servings],
  );

  const adjustedMissing = useMemo(
    () =>
      missingIngredients.map((ing) => ({
        ...ing,
        adjustedQuantity: adjustQuantity(ing.quantity, DEFAULT_SERVINGS, servings),
      })),
    [missingIngredients, servings],
  );

  const adjustedCalories = useMemo(() => {
    if (!recipeDetail?.caloriesPerServing) return 0;
    return Math.round(
      (recipeDetail.caloriesPerServing * servings) / DEFAULT_SERVINGS,
    );
  }, [recipeDetail, servings]);

  const timelineSteps = useMemo<TimelineStep[]>(() => {
    if (!recipeDetail?.steps) return [];
    return recipeDetail.steps.map((step) => ({
      label: step.label,
      duration: formatTime(step.durationMinutes),
      parallelGroup: step.parallelGroup,
    }));
  }, [recipeDetail]);

  const handleServingsChange = useCallback((value: number) => {
    setServings(value);
  }, []);

  const handleSaveToggle = useCallback(async () => {
    if (!recipeDetail) return;
    const dish = dishes.find(
      (d) => d.dishId === recipeDetail.dishId || d.id === recipeDetail.dishId,
    );
    if (!dish) return;

    try {
      if (isSaved) {
        const ok = await removeFavorite(recipeDetail.dishId);
        if (!ok) {
          addToast(t('state.error.generic'), 'error');
        }
      } else {
        const ok = await saveFavorite(dish);
        if (ok) {
          addToast(t('recipe.saveSuccess'), 'success');
        } else {
          addToast(t('state.error.generic'), 'error');
        }
      }
    } catch (error) {
      if (isApiBaseUrlConfigurationError(error)) {
        addToast(error.message, 'error');
        return;
      }
      addToast(t('state.error.generic'), 'error');
    }
  }, [recipeDetail, dishes, isSaved, removeFavorite, saveFavorite, addToast]);

  const handleShoppingList = useCallback(() => {
    if (!recipeDetail) return;
    router.push({
      pathname: '/shopping-list',
      params: {
        dishId: recipeDetail.dishId,
        dishName: recipeDetail.name,
        owned: ownedIngredients.map((i) => i.name).join(','),
        missing: missingIngredients.map((i) => i.name).join(','),
        servings: servings.toString(),
        cookTime: recipeDetail.totalCookTimeMinutes.toString(),
      },
    });
  }, [recipeDetail, ownedIngredients, missingIngredients, servings]);

  const handleCopyRecipe = useCallback(async () => {
    if (!recipeDetail) return;
    const lines: string[] = [];
    lines.push(`📋 ${recipeDetail.name}`);
    lines.push(
      `⏱ ${formatTime(recipeDetail.totalCookTimeMinutes)} | 🔥 ${recipeDetail.caloriesPerServing} cal/phần`,
    );
    lines.push('');
    lines.push(t('recipe.ingredients') + ':');
    for (const ing of recipeDetail.ingredients) {
      const qty = adjustQuantity(ing.quantity, DEFAULT_SERVINGS, servings);
      lines.push(`• ${ing.name} — ${formatQuantity(qty)} ${ing.unit}`);
    }
    lines.push('');
    lines.push(t('recipe.steps') + ':');
    recipeDetail.steps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step.label} (${formatTime(step.durationMinutes)})`);
    });

    try {
      await Clipboard.setStringAsync(lines.join('\n'));
      addToast(t('recipe.copySuccess'), 'success');
    } catch {
      addToast(t('state.error.generic'), 'error');
    }
  }, [recipeDetail, servings, addToast]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  if (recipeStatus === 'loading' && !recipeDetail) {
    return (
      <SafeAreaView style={styles.screen}>
        <RecipeSkeleton />
        {renderToasts(toasts, dismissToast)}
      </SafeAreaView>
    );
  }

  if (recipeStatus === 'error' && !recipeDetail) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerContainer}>
          <EmptyState
            icon="😕"
            title={t('recipe.notFound')}
            description=""
            ctaLabel={t('aria.back')}
            onCtaPress={handleBack}
          />
        </View>
        {renderToasts(toasts, dismissToast)}
      </SafeAreaView>
    );
  }

  if (!recipeDetail || recipeStatus === 'empty') {
    return (
      <SafeAreaView style={styles.screen}>
        <EmptyState
          icon="🍽️"
          title={t('recipe.notFound')}
          description=""
          ctaLabel={t('aria.back')}
          onCtaPress={handleBack}
        />
        {renderToasts(toasts, dismissToast)}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} accessibilityLabel={recipeDetail.name}>
      <Pressable
        accessibilityRole="link"
        onPress={() => {
          if (Platform.OS === 'web') {
            const el = document.getElementById('recipe-content');
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
        <View {...(Platform.OS === 'web' ? { id: 'recipe-content', role: 'main' as const } : {})} style={styles.content}>
          <Pressable
            accessibilityLabel={t('aria.back')}
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleBack}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <View style={styles.heroImage} accessibilityLabel={recipeDetail.imageDescription} accessibilityRole="image" />

          <View style={styles.headerSection}>
            <Text accessibilityRole="header" style={styles.dishName}>
              {recipeDetail.name}
            </Text>

            <View style={styles.infoRow}>
              <View style={styles.infoChip}>
                <Text style={styles.infoIcon}>⏱</Text>
                <Text style={styles.infoText}>{formatTime(recipeDetail.totalCookTimeMinutes)}</Text>
              </View>
              <View style={styles.infoChip}>
                <Text style={styles.infoIcon}>🔥</Text>
                <Text style={styles.infoText}>{adjustedCalories}</Text>
                <View style={styles.estimatedBadge}>
                  <Text style={styles.estimatedText}>{t('recipe.estimated')}</Text>
                </View>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={styles.cuisineRow}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {recipeDetail.tags.map((tag) => (
                <View key={tag} style={styles.cuisineChip}>
                  <Text style={styles.cuisineChipText}>{tag}</Text>
                </View>
              ))}
            </ScrollView>

            <Pressable
              accessibilityLabel={isSaved ? t('aria.removeFavorite') : t('aria.saveFavorite')}
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleSaveToggle}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>{isSaved ? '♥' : '♡'}</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionHeader}>
              {t('recipe.servings')}
            </Text>
            <ServingAdjuster
              max={MAX_SERVINGS}
              min={MIN_SERVINGS}
              onChange={handleServingsChange}
              style={styles.servingAdjuster}
              value={servings}
            />
          </View>

          {recipeDetail.ingredients.length > 0 && (
            <View style={styles.section}>
              <Text accessibilityRole="header" style={styles.sectionHeader}>
                {t('recipe.ingredients')}
              </Text>

              {ownedIngredients.length > 0 && (
                <View style={styles.ingredientGroup}>
                  {adjustedOwned.map((ing) => (
                    <View key={ing.name} style={styles.ingredientRow}>
                      <Text style={styles.ownedIcon}>✓</Text>
                      <Text style={styles.ingredientOwned}>
                        {ing.name}
                      </Text>
                      <Text style={styles.ingredientQuantity}>
                        {formatQuantity(ing.adjustedQuantity)} {ing.unit}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {missingIngredients.length > 0 && (
                <View style={styles.ingredientGroup}>
                  <Text style={styles.ingredientSubheader}>
                    {t('recipe.missingIngredients')}
                  </Text>
                  {adjustedMissing.map((ing) => (
                    <View key={ing.name} style={styles.ingredientRow}>
                      <Text style={styles.missingIcon}>⚠️</Text>
                      <Text style={styles.ingredientMissing}>
                        {ing.name}
                      </Text>
                      <Text style={styles.ingredientQuantityMissing}>
                        {formatQuantity(ing.adjustedQuantity)} {ing.unit}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {recipeDetail.steps.length > 0 && (
            <View style={styles.section}>
              <Text accessibilityRole="header" style={styles.sectionHeader}>
                {t('recipe.steps')}
              </Text>
              <Timeline steps={timelineSteps} />
            </View>
          )}

          <View style={styles.actionsSection}>
            <Button fullWidth onPress={handleShoppingList} variant="primary">
              {t('recipe.shoppingList')}
            </Button>
            <Button fullWidth onPress={handleCopyRecipe} variant="secondary">
              {t('recipe.copy')}
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: oklchToRgba(Colors.surface),
    borderBottomWidth: 1,
    borderBottomColor: oklchToRgba(Colors.border),
  },
  headerSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  dishName: {
    fontFamily: Typography.screenTitle.family,
    fontSize: Typography.screenTitle.fontSize,
    fontWeight: Typography.screenTitle.fontWeight,
    lineHeight: Typography.screenTitle.lineHeight,
    color: oklchToRgba(Colors.fg),
    letterSpacing: Typography.screenTitle.letterSpacing,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.gap,
    marginTop: Spacing.gap,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  infoIcon: {
    fontSize: 16,
    lineHeight: 16,
  },
  infoText: {
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    fontWeight: '600',
    lineHeight: Typography.cardSubtitle.lineHeight,
    color: oklchToRgba(Colors.fg),
  },
  estimatedBadge: {
    borderWidth: 1,
    borderColor: oklchToRgba(Colors.border),
    borderRadius: Radius.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
  },
  estimatedText: {
    fontFamily: Typography.micro.family,
    fontSize: Typography.micro.fontSize,
    fontWeight: Typography.micro.fontWeight,
    lineHeight: Typography.micro.lineHeight,
    color: oklchToRgba(Colors.muted),
  },
  cuisineRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.gap,
  },
  cuisineChip: {
    backgroundColor: oklchToRgba(Colors.accentDim),
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.gap,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: oklchToRgba(Colors.accent),
  },
  cuisineChipText: {
    fontFamily: Typography.chipLabel.family,
    fontSize: Typography.chipLabel.fontSize,
    fontWeight: Typography.chipLabel.fontWeight,
    lineHeight: Typography.chipLabel.lineHeight,
    color: oklchToRgba(Colors.accentStrong),
  },
  saveButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: oklchToRgba(Colors.surface),
    borderWidth: 1,
    borderColor: oklchToRgba(Colors.border),
  },
  saveButtonText: {
    fontSize: 22,
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  sectionHeader: {
    fontFamily: Typography.sectionTitle.family,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    lineHeight: Typography.sectionTitle.lineHeight,
    color: oklchToRgba(Colors.fg),
    marginBottom: Spacing.gap,
  },
  servingAdjuster: {
    marginTop: Spacing.xs,
  },
  ingredientGroup: {
    gap: Spacing.sm,
  },
  ingredientSubheader: {
    fontFamily: Typography.meta.family,
    fontSize: Typography.meta.fontSize,
    fontWeight: '600',
    lineHeight: Typography.meta.lineHeight,
    color: oklchToRgba(Colors.accentStrong),
    marginBottom: Spacing.xs,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 44,
  },
  ownedIcon: {
    fontSize: 14,
    lineHeight: 14,
    color: oklchToRgba(Colors.success),
    width: 20,
    textAlign: 'center',
  },
  missingIcon: {
    fontSize: 14,
    lineHeight: 14,
    width: 20,
    textAlign: 'center',
  },
  ingredientOwned: {
    flex: 1,
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    fontWeight: Typography.cardSubtitle.fontWeight,
    lineHeight: Typography.cardSubtitle.lineHeight,
    color: oklchToRgba(Colors.fg),
  },
  ingredientMissing: {
    flex: 1,
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    fontWeight: Typography.cardSubtitle.fontWeight,
    lineHeight: Typography.cardSubtitle.lineHeight,
    color: oklchToRgba(Colors.accentStrong),
  },
  ingredientQuantity: {
    fontFamily: Typography.meta.family,
    fontSize: Typography.meta.fontSize,
    fontWeight: Typography.meta.fontWeight,
    lineHeight: Typography.meta.lineHeight,
    color: oklchToRgba(Colors.muted),
  },
  ingredientQuantityMissing: {
    fontFamily: Typography.meta.family,
    fontSize: Typography.meta.fontSize,
    fontWeight: Typography.meta.fontWeight,
    lineHeight: Typography.meta.lineHeight,
    color: oklchToRgba(Colors.accentStrong),
  },
  actionsSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    gap: Spacing.gap,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: oklchToRgba(Colors.surface),
    borderWidth: 1,
    borderColor: oklchToRgba(Colors.border),
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: oklchToRgba(Colors.fg),
  },
  skeletonContainer: {
    flex: 1,
  },
  skeletonBody: {
    padding: Spacing.md,
    gap: Spacing.gap,
  },
  skeletonHero: {
    height: undefined,
    aspectRatio: 16 / 9,
    borderRadius: 0,
  },
  skeletonTitle: {
    height: 29,
    width: '80%',
    borderRadius: Radius.sm,
  },
  skeletonInfoRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  skeletonInfoItem: {
    height: 20,
    width: 100,
    borderRadius: Radius.sm,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  skeletonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  skeletonPill: {
    height: 44,
    width: 80,
    borderRadius: Radius.md,
  },
  skeletonSection: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  skeletonSectionHeader: {
    height: 22,
    width: '40%',
    borderRadius: Radius.sm,
  },
  skeletonIngredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  skeletonIngredientIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  skeletonIngredientText: {
    height: 20,
    width: '60%',
    borderRadius: Radius.sm,
  },
});
