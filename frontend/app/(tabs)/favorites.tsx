import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDataStore } from '../../stores/dataStore';
import { useUIStore } from '../../stores/uiStore';
import { isApiBaseUrlConfigurationError } from '../../lib/env';
import { useNetworkStatus } from '../../lib/networkStatus';
import { useReducedMotion } from '../../lib/accessibility';
import { t } from '../../lib/i18n';
import { Colors, Radius, Spacing, Typography, Animation, oklchToRgba } from '../../lib/tokens';
import type { Favorite } from '../../types/dish';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { InputField } from '../../components/InputField';
import { Skeleton } from '../../components/Skeleton';
import { Toast } from '../../components/Toast';

const PAGE_SIZE = 20;

function SkeletonCard() {
  return (
    <View style={[styles.card, styles.skeletonCard]}>
      <Skeleton variant="text" style={styles.skeletonThumb} />
      <View style={styles.skeletonBody}>
        <Skeleton variant="text" style={styles.skeletonName} />
        <Skeleton variant="text" style={styles.skeletonMeta} />
        <View style={styles.skeletonChips}>
          <Skeleton variant="text" style={styles.skeletonChip} />
        </View>
      </View>
    </View>
  );
}

function NoFavoritesEmptyState() {
  const router = useRouter();
  return (
    <EmptyState
      ctaLabel={t('favorites.empty.cta')}
      description={t('favorites.empty.body')}
      icon="♡"
      onCtaPress={() => router.push('/(tabs)/discover')}
      title={t('favorites.empty.title')}
    />
  );
}

function NoSearchEmptyState() {
  return (
    <EmptyState
      description={t('favorites.search.hint')}
      icon="🔍"
      title={t('favorites.search.empty')}
    />
  );
}

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { isOnline } = useNetworkStatus();
  const addToast = useUIStore((s) => s.addToast);
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);
  const favorites = useDataStore((s) => s.favorites);
  const favoritesStatus = useDataStore((s) => s.favoritesStatus);
  const favoritesTotal = useDataStore((s) => s.favoritesTotal);
  const fetchFavorites = useDataStore((s) => s.fetchFavorites);
  const removeFavorite = useDataStore((s) => s.removeFavorite);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleConfigError = useCallback((error: unknown) => {
    if (isApiBaseUrlConfigurationError(error)) {
      addToast(error.message, 'error');
      return true;
    }
    return false;
  }, [addToast]);

  useFocusEffect(
    useCallback(() => {
      void fetchFavorites({ offset: 0, limit: PAGE_SIZE }).catch((error) => {
        handleConfigError(error);
      });
    }, [fetchFavorites, handleConfigError]),
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const filteredFavorites = useMemo(() => {
    const sorted = [...favorites].sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
    );
    if (!debouncedQuery) return sorted;
    const q = debouncedQuery.toLowerCase().trim();
    if (q.length === 0) return sorted;
    return sorted.filter(
      (f) =>
        f.dishData.name.toLowerCase().includes(q) ||
        (f.dishData.nameEn && f.dishData.nameEn.toLowerCase().includes(q)) ||
        (f.dishData.cuisine && f.dishData.cuisine.toLowerCase().includes(q)),
    );
  }, [favorites, debouncedQuery]);

  const handleEndReached = useCallback(() => {
    const total = typeof favoritesTotal === 'number' && !Number.isNaN(favoritesTotal) ? favoritesTotal : Infinity;
    if (favoritesStatus === 'loading' || favorites.length >= total) return;
    void fetchFavorites({ offset: favorites.length, limit: PAGE_SIZE }).catch((error) => {
      handleConfigError(error);
    });
  }, [favoritesStatus, favorites.length, favoritesTotal, fetchFavorites, handleConfigError]);

  const handleRemove = useCallback(
    async (dishId: string) => {
      try {
        await removeFavorite(dishId);
        addToast(t('favorites.remove.toast'), 'success');
      } catch (error) {
        if (handleConfigError(error)) {
          return;
        }
        addToast(t('state.error.generic'), 'error');
      }
    },
    [removeFavorite, addToast, handleConfigError],
  );

  const handleRetry = useCallback(() => {
    void fetchFavorites({ offset: 0, limit: PAGE_SIZE }).catch((error) => {
      handleConfigError(error);
    });
  }, [fetchFavorites, handleConfigError]);

  const renderFooter = useCallback(() => {
    if (favoritesStatus === 'loading' && favorites.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={oklchToRgba(Colors.accent)} />
        </View>
      );
    }
    return null;
  }, [favoritesStatus, favorites.length]);

  const renderEmpty = useCallback(() => {
    if (favoritesStatus === 'loading') return null;
    const trimmed = debouncedQuery.trim();
    if (trimmed.length > 0) return <NoSearchEmptyState />;
    return <NoFavoritesEmptyState />;
  }, [favoritesStatus, debouncedQuery]);

  const renderSkeletons = useCallback(() => (
    <View style={styles.skeletonContainer}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  ), []);

  const renderItem = useCallback(
    ({ item }: { item: Favorite }) => {
      const { dishData, dishId, savedAt } = item;
      const savedTime = new Date(savedAt).getTime();
      const updatedTime = dishData.updatedAt ? new Date(dishData.updatedAt).getTime() : NaN;
      const isStale = !Number.isNaN(savedTime) && !Number.isNaN(updatedTime) && updatedTime > savedTime;

      return (
        <FavoriteItemCard
          dishId={dishId}
          dishData={dishData}
          isStale={isStale}
          prefersReducedMotion={prefersReducedMotion}
          onNavigate={() =>
            router.push({ pathname: '/recipe/[id]', params: { id: dishId } })
          }
          onRemove={() => handleRemove(dishId)}
        />
      );
    },
    [prefersReducedMotion, router, handleRemove],
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
  }, []);

  useEffect(() => {
    if (favoritesStatus === 'error') {
      addToast(t('state.error.favorites'), 'error');
    }
  }, [favoritesStatus, addToast]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.screenTitle}>
            {t('favorites.title')}
          </Text>
        </View>

        {!isOnline && favorites.length > 0 ? (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>{t('state.offline')}</Text>
          </View>
        ) : null}

        <View style={styles.searchContainer}>
          <InputField
            accessibilityLabel={t('favorites.searchPlaceholder')}
            iconLeft={<Text style={styles.searchIcon}>🔍</Text>}
            iconRight={searchQuery.length > 0 ? (
              <Pressable
                accessibilityLabel="Xoá tìm kiếm"
                accessibilityRole="button"
                onPress={handleClearSearch}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </Pressable>
            ) : undefined}
            onChangeText={setSearchQuery}
            placeholder={t('favorites.searchPlaceholder')}
            value={searchQuery}
          />
        </View>

        <View style={styles.content}>
          {favoritesStatus === 'loading' && favorites.length === 0 ? (
            renderSkeletons()
          ) : favoritesStatus === 'error' ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{t('state.error.favorites')}</Text>
              <Button onPress={handleRetry} variant="primary">
                {t('state.error.retry')}
              </Button>
            </View>
          ) : (
            <FlatList
              contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(Spacing.xl2, insets.bottom + Spacing.md) }]}
              data={filteredFavorites}
              keyExtractor={(item) => item.dishId}
              ListEmptyComponent={renderEmpty}
              ListFooterComponent={renderFooter}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
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
    </View>
  );
}

type FavoriteItemCardProps = {
  dishId: string;
  dishData: {
    name: string;
    nameEn?: string;
    cookTimeMinutes?: number;
    caloriesPerServing?: number;
    cuisine?: string;
    tags?: string[];
    imageDescription?: string;
    updatedAt?: string;
  };
  isStale: boolean;
  prefersReducedMotion: boolean;
  onNavigate: () => void;
  onRemove: () => void;
};

function FavoriteItemCard({
  dishData,
  isStale,
  prefersReducedMotion,
  onNavigate,
  onRemove,
}: FavoriteItemCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [removing, setRemoving] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleRemove = useCallback(() => {
    if (removing) return;
    setRemoving(true);
    const duration = Animation.resolveDuration(200, prefersReducedMotion);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        duration,
        toValue: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        duration,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (mountedRef.current) {
        onRemove();
      }
    });
  }, [removing, prefersReducedMotion, scaleAnim, opacityAnim, onRemove]);

  const cuisineChips = useMemo(() => {
    if (!dishData.cuisine) return null;
    return dishData.cuisine.split(',').map((c) => c.trim()).filter(Boolean);
  }, [dishData.cuisine]);

  return (
    <Animated.View
      style={[
        styles.card,
        { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {isStale ? (
        <Pressable
          accessibilityLabel={t('favorites.stale.badge')}
          accessibilityRole="button"
          onPress={onNavigate}
          style={styles.staleBadge}
        >
          <Text style={styles.staleBadgeText}>{t('favorites.stale.badge')}</Text>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onNavigate}
        style={styles.cardContent}
      >
        <View style={styles.cardThumb}>
          <Text style={styles.thumbIcon}>🍽️</Text>
        </View>

        <View style={styles.cardInfo}>
          <Text numberOfLines={1} style={styles.cardTitle}>
            {dishData.name}
          </Text>

          <View style={styles.cardMeta}>
            {dishData.cookTimeMinutes ? (
              <Text style={styles.cardMetaText}>
                {dishData.cookTimeMinutes}p
              </Text>
            ) : null}
            {dishData.caloriesPerServing ? (
              <Text style={styles.cardMetaText}>
                {dishData.caloriesPerServing} kcal
              </Text>
            ) : null}
          </View>

          {cuisineChips ? (
            <View style={styles.cuisineRow}>
              {cuisineChips.map((c) => (
                <View key={c} style={styles.cuisineChip}>
                  <Text style={styles.cuisineChipText}>{c}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Pressable>

      <Pressable
        accessibilityLabel={`Xóa ${dishData.name} khỏi yêu thích`}
        accessibilityRole="button"
        disabled={removing}
        onPress={handleRemove}
        style={styles.removeButton}
      >
        <Text style={styles.removeIcon}>♥</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: oklchToRgba(Colors.bg),
  },
  container: {
    flex: 1,
    maxWidth: Platform.OS === 'web' ? 1200 : Spacing.screenMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: Spacing.md2,
    paddingVertical: Spacing.md,
  },
  screenTitle: {
    fontFamily: Typography.screenTitle.family,
    fontSize: Typography.screenTitle.fontSize,
    fontWeight: Typography.screenTitle.fontWeight,
    lineHeight: Typography.screenTitle.lineHeight,
    color: oklchToRgba(Colors.fg),
    letterSpacing: Typography.screenTitle.letterSpacing,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md2,
    paddingBottom: Spacing.md,
  },
  searchIcon: {
    fontSize: 18,
  },
  clearButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: oklchToRgba(Colors.muted),
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.md2,
    gap: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: oklchToRgba(Colors.surface),
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'visible',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardThumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    backgroundColor: oklchToRgba(Colors.border),
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  cardTitle: {
    fontFamily: Typography.cardTitle.family,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: Typography.cardTitle.fontWeight,
    lineHeight: Typography.cardTitle.lineHeight,
    color: oklchToRgba(Colors.fg),
  },
  cardMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cardMetaText: {
    fontFamily: Typography.meta.family,
    fontSize: Typography.meta.fontSize,
    fontWeight: Typography.meta.fontWeight,
    lineHeight: Typography.meta.lineHeight,
    color: oklchToRgba(Colors.muted),
  },
  cuisineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  cuisineChip: {
    backgroundColor: oklchToRgba(Colors.accentDim),
    borderRadius: Radius.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs2,
  },
  cuisineChipText: {
    fontFamily: Typography.chipLabel.family,
    fontSize: Typography.chipLabel.fontSize,
    fontWeight: Typography.chipLabel.fontWeight,
    lineHeight: Typography.chipLabel.lineHeight,
    color: oklchToRgba(Colors.accent),
  },
  removeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    fontSize: 22,
    color: oklchToRgba(Colors.danger),
  },
  staleBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: oklchToRgba(Colors.accent),
    borderRadius: Radius.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs2,
    zIndex: 10,
  },
  staleBadgeText: {
    fontFamily: Typography.badge.family,
    fontSize: Typography.badge.fontSize,
    fontWeight: Typography.badge.fontWeight,
    lineHeight: Typography.badge.lineHeight,
    color: oklchToRgba(Colors.surface),
  },
  footerLoader: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  skeletonContainer: {
    padding: Spacing.md2,
    gap: Spacing.sm,
  },
  skeletonCard: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  skeletonThumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
  },
  skeletonBody: {
    flex: 1,
    gap: Spacing.xs,
  },
  skeletonName: {
    height: 21,
    width: '60%',
    borderRadius: Radius.sm,
  },
  skeletonMeta: {
    height: 17,
    width: '35%',
    borderRadius: Radius.sm,
  },
  skeletonChips: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  skeletonChip: {
    height: 17,
    width: 50,
    borderRadius: Radius.xs,
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
  offlineBanner: {
    backgroundColor: oklchToRgba(Colors.warn),
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  offlineBannerText: {
    fontFamily: Typography.meta.family,
    fontSize: Typography.meta.fontSize,
    color: oklchToRgba(Colors.surface),
    fontWeight: '600',
  },
});
