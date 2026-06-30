import { useCallback, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDataStore } from '../../stores/dataStore';
import { useUIStore } from '../../stores/uiStore';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { ChipRow, type ChipRowItem } from '../../components/ChipRow';
import { CollapsibleSection } from '../../components/CollapsibleSection';
import { EmptyState } from '../../components/EmptyState';
import { InputField } from '../../components/InputField';
import { Skeleton } from '../../components/Skeleton';
import { isApiBaseUrlConfigurationError } from '../../lib/env';
import { parseIngredients } from '../../lib/parseIngredients';
import { useReducedMotion } from '../../lib/accessibility';
import { Colors, Radius, Spacing, Typography, oklchToRgba } from '../../lib/tokens';

const FOOD_TYPE_CHIPS: ChipRowItem[] = [
  { id: 'vegetarian', label: 'Chay' },
  { id: 'salad', label: 'Salad' },
  { id: 'light', label: 'Nhẹ' },
  { id: 'meat-included', label: 'Có thịt' },
  { id: 'salty', label: 'Mặn' },
  { id: 'sour', label: 'Chua' },
  { id: 'sweet', label: 'Ngọt' },
  { id: 'dessert', label: 'Tráng miệng' },
];

const CUISINE_CHIPS: ChipRowItem[] = [
  { id: 'Việt Nam', label: 'Việt Nam' },
  { id: 'Miền Bắc', label: 'Miền Bắc' },
  { id: 'Miền Trung', label: 'Miền Trung' },
  { id: 'Miền Nam', label: 'Miền Nam' },
];

const MOOD_CHIPS: ChipRowItem[] = [
  { id: 'thèm-thịt', label: 'Thèm thịt' },
  { id: 'thèm-cá', label: 'Thèm cá' },
  { id: 'thèm-chua', label: 'Thèm chua' },
  { id: 'thèm-ngọt', label: 'Thèm ngọt' },
  { id: 'thèm-cay', label: 'Thèm cay' },
  { id: 'thèm-mát', label: 'Thèm mát' },
];

const COOK_TIME_CHIPS: ChipRowItem[] = [
  { id: '15', label: '15 phút' },
  { id: '30', label: '30 phút' },
  { id: '60', label: '60 phút' },
  { id: '90', label: '90+ phút' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { activeFilters, setFilters, addToast } = useUIStore();
  const { resultsStatus: searchStatus, fetchDishes, fetchSurpriseMe } = useDataStore();
  const [inputValue, setInputValue] = useState('');
  const [ingredientChips, setIngredientChips] = useState<string[]>([]);
  const [skipFocused, setSkipFocused] = useState(false);

  const webMainContentProps = Platform.OS === 'web'
    ? ({ id: 'main-content', tabIndex: -1 } as { id: string; tabIndex: number })
    : {};

  const handleChangeText = useCallback((text: string) => {
    if (text.endsWith(',')) {
      const beforeComma = text.slice(0, -1).trim();
      if (beforeComma.length > 0) {
        const parsed = parseIngredients(beforeComma);
        if (parsed.length > 0) {
          setIngredientChips((prev) => {
            const combined = [...prev, ...parsed];
            return [...new Set(combined)].slice(0, 20);
          });
        }
      }
      setInputValue('');
    } else {
      setInputValue(text);
    }
  }, []);

  const handleSubmitIngredients = useCallback(() => {
    if (inputValue.length === 0) return;
    const parsed = parseIngredients(inputValue);
    if (parsed.length === 0) return;
    setIngredientChips((prev) => {
      const combined = [...prev, ...parsed];
      return [...new Set(combined)].slice(0, 20);
    });
    setInputValue('');
  }, [inputValue]);

  const handleRemoveIngredient = useCallback((ingredient: string) => {
    if (!prefersReducedMotion) {
      LayoutAnimation.configureNext({
        duration: 150,
        update: { type: 'easeInEaseOut', property: 'opacity' },
      });
    }
    setIngredientChips((prev) => prev.filter((i) => i !== ingredient));
  }, [prefersReducedMotion]);

  const handleSearch = useCallback(async () => {
    try {
      await fetchDishes(ingredientChips, activeFilters);
      const { resultsStatus: status } = useDataStore.getState();
      if (status === 'error') {
        addToast('Không thể tìm món. Vui lòng thử lại.', 'error');
        return;
      }
      if (!prefersReducedMotion) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      router.push('/(tabs)/results');
    } catch (error) {
      if (isApiBaseUrlConfigurationError(error)) {
        addToast(error.message, 'error');
        return;
      }
      addToast('Không thể tìm món. Vui lòng thử lại.', 'error');
    }
  }, [ingredientChips, activeFilters, fetchDishes, prefersReducedMotion, router, addToast]);

  const handleSurprise = useCallback(async () => {
    try {
      await fetchSurpriseMe();
      const { homeStatus } = useDataStore.getState();
      if (homeStatus === 'error') {
        addToast('Không thể tải món bất ngờ. Vui lòng thử lại.', 'error');
        return;
      }
      router.push('/recipe/surprise');
    } catch (error) {
      if (isApiBaseUrlConfigurationError(error)) {
        addToast(error.message, 'error');
        return;
      }
      addToast('Không thể tải món bất ngờ. Vui lòng thử lại.', 'error');
    }
  }, [fetchSurpriseMe, router, addToast]);

  const selectedCookTime = activeFilters.cookTime ? String(activeFilters.cookTime) : '30';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        {Platform.OS === 'web' ? (
          <Pressable
            accessibilityLabel="Bỏ qua điều hướng, chuyển đến nội dung chính"
            accessibilityRole="link"
            onBlur={() => setSkipFocused(false)}
            onFocus={() => setSkipFocused(true)}
            onPress={() => {
              if (typeof document !== 'undefined') {
                const el = document.getElementById('main-content');
                if (el) el.focus();
              }
            }}
            style={[styles.skipLink, skipFocused ? styles.skipLinkVisible : styles.skipLinkHidden]}
          >
            <Text style={styles.skipLinkText}>Bỏ qua điều hướng → Nội dung chính</Text>
          </Pressable>
        ) : null}

        <ScrollView
          {...webMainContentProps}
          contentContainerStyle={styles.scrollContent}
          nativeID="main-content"
          showsVerticalScrollIndicator={false}
        >
          <Text accessibilityRole="header" style={styles.appTitle}>Hôm Nay Ăn Gì</Text>
          <Text style={styles.tagline}>Nhập nguyên liệu bạn có — để tôi gợi ý món ngon</Text>

        <View style={styles.inputSection}>
          <InputField
            accessibilityLabel="Nhập nguyên liệu"
            onChangeText={handleChangeText}
            onSubmitEditing={handleSubmitIngredients}
            placeholder="Gõ nguyên liệu, ví dụ: thịt gà, bông cải, trứng"
            value={inputValue}
          />
          {ingredientChips.length > 0 ? (
            <View style={styles.chipList}>
              {ingredientChips.map((ingredient) => (
                <Chip
                  key={ingredient}
                  label={ingredient}
                  onRemove={() => handleRemoveIngredient(ingredient)}
                  variant="ingredient"
                />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.filterSection}>
          <Text accessibilityRole="header" style={styles.sectionLabel}>Loại món</Text>
          <ChipRow
            items={FOOD_TYPE_CHIPS}
            mode="multiSelect"
            onSelectionChange={(ids) => setFilters({ foodTypes: ids })}
            selectedIds={activeFilters.foodTypes}
            variant="tag"
          />
        </View>

        <View style={styles.filterSection}>
          <Text accessibilityRole="header" style={styles.sectionLabel}>Ẩm thực</Text>
          <ChipRow
            items={CUISINE_CHIPS}
            mode="multiSelect"
            onSelectionChange={(ids) => setFilters({ cuisines: ids })}
            selectedIds={activeFilters.cuisines}
            variant="cuisine"
          />
        </View>

        <CollapsibleSection title="Cảm giác thèm">
          <ChipRow
            items={MOOD_CHIPS}
            mode="multiSelect"
            onSelectionChange={(ids) => setFilters({ moods: ids })}
            selectedIds={activeFilters.moods}
            variant="tag"
          />
        </CollapsibleSection>

        <View style={styles.filterSection}>
          <Text accessibilityRole="header" style={styles.sectionLabel}>Thời gian nấu</Text>
          <ChipRow
            items={COOK_TIME_CHIPS}
            mode="singleSelect"
            onSelectionChange={(ids) => {
              const value = ids.length > 0 ? Number(ids[0]) : null;
              setFilters({ cookTime: value });
            }}
            selectedIds={[selectedCookTime]}
            variant="time"
          />
        </View>

        <View style={styles.buttonSection}>
          <Button
            fullWidth
            loading={searchStatus === 'loading'}
            onPress={handleSearch}
            variant="primary"
          >
            Tìm món
          </Button>
          <Button onPress={handleSurprise} variant="secondary">
            Bất ngờ!
          </Button>
        </View>

        {searchStatus === 'loading' ? (
          <View style={styles.skeletonSection}>
            <Skeleton variant="card" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </View>
        ) : null}

        {searchStatus === 'error' ? (
          <EmptyState
            ctaLabel="Thử lại"
            description="Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại."
            icon="⚠️"
            onCtaPress={handleSearch}
            title="Đã xảy ra lỗi"
          />
        ) : null}
        </ScrollView>
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
  skipLink: {
    alignSelf: 'flex-start',
    borderRadius: Radius.sm,
    backgroundColor: oklchToRgba(Colors.fg),
    paddingHorizontal: Spacing.gap,
    paddingVertical: Spacing.sm2,
  },
  skipLinkHidden: {
    position: 'absolute',
    top: 12,
    left: 12,
    opacity: 0,
    transform: [{ translateY: -16 }],
    zIndex: 10,
  },
  skipLinkVisible: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderWidth: 2,
    borderColor: oklchToRgba(Colors.accentStrong),
    opacity: 1,
    transform: [{ translateY: 0 }],
    zIndex: 10,
  },
  skipLinkText: {
    color: oklchToRgba(Colors.surface),
    fontFamily: Typography.button.family,
    fontSize: Typography.cardSubtitle.fontSize,
    fontWeight: Typography.button.fontWeight,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md2,
    paddingBottom: 100,
    gap: Spacing.md2,
  },
  appTitle: {
    fontFamily: Typography.appTitle.family,
    fontSize: Typography.appTitle.fontSize,
    fontWeight: '700',
    lineHeight: Typography.appTitle.lineHeight,
    color: oklchToRgba(Colors.fg),
    letterSpacing: Typography.appTitle.letterSpacing,
  },
  tagline: {
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardSubtitle.fontSize,
    lineHeight: Typography.cardSubtitle.lineHeight,
    color: oklchToRgba(Colors.muted),
  },
  inputSection: {
    gap: Spacing.sm,
  },
  chipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterSection: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontFamily: Typography.sectionTitle.family,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: Typography.sectionTitle.fontWeight,
    lineHeight: Typography.sectionTitle.lineHeight,
    color: oklchToRgba(Colors.fg),
  },
  buttonSection: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  skeletonSection: {
    gap: Spacing.sm,
  },
});
