import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { ChipRow } from '../../components/ChipRow';
import { EmptyState } from '../../components/EmptyState';
import { LocationPicker, type LocationOption } from '../../components/LocationPicker';
import { RestaurantCard } from '../../components/RestaurantCard';
import { Skeleton } from '../../components/Skeleton';
import { createApiClient, type ApiError } from '../../lib/api';
import { Colors, Radius, Spacing, Typography, oklchToRgba } from '../../lib/tokens';

const apiClient = createApiClient({
  baseUrl: process.env.API_BASE_URL || 'http://localhost:8080',
  getToken: async () => null,
  onTokenExpired: async () => {},
  onUnauthenticated: () => {},
});

type NearbyItem = {
  restaurantName: string;
  dishName?: string;
  distance?: number;
  rating?: number;
  priceRange?: string;
  cuisine?: string;
  lat?: number;
  lng?: number;
  externalUrl?: string;
};

type TabId = 'tat-ca' | 'dang-thinh-hanh' | 'gan-toi' | 'mon-moi' | 'danh-gia-cao';

const TAB_ITEMS = [
  { id: 'tat-ca' as TabId, label: 'Tất cả' },
  { id: 'dang-thinh-hanh' as TabId, label: 'Đang thịnh hành' },
  { id: 'gan-toi' as TabId, label: 'Gần tôi' },
  { id: 'mon-moi' as TabId, label: 'Món mới' },
  { id: 'danh-gia-cao' as TabId, label: 'Đánh giá cao' },
];

const CUISINE_ITEMS = [
  { id: 'vietnam', label: '🇻🇳 Việt Nam' },
  { id: 'trung-hoa', label: '🇨🇳 Trung Hoa' },
  { id: 'y', label: '🇮🇹 Ý' },
  { id: 'nhat', label: '🇯🇵 Nhật' },
  { id: 'han', label: '🇰🇷 Hàn' },
];

const PRICE_ITEMS = [
  { id: 'duoi-50k', label: 'Dưới 50k' },
  { id: '50k-100k', label: '50k – 100k' },
  { id: '100k-200k', label: '100k – 200k' },
  { id: 'tren-200k', label: 'Trên 200k' },
];

const cuisineParamMap: Record<string, string> = {
  vietnam: 'Vietnamese',
  'trung-hoa': 'Chinese',
  y: 'Italian',
  nhat: 'Japanese',
  han: 'Korean',
};

const priceParamMap: Record<string, string> = {
  'duoi-50k': 'low',
  '50k-100k': 'mid',
  '100k-200k': 'high',
  'tren-200k': 'premium',
};

const DEFAULT_LAT = 10.8231;
const DEFAULT_LNG = 106.6297;
const DEFAULT_RADIUS = 5000;
const DEBOUNCE_MS = 500;

function useColumns() {
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web') return 1;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

export default function DiscoverScreen() {
  const columns = useColumns();
  const [selectedTab, setSelectedTab] = useState<TabId>('tat-ca');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);

  const [nearbyData, setNearbyData] = useState<NearbyItem[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(true);
  const [errorNearby, setErrorNearby] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    district: string;
  }>({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    district: 'Quận 1, TP. Hồ Chí Minh',
  });
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const webMainContentProps =
    Platform.OS === 'web'
      ? ({ id: 'main-content', tabIndex: -1 } as { id: string; tabIndex: number })
      : {};

  const getNearbyLimit = useCallback((): number => {
    if (selectedTab === 'dang-thinh-hanh') return 5;
    return 10;
  }, [selectedTab]);

  async function fetchNearby(
    lat: number,
    lng: number,
    cuisine?: string,
    price?: string,
    limit?: number,
  ) {
    try {
      setIsLoadingNearby(true);
      setErrorNearby(null);
      const params = new URLSearchParams();
      params.set('lat', String(lat));
      params.set('lng', String(lng));
      params.set('radius', String(DEFAULT_RADIUS));
      if (cuisine) params.set('cuisine', cuisine);
      if (price) params.set('price', price);
      if (limit != null) params.set('limit', String(limit));
      const res = await apiClient.get<NearbyItem[]>(
        `/api/v1/discovery/nearby?${params}`,
      );
      setNearbyData(res.data);
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorNearby(
        apiErr.message || 'Không thể tải nhà hàng gần đây',
      );
    } finally {
      setIsLoadingNearby(false);
    }
  }

  const fetchAll = useCallback(
    (cuisine?: string, price?: string) => {
      void fetchNearby(location.lat, location.lng, cuisine, price, getNearbyLimit());
    },
    [location.lat, location.lng, getNearbyLimit],
  );

  useEffect(() => {
    const activeCuisine =
      selectedCuisines.length > 0
        ? cuisineParamMap[selectedCuisines[0]]
        : undefined;
    const activePrice =
      selectedPrices.length > 0
        ? priceParamMap[selectedPrices[0]]
        : undefined;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchAll(activeCuisine, activePrice);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [selectedCuisines, selectedPrices, fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const activeCuisine =
      selectedCuisines.length > 0
        ? cuisineParamMap[selectedCuisines[0]]
        : undefined;
    const activePrice =
      selectedPrices.length > 0
        ? priceParamMap[selectedPrices[0]]
        : undefined;
    await fetchNearby(location.lat, location.lng, activeCuisine, activePrice, getNearbyLimit());
    setRefreshing(false);
  }, [selectedCuisines, selectedPrices, location, getNearbyLimit]);

  const showTrending =
    selectedTab === 'tat-ca' || selectedTab === 'dang-thinh-hanh';
  const showNearby =
    selectedTab === 'gan-toi' || selectedTab === 'tat-ca';

  async function handleGetLocation() {
    setIsLocating(true);
    try {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          setLocation((prev) => ({
            ...prev,
            district: 'Đang cập nhật vị trí...',
          }));
          return;
        }
        const activeCuisine = selectedCuisines.length > 0 ? cuisineParamMap[selectedCuisines[0]] : undefined;
        const activePrice = selectedPrices.length > 0 ? priceParamMap[selectedPrices[0]] : undefined;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              district: 'Vị trí hiện tại',
            });
            void fetchNearby(pos.coords.latitude, pos.coords.longitude, activeCuisine, activePrice, getNearbyLimit());
          },
          () => {
            setLocation((prev) => ({
              ...prev,
              district: 'Đang cập nhật vị trí...',
            }));
          },
          { enableHighAccuracy: true, timeout: 10000 },
        );
      } else {
        const { getCurrentPositionAsync } = await import(
          'expo-location'
        );
        const pos = await getCurrentPositionAsync({
          accuracy: 3,
        });
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          district: 'Vị trí hiện tại',
        });
        const activeCuisine = selectedCuisines.length > 0 ? cuisineParamMap[selectedCuisines[0]] : undefined;
        const activePrice = selectedPrices.length > 0 ? priceParamMap[selectedPrices[0]] : undefined;
        void fetchNearby(pos.coords.latitude, pos.coords.longitude, activeCuisine, activePrice, getNearbyLimit());
      }
    } catch {
      setLocation((prev) => ({
        ...prev,
        district: 'Đang cập nhật vị trí...',
      }));
    } finally {
      setIsLocating(false);
    }
  }

  function handleLocationSelected(option: LocationOption) {
    setShowLocationPicker(false);
    if (option.label.includes('Vị trí hiện tại')) {
      void handleGetLocation();
      return;
    }
    setLocation({
      lat: option.lat,
      lng: option.lng,
      district: option.label,
    });
    const activeCuisine = selectedCuisines.length > 0 ? cuisineParamMap[selectedCuisines[0]] : undefined;
    const activePrice = selectedPrices.length > 0 ? priceParamMap[selectedPrices[0]] : undefined;
    void fetchNearby(option.lat, option.lng, activeCuisine, activePrice, getNearbyLimit());
  }

  function handleNearbyCardPress(item: NearbyItem) {
    if (item.externalUrl) {
      Linking.openURL(item.externalUrl);
    }
  }

  function clearFilters() {
    setSelectedCuisines([]);
    setSelectedPrices([]);
  }

  const hasActiveFilters =
    selectedCuisines.length > 0 || selectedPrices.length > 0;
  const shouldRenderFilters =
    selectedTab === 'tat-ca' || selectedTab === 'dang-thinh-hanh';

  function renderNearbySkeleton() {
    return (
      <View style={{ gap: Spacing.gap }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              gap: Spacing.gap,
            }}>
            <Skeleton
              variant="card"
              style={{
                width: 80,
                height: 80,
                borderRadius: Radius.sm,
              }}
            />
            <View style={{ flex: 1, gap: Spacing.sm2 }}>
              <Skeleton variant="text" style={{ width: '60%' }} />
              <Skeleton variant="text" style={{ width: '40%' }} />
              <Skeleton variant="text" style={{ width: '30%' }} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View {...webMainContentProps} style={styles.container}>
        <ScrollView
          accessibilityLabel="Khám phá"
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              onRefresh={onRefresh}
              refreshing={refreshing}
              tintColor={oklchToRgba(Colors.accent)}
            />
          }
          showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <Text style={styles.screenTitle}>Khám phá</Text>
            <View style={styles.locationCard}>
              <Text style={styles.locationPin}>📍</Text>
              <Text style={styles.locationText}>
                {isLocating ? 'Đang cập nhật vị trí...' : location.district}
              </Text>
              <Pressable
                accessibilityLabel="Thay đổi vị trí"
                accessibilityRole="button"
                onPress={() => setShowLocationPicker(true)}
                style={({ pressed }) => [
                  styles.locationBtn,
                  { opacity: pressed ? 0.7 : 1 },
                ]}>
                <Text style={styles.locationBtnText}>Thay đổi</Text>
              </Pressable>
            </View>
          </View>

          <ChipRow
            items={TAB_ITEMS}
            mode="singleSelect"
            onSelectionChange={(ids) =>
              setSelectedTab((ids[0] || 'tat-ca') as TabId)
            }
            selectedIds={[selectedTab]}
            style={styles.chipRowPadding}
          />

          {shouldRenderFilters ? (
            <View>
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Lọc theo</Text>
                <ChipRow
                  items={CUISINE_ITEMS}
                  mode="singleSelect"
                  onSelectionChange={setSelectedCuisines}
                  selectedIds={selectedCuisines}
                  style={{ paddingHorizontal: 0 }}
                />
                <View style={{ marginTop: Spacing.sm2 }}>
                  <ChipRow
                    items={PRICE_ITEMS}
                    mode="singleSelect"
                    onSelectionChange={setSelectedPrices}
                    selectedIds={selectedPrices}
                    style={{ paddingHorizontal: 0 }}
                  />
                </View>
              </View>

              {showTrending ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      Đang thịnh hành 🔥
                    </Text>
                    <Text style={styles.sectionMeta}>
                      Trong bán kính 2km
                    </Text>
                  </View>

                  {isLoadingNearby && !refreshing ? (
                    renderNearbySkeleton()
                  ) : errorNearby ? (
                    <EmptyState
                      description={errorNearby}
                      icon="⚠️"
                      onCtaPress={() =>
                        fetchAll(
                          selectedCuisines.length > 0
                            ? cuisineParamMap[selectedCuisines[0]]
                            : undefined,
                          selectedPrices.length > 0
                            ? priceParamMap[selectedPrices[0]]
                            : undefined,
                        )
                      }
                      ctaLabel="Thử lại"
                      title="Không thể tải"
                    />
                  ) : nearbyData.length === 0 ? (
                    <EmptyState
                      description={
                        hasActiveFilters
                          ? 'Không có nhà hàng nào phù hợp'
                          : 'Không có nhà hàng nào gần đây'
                      }
                      icon="📍"
                      onCtaPress={hasActiveFilters ? clearFilters : undefined}
                      ctaLabel={hasActiveFilters ? 'Xoá bộ lọc' : undefined}
                      title={hasActiveFilters ? 'Không tìm thấy' : 'Trống'}
                    />
                  ) : (
                    <View style={[styles.cardGrid, { gap: Spacing.gap }]}>
                      {nearbyData.slice(0, 5).map((item, idx) => (
                        <View key={`trending-${item.restaurantName}-${idx}`} style={{ width: columns > 1 ? `${100 / columns}%` : '100%', paddingHorizontal: Platform.OS === 'web' ? Spacing.xs : 0 }}>
                          <RestaurantCard
                            accessibilityLabel={
                              item.dishName ?? item.restaurantName
                            }
                            distanceMeters={item.distance ?? 0}
                            name={item.dishName ?? item.restaurantName}
                            restaurantName={item.restaurantName}
                            price={item.priceRange}
                            rating={'5.0'}
                            onPress={() => handleNearbyCardPress(item)}
                          />
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : null}
            </View>
          ) : null}

          {showNearby ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Gần tôi</Text>
                <Text style={styles.sectionMeta}>Xem tất cả</Text>
              </View>

              {isLoadingNearby && !refreshing ? (
                renderNearbySkeleton()
              ) : errorNearby ? (
                <EmptyState
                  description={errorNearby}
                  icon="⚠️"
                  onCtaPress={() =>
                    fetchAll(
                      selectedCuisines.length > 0
                        ? cuisineParamMap[selectedCuisines[0]]
                        : undefined,
                      selectedPrices.length > 0
                        ? priceParamMap[selectedPrices[0]]
                        : undefined,
                    )
                  }
                  ctaLabel="Thử lại"
                  title="Không thể tải"
                />
              ) : nearbyData.length === 0 ? (
                <EmptyState
                  description={
                    hasActiveFilters
                      ? 'Không có nhà hàng nào phù hợp'
                      : 'Không có nhà hàng nào gần đây'
                  }
                  icon="📍"
                  onCtaPress={hasActiveFilters ? clearFilters : undefined}
                  ctaLabel={hasActiveFilters ? 'Xoá bộ lọc' : undefined}
                  title={hasActiveFilters ? 'Không tìm thấy' : 'Trống'}
                />
              ) : (
                <View style={[styles.cardGrid, { gap: Spacing.gap }]}>
                  {nearbyData.map((item, idx) => (
                    <View key={`${item.restaurantName}-${idx}`} style={{ width: columns > 1 ? `${100 / columns}%` : '100%', paddingHorizontal: Platform.OS === 'web' ? Spacing.xs : 0 }}>
                      <RestaurantCard
                        accessibilityLabel={
                          item.dishName ?? item.restaurantName
                        }
                        distanceMeters={item.distance ?? 0}
                        name={item.dishName ?? item.restaurantName}
                        restaurantName={item.restaurantName}
                        price={item.priceRange}
                        rating={
                          item.rating != null
                            ? String(item.rating)
                            : undefined
                        }
                        onPress={() => handleNearbyCardPress(item)}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : null}

          <View style={{ height: Spacing.xl }} />
        </ScrollView>

        <LocationPicker
          onClose={() => setShowLocationPicker(false)}
          onSelect={handleLocationSelected}
          visible={showLocationPicker}
        />
      </View>
    </View>
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
  scrollContent: {
    paddingBottom: 80,
  },
  headerSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.gap,
  },
  screenTitle: {
    fontFamily: Typography.screenTitle.family,
    fontSize: Typography.screenTitle.fontSize,
    fontWeight: Typography.screenTitle.fontWeight,
    letterSpacing: Typography.screenTitle.letterSpacing,
    color: oklchToRgba(Colors.fg),
    marginBottom: Spacing.sm2,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: oklchToRgba(Colors.surface),
    borderWidth: 1,
    borderColor: oklchToRgba(Colors.border),
    borderRadius: Radius.md,
    gap: Spacing.sm2,
  },
  locationPin: {
    fontSize: 16,
  },
  locationText: {
    flex: 1,
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    lineHeight: Typography.cardSubtitle.lineHeight,
    color: oklchToRgba(Colors.fg),
  },
  locationBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm2,
  },
  locationBtnText: {
    fontFamily: Typography.chipLabel.family,
    fontSize: Typography.chipLabel.fontSize,
    fontWeight: Typography.chipLabel.fontWeight,
    color: oklchToRgba(Colors.accent),
  },
  chipRowPadding: {
    paddingVertical: Spacing.sm2,
    paddingLeft: Spacing.md,
  },
  filterSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm2,
  },
  filterTitle: {
    fontFamily: Typography.sectionTitle.family,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    lineHeight: Typography.sectionTitle.lineHeight,
    color: oklchToRgba(Colors.fg),
    marginBottom: Spacing.sm2,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.gap,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm2,
  },
  sectionTitle: {
    fontFamily: Typography.sectionTitle.family,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    lineHeight: Typography.sectionTitle.lineHeight,
    color: oklchToRgba(Colors.fg),
  },
  sectionMeta: {
    fontFamily: Typography.meta.family,
    fontSize: Typography.meta.fontSize,
    fontWeight: Typography.meta.fontWeight,
    lineHeight: Typography.meta.lineHeight,
    color: oklchToRgba(Colors.muted),
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: Platform.OS === 'web' ? -Spacing.xs : 0,
  },
});
