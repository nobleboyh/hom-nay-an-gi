import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { ResultCard, SortDropdown, EmptyState, Skeleton, Toast, Button } from '../../components';
import type { ResultCardAction, ResultCardDish } from '../../components/ResultCard';
import type { SortKey, SortOption } from '../../components/SortDropdown';
import { t } from '../../lib/i18n';
import { useReducedMotion } from '../../lib/accessibility';
import { useNetworkStatus } from '../../lib/networkStatus';
import { useDataStore } from '../../stores/dataStore';
import { useUIStore } from '../../stores/uiStore';
import { Colors, Spacing, Radius, Typography, oklchToRgba } from '../../lib/tokens';
import type { Dish } from '../../types/dish';

const SORT_OPTIONS: SortOption[] = [
  { key: 'best_match', label: t('results.sort.bestMatch') },
  { key: 'lowest_cal', label: t('results.sort.lowestCalories') },
  { key: 'fastest', label: t('results.sort.fastest') },
  { key: 'dish_type', label: t('results.sort.dishType') },
];

function dishToResultCardDish(dish: Dish): ResultCardDish {
  return {
    dishId: dish.dishId,
    name: dish.name,
    matchPercentage: dish.matchPercentage,
    cuisineTags: [{ id: dish.cuisine, label: dish.cuisine }],
    cookTimeMinutes: dish.cookTimeMinutes,
    caloriesPerServing: dish.caloriesPerServing,
  };
}

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <Skeleton variant="text" style={styles.skeletonName} />
      <Skeleton variant="text" style={styles.skeletonMeta} />
    </View>
  );
}

export default function ResultsScreen() {
  const prefersReducedMotion = useReducedMotion();
  const { isOnline } = useNetworkStatus();

  const dishes = useDataStore((s) => s.dishes);
  const resultsStatus = useDataStore((s) => s.resultsStatus);
  const total = useDataStore((s) => s.total);
  const lastIngredients = useDataStore((s) => s.lastIngredients);
  const favorites = useDataStore((s) => s.favorites);
  const fetchDishes = useDataStore((s) => s.fetchDishes);
  const saveFavorite = useDataStore((s) => s.saveFavorite);
  const removeFavorite = useDataStore((s) => s.removeFavorite);
  const activeFilters = useUIStore((s) => s.activeFilters);

  const expandedCardId = useUIStore((s) => s.expandedCardId);
  const toggleCard = useUIStore((s) => s.toggleCard);
  const addToast = useUIStore((s) => s.addToast);
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  const [sortOption, setSortOption] = useState<SortKey>('best_match');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);

  const isSaved = useCallback(
    (dishId: string) => favorites.some((f) => f.dishId === dishId),
    [favorites],
  );

  const sortedDishes = useMemo(() => {
    const sorted = [...dishes].map(dishToResultCardDish);
    switch (sortOption) {
      case 'lowest_cal':
        sorted.sort((a, b) => a.caloriesPerServing - b.caloriesPerServing);
        break;
      case 'fastest':
        sorted.sort((a, b) => a.cookTimeMinutes - b.cookTimeMinutes);
        break;
      case 'dish_type':
        sorted.sort((a, b) => a.cuisineTags[0]?.label.localeCompare(b.cuisineTags[0]?.label ?? '') ?? 0);
        break;
      default:
        sorted.sort((a, b) => b.matchPercentage - a.matchPercentage);
        break;
    }
    return sorted;
  }, [dishes, sortOption]);

  const handleToggleCard = useCallback(
    (id: string) => {
      if (!prefersReducedMotion) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      toggleCard(id);
    },
    [prefersReducedMotion, toggleCard],
  );

  const handleSortChange = useCallback((key: SortKey) => {
    if (!prefersReducedMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setSortOption(key);
  }, [prefersReducedMotion]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);

    try {
      if (!isOnline) {
        addToast(t('results.offline'), 'info');
        return;
      }
      await fetchDishes(lastIngredients, activeFilters, 0);
    } catch {
      addToast(t('state.error.findDishes'), 'error');
    } finally {
      setIsRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, [isOnline, lastIngredients, activeFilters, fetchDishes, addToast]);

  const handleEndReached = useCallback(async () => {
    if (resultsStatus === 'loading' || total <= dishes.length) return;

    try {
      if (!isOnline) {
        addToast(t('results.offline'), 'info');
        return;
      }
      await fetchDishes(lastIngredients, activeFilters, dishes.length);
    } catch {
      addToast(t('state.error.findDishes'), 'error');
    }
  }, [resultsStatus, total, dishes.length, isOnline, lastIngredients, activeFilters, fetchDishes, addToast]);

  const handleSaveToggle = useCallback(
    async (dish: Dish) => {
      const saved = isSaved(dish.dishId);
      try {
        if (saved) {
          await removeFavorite(dish.dishId);
        } else {
          await saveFavorite(dish);
          addToast(t('results.saveSuccess'), 'success');
        }
      } catch {
        addToast(t('state.error.generic'), 'error');
      }
    },
    [isSaved, removeFavorite, saveFavorite, addToast],
  );

  const handleViewRecipe = useCallback(
    (dish: ResultCardDish, originalDish: Dish) => {
      router.push({
        pathname: '/recipe/[id]',
        params: {
          id: dish.dishId,
          ingredients: lastIngredients.join(','),
        },
      });
    },
    [lastIngredients],
  );

  const handleShopping = useCallback(
    (dish: Dish) => {
      router.push({
        pathname: '/shopping-list',
        params: {
          dishId: dish.dishId,
          dishName: dish.name,
          owned: lastIngredients.join(','),
          missing: '',
        },
      });
    },
    [lastIngredients],
  );

  const handleRetry = useCallback(async () => {
    try {
      await fetchDishes(lastIngredients, activeFilters, 0);
    } catch {
      addToast(t('state.error.findDishes'), 'error');
    }
  }, [lastIngredients, activeFilters, fetchDishes, addToast]);

  const renderItem = useCallback(
    ({ item }: { item: ResultCardDish }) => {
      const originalDish = dishes.find((d) => d.dishId === item.dishId);
      if (!originalDish) return null;

      const saved = isSaved(item.dishId);
      const actions: ResultCardAction[] = [
        { key: 'viewRecipe', label: t('results.viewRecipe'), onPress: () => handleViewRecipe(item, originalDish) },
        { key: 'shopping', label: t('results.shopping'), onPress: () => handleShopping(originalDish) },
        { key: 'save', label: saved ? '♥' : '♡', onPress: () => handleSaveToggle(originalDish), isSaved: saved, accessibilityLabel: saved ? t('aria.removeFavorite') : t('aria.saveFavorite') },
      ];

      return (
        <ResultCard
          actions={actions}
          cuisineTags={item.cuisineTags}
          dish={item}
          expanded={expandedCardId === item.dishId}
          onToggle={() => handleToggleCard(item.dishId)}
        />
      );
    },
    [dishes, expandedCardId, isSaved, handleToggleCard, handleViewRecipe, handleShopping, handleSaveToggle],
  );

  const renderFooter = () => {
    if (resultsStatus === 'loading' && sortedDishes.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={oklchToRgba(Colors.accent)} />
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (resultsStatus === 'loading') return null;
    return (
      <EmptyState
        icon="🍽️"
        title={t('results.empty')}
        description=""
        style={styles.emptyState}
      />
    );
  };

  const renderSkeletons = () => (
    <View style={styles.skeletonContainer}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const countLabel = t('results.count').replace('{count}', String(dishes.length));

  const webMainContentProps =
    Platform.OS === 'web'
      ? ({ id: 'main-content', tabIndex: -1, role: 'main' } as const)
      : {};

  return (
    <SafeAreaView style={styles.screen} accessibilityLabel={t('aria.resultsScreen')}>
      <Pressable
        accessibilityRole="link"
        onPress={() => {
          if (Platform.OS === 'web') {
            const el = document.getElementById('main-content');
            el?.focus();
          }
        }}
        style={styles.skipLink}
      >
        <Text style={styles.skipLinkText}>{t('home.skipNavigation')}</Text>
      </Pressable>

      <View style={styles.header}>
        <Pressable
          accessibilityLabel={t('aria.back')}
          accessibilityRole="button"
          onPress={handleBack}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.countText}>{countLabel}</Text>
        <SortDropdown
          options={SORT_OPTIONS}
          value={sortOption}
          onChange={handleSortChange}
        />
      </View>

      <View {...webMainContentProps} style={styles.content}>
        {resultsStatus === 'loading' && sortedDishes.length === 0 ? (
          renderSkeletons()
        ) : resultsStatus === 'error' ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{t('state.error.findDishes')}</Text>
            <Button onPress={handleRetry} variant="primary">{t('results.retry')}</Button>
          </View>
        ) : (
          <FlatList
            accessibilityLabel={t('aria.resultsList')}
            contentContainerStyle={styles.listContent}
            data={sortedDishes}
            keyExtractor={(item) => item.dishId}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                onRefresh={handleRefresh}
                refreshing={isRefreshing}
                tintColor={oklchToRgba(Colors.accent)}
              />
            }
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: oklchToRgba(Colors.border),
    backgroundColor: oklchToRgba(Colors.surface),
  },
  backButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  backButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: oklchToRgba(Colors.fg),
  },
  countText: {
    flex: 1,
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    fontWeight: Typography.cardSubtitle.fontWeight,
    color: oklchToRgba(Colors.muted),
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.xl2,
  },
  footerLoader: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  emptyState: {
    marginTop: Spacing.xl2,
  },
  skeletonContainer: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  skeletonCard: {
    backgroundColor: oklchToRgba(Colors.surface),
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  skeletonName: {
    height: 21,
    width: '70%',
    borderRadius: Radius.sm,
  },
  skeletonMeta: {
    height: 17,
    width: '40%',
    borderRadius: Radius.sm,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  errorText: {
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    color: oklchToRgba(Colors.muted),
    textAlign: 'center',
  },
});
