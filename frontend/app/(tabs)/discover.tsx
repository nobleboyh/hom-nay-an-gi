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
import { DishCard } from '../../components/DishCard';
import { EmptyState } from '../../components/EmptyState';
import { LocationPicker, type LocationOption } from '../../components/LocationPicker';
import { RestaurantCard } from '../../components/RestaurantCard';
import { Skeleton } from '../../components/Skeleton';
import { createApiClient, type ApiError } from '../../lib/api';
import { getApiBaseUrlOrThrow, isApiBaseUrlConfigurationError } from '../../lib/env';
import { Colors, Radius, Spacing, Typography, oklchToRgba } from '../../lib/tokens';

let apiClient = createApiClient({
  baseUrl: '',
  getToken: async () => null,
  onTokenExpired: async () => {},
  onUnauthenticated: () => {},
});

function getDiscoverApiClient() {
  apiClient = createApiClient({
    baseUrl: getApiBaseUrlOrThrow(),
    getToken: async () => null,
    onTokenExpired: async () => {},
    onUnauthenticated: () => {},
  });
  return apiClient;
}

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

type TrendingDish = {
  dishId: string;
  name: string;
  nameEn: string;
  cuisine: string;
  priceRange?: string;
  trendingRank: number;
  imageDescription?: string;
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
  const [trendingData, setTrendingData] = useState<TrendingDish[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [errorTrending, setErrorTrending] = useState<string | null>(null);
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
  const [locationChanging, setLocationChanging] = useState(false);
  const [showNewLocationResults, setShowNewLocationResults] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationRef = useRef(location);
  const prevDataRef = useRef<{
    trending: TrendingDish[];
    nearby: NearbyItem[];
    isLoadingTrending: boolean;
    isLoadingNearby: boolean;
    errorTrending: string | null;
    errorNearby: string | null;
    showNewLocationResults: boolean;
  } | null>(null);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

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
      const res = await getDiscoverApiClient().get<NearbyItem[]>(
        `/api/v1/discovery/nearby?${params}`,
      );
      setNearbyData(res.data);
    } catch (err) {
      if (isApiBaseUrlConfigurationError(err)) {
        setErrorNearby(err.message);
        return;
      }
      const apiErr = err as ApiError;
      setErrorNearby(
        apiErr.message || 'Không thể tải nhà hàng gần đây',
      );
    } finally {
      setIsLoadingNearby(false);
    }
  }

  async function fetchTrending(cuisine?: string, price?: string) {
    try {
      setIsLoadingTrending(true);
      setErrorTrending(null);
      const params = new URLSearchParams();
      if (cuisine) params.set('cuisine', cuisine);
      if (price) params.set('price', price);
      const res = await getDiscoverApiClient().get<{ items: TrendingDish[] }>(
        `/api/v1/discovery/trending?${params}`,
      );
      setTrendingData(res.data.items);
    } catch (err) {
      if (isApiBaseUrlConfigurationError(err)) {
        setErrorTrending(err.message);
        return;
      }
      const apiErr = err as ApiError;
      setErrorTrending(
        apiErr.message || 'Không thể tải món đang thịnh hành',
      );
    } finally {
      setIsLoadingTrending(false);
    }
  }

  const fetchAll = useCallback(
    (cuisine?: string, price?: string) => {
      const loc = locationRef.current;
      void fetchNearby(loc.lat, loc.lng, cuisine, price, getNearbyLimit());
      void fetchTrending(cuisine, price);
    },
    [getNearbyLimit],
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
  }, [selectedTab, selectedCuisines, selectedPrices, fetchAll]);

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
    await fetchTrending(activeCuisine, activePrice);
    setRefreshing(false);
  }, [selectedCuisines, selectedPrices, location, getNearbyLimit]);

  const showTrending =
    !locationChanging && !showNewLocationResults && (selectedTab === 'tat-ca' || selectedTab === 'dang-thinh-hanh' || selectedTab === 'mon-moi' || selectedTab === 'danh-gia-cao');
  const showNearby =
    !locationChanging && !showNewLocationResults && (selectedTab === 'gan-toi' || selectedTab === 'tat-ca');

  async function handleGetLocation() {
    prevDataRef.current = null;
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
            void fetchTrending(activeCuisine, activePrice);
            setShowLocationPicker(false);
            setLocationChanging(false);
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
        void fetchTrending(activeCuisine, activePrice);
        setShowLocationPicker(false);
        setLocationChanging(false);
      }
    } catch {
      setLocation((prev) => ({
        ...prev,
        district: 'Đang cập nhật vị trí...',
      }));
      setShowLocationPicker(false);
      setLocationChanging(false);
    } finally {
      setIsLocating(false);
    }
  }

  function handleLocationSelected(option: LocationOption) {
    prevDataRef.current = null;
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
    void fetchTrending(activeCuisine, activePrice);
    setSelectedTab('tat-ca');
    setShowNewLocationResults(true);
    setShowLocationPicker(false);
    setLocationChanging(false);
  }

  function openMap(name: string, lat?: number, lng?: number) {
    const encodedName = encodeURIComponent(name);
    const hasCoords = lat != null && lng != null;
    const query = hasCoords ? `${lat},${lng}` : encodedName;

    let url: string;
    if (hasCoords) {
      if (Platform.OS === 'ios') {
        url = `maps://?ll=${lat},${lng}&q=${encodedName}`;
      } else if (Platform.OS === 'android') {
        url = `geo:${lat},${lng}?q=${lat},${lng}(${encodedName})`;
      } else {
        url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      }
    } else {
      if (Platform.OS === 'ios') {
        url = `maps://?q=${encodedName}`;
      } else if (Platform.OS === 'android') {
        url = `geo:0,0?q=${encodedName}`;
      } else {
        url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      }
    }

    Linking.openURL(url).catch(() => {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${query}`,
      );
    });
  }

  function handleTrendingCardPress(item: TrendingDish) {
    openMap(`${item.name} ${item.nameEn}`);
  }

  function handleNearbyCardPress(item: NearbyItem) {
    if (item.lat != null && item.lng != null) {
      openMap(item.dishName ?? item.restaurantName, item.lat, item.lng);
    } else if (item.externalUrl) {
      Linking.openURL(item.externalUrl);
    } else {
      openMap(item.dishName ?? item.restaurantName);
    }
  }

  function clearFilters() {
    setSelectedCuisines([]);
    setSelectedPrices([]);
  }

  const hasActiveFilters =
    selectedCuisines.length > 0 || selectedPrices.length > 0;
  const shouldRenderFilters =
    selectedTab === 'tat-ca' || selectedTab === 'dang-thinh-hanh' || selectedTab === 'mon-moi' || selectedTab === 'danh-gia-cao';

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
                onPress={() => {
                  prevDataRef.current = {
                    trending: trendingData,
                    nearby: nearbyData,
                    isLoadingTrending,
                    isLoadingNearby,
                    errorTrending,
                    errorNearby,
                    showNewLocationResults,
                  };
                  setTrendingData([]);
                  setNearbyData([]);
                  setShowNewLocationResults(false);
                  setLocationChanging(true);
                  setShowLocationPicker(true);
                }}
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
            onSelectionChange={(ids) => {
              const tab = (ids[0] || 'tat-ca') as TabId;
              setSelectedTab(tab);
              setShowNewLocationResults(false);
              if (tab === 'gan-toi') {
                void handleGetLocation();
              }
            }}
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

                  {isLoadingTrending && !refreshing ? (
                    <View style={{ gap: Spacing.gap }}>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton
                          key={i}
                          variant="card"
                          style={{ width: '100%', height: 160, borderRadius: Radius.sm }}
                        />
                      ))}
                    </View>
                  ) : errorTrending ? (
                    <EmptyState
                      description={errorTrending}
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
                  ) : trendingData.length === 0 ? (
                    <EmptyState
                      description={
                        hasActiveFilters
                          ? 'Không có món ăn nào phù hợp'
                          : 'Không có món ăn nào đang thịnh hành'
                      }
                      icon="🍽️"
                      onCtaPress={hasActiveFilters ? clearFilters : undefined}
                      ctaLabel={hasActiveFilters ? 'Xoá bộ lọc' : undefined}
                      title={hasActiveFilters ? 'Không tìm thấy' : 'Trống'}
                    />
                  ) : (
                    <View style={[styles.cardGrid, { gap: Spacing.gap }]}>
                      {trendingData.map((item) => (
                        <View key={item.dishId} style={{ width: columns > 1 ? `${100 / columns}%` : '100%', paddingHorizontal: Platform.OS === 'web' ? Spacing.xs : 0 }}>
                          <DishCard
                            accessibilityLabel={item.name}
                            dishName={item.name}
                            price={item.priceRange}
                            rating={String(item.trendingRank)}
                            restaurantName={item.nameEn}
                            onPress={() => handleTrendingCardPress(item)}
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

          {showNewLocationResults && selectedTab === 'tat-ca' ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Kết quả tại {location.district}
                </Text>
              </View>

              {isLoadingNearby ? (
                <View style={{ gap: Spacing.gap }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      variant="card"
                      style={{ width: '100%', height: 120, borderRadius: Radius.sm }}
                    />
                  ))}
                </View>
              ) : nearbyData.length === 0 ? (
                <EmptyState
                  description="Không tìm thấy nhà hàng nào tại khu vực này"
                  icon="📍"
                  title="No result found"
                />
              ) : (
                <View style={{ gap: Spacing.gap }}>
                  {nearbyData.map((item, idx) => (
                    <RestaurantCard
                      key={`nearby-${idx}`}
                      accessibilityLabel={item.dishName ?? item.restaurantName}
                      distanceMeters={item.distance ?? 0}
                      name={item.dishName ?? item.restaurantName}
                      restaurantName={item.restaurantName}
                      price={item.priceRange}
                      rating={item.rating != null ? String(item.rating) : undefined}
                      onPress={() => handleNearbyCardPress(item)}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : null}

          <View style={{ height: Spacing.xl }} />
        </ScrollView>

        <LocationPicker
          onClose={() => {
            if (prevDataRef.current) {
              setTrendingData(prevDataRef.current.trending);
              setNearbyData(prevDataRef.current.nearby);
              setIsLoadingTrending(prevDataRef.current.isLoadingTrending);
              setIsLoadingNearby(prevDataRef.current.isLoadingNearby);
              setErrorTrending(prevDataRef.current.errorTrending);
              setErrorNearby(prevDataRef.current.errorNearby);
              setShowNewLocationResults(prevDataRef.current.showNewLocationResults);
              prevDataRef.current = null;
            }
            setShowLocationPicker(false);
            setLocationChanging(false);
          }}
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
