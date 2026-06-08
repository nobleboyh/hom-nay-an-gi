import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'vi' | 'en';

export const LANGUAGE_STORAGE_KEY = 'hom-nay-an-gi.language';

export const catalog = {
  vi: {
    'app.title': 'Hôm Nay Ăn Gì',
    'app.tagline': 'Nhập nguyên liệu bạn có — để tôi gợi ý món ngon',
    'home.ingredientPrompt': 'Nhập nguyên liệu bạn có — để tôi gợi ý món ngon',
    'home.inputPlaceholder': 'Gõ nguyên liệu, ví dụ: thịt gà, bông cải, trứng',
    'home.searchButton': 'Tìm món',
    'home.surpriseMe': 'Bất ngờ!',
    'home.moodSection': 'Cảm giác thèm',
    'home.skipNavigation': 'Bỏ qua điều hướng',
    'results.count': 'Tìm thấy X món phù hợp',
    'results.sort.bestMatch': 'Phù hợp nhất',
    'results.sort.lowestCalories': 'Ít calo nhất',
    'results.sort.fastest': 'Nấu nhanh nhất',
    'results.sort.dishType': 'Loại món',
    'results.viewRecipe': 'Xem công thức',
    'results.shopping': 'Mua sắm',
    'results.endOfList': 'Không còn món nào để hiển thị',
    'recipe.viewRecipe': 'Xem công thức',
    'recipe.shoppingList': 'Danh sách mua sắm',
    'recipe.copy': 'Sao chép',
    'recipe.totalCookTime': 'Tổng thời gian',
    'recipe.servings': 'Khẩu phần',
    'recipe.missingIngredients': 'Cần mua thêm',
    'recipe.ownedIngredients': 'Bạn đã có',
    'discover.title': 'Khám phá',
    'discover.all': 'Tất cả',
    'discover.trending': 'Đang thịnh hành',
    'discover.nearby': 'Gần tôi',
    'discover.newDishes': 'Món mới',
    'discover.topRated': 'Đánh giá cao',
    'discover.changeLocation': 'Thay đổi',
    'discover.locationUpdating': 'Đang cập nhật vị trí...',
    'discover.empty': 'Không có món nào phù hợp',
    'discover.clearFilters': 'Xoá bộ lọc',
    'favorites.title': 'Yêu thích',
    'favorites.savedFeedback': 'Đã lưu vào Yêu thích',
    'favorites.emptyTitle': 'Chưa có món yêu thích',
    'favorites.emptyCta': 'Khám phá món ngay',
    'favorites.searchPlaceholder': 'Tìm trong món yêu thích',
    'favorites.removed': 'Đã xóa khỏi Yêu thích',
    'favorites.noSearchMatches': 'Không tìm thấy món nào',
    'shopping.header': 'Danh sách mua sắm',
    'shopping.ownedItems': 'Bạn đã có',
    'shopping.missingItems': 'Cần mua thêm',
    'shopping.save': 'Lưu danh sách',
    'shopping.copy': 'Sao chép',
    'shopping.tipLabel': 'Mẹo tiết kiệm',
    'shopping.empty': 'Không có nguyên liệu nào',
    'shopping.backToResults': 'Quay lại kết quả',
    'login.prompt': 'Đăng nhập để lưu món yêu thích và đồng bộ dữ liệu của bạn',
    'login.continueAsGuest': 'Tiếp tục mà không đăng nhập',
    'login.email': 'Email',
    'login.password': 'Mật khẩu',
    'login.submit': 'Đăng nhập',
    'login.register': 'Đăng ký',
    'login.success': 'Đăng nhập thành công!',
    'login.invalidCredentials': 'Email hoặc mật khẩu không đúng',
    'login.rateLimited': 'Quá nhiều lần thử. Vui lòng thử lại sau 5 phút.',
    'login.offline': 'Cần kết nối internet để đăng nhập',
    'login.missingFields': 'Vui lòng nhập email và mật khẩu',
    'login.comingSoon': 'Chức năng đăng ký sẽ có trong phiên bản tiếp theo',
    'guest.continue': 'Tiếp tục với tư cách khách',
    'benefits.title': 'Lợi ích khi đăng nhập',
    'benefits.sync': 'Đồng bộ món yêu thích và dữ liệu của bạn',
    'benefits.recommendations': 'Nhận gợi ý thông minh hơn',
    'benefits.shoppingLists': 'Lưu danh sách mua sắm',
    'feedback.voiceListening': 'Đang nghe...',
    'feedback.openCamera': 'Mở camera',
    'feedback.recipeCopied': 'Đã sao chép công thức',
    'feedback.shoppingCopied': 'Đã sao chép danh sách',
    'feedback.shoppingSaved': 'Đã lưu danh sách mua sắm',
    'state.loading': 'Đang tải...',
    'state.error.generic': 'Không thể tải dữ liệu',
    'state.error.retry': 'Thử lại',
    'state.error.findDishes': 'Không thể tìm món',
    'state.error.recipe': 'Không thể tải công thức',
    'state.error.discover': 'Không thể tải danh sách',
    'state.error.favorites': 'Không thể tải danh sách yêu thích',
    'state.error.shopping': 'Không thể tải danh sách mua sắm',
    'state.offline': 'Mất kết nối',
    'state.success': 'Hoàn tất',
    'state.empty': 'Không có dữ liệu',
    'aria.externalLink': 'Mở liên kết ngoài',
    'aria.openGrabFood': 'Mở GrabFood (liên kết ngoài)',
    'aria.back': 'Quay lại',
    'aria.loading': 'Đang tải...',
  },
  en: {
    'app.title': 'What to Eat Today',
    'app.tagline': "Enter what you've got — I'll suggest a dish",
    'home.ingredientPrompt': "Enter what you've got — I'll suggest a dish",
    'home.inputPlaceholder': 'e.g., chicken, broccoli, eggs',
    'home.searchButton': 'Find dishes',
    'home.surpriseMe': 'Surprise Me!',
    'home.moodSection': 'Craving mood',
    'home.skipNavigation': 'Skip navigation',
    'results.count': 'Found X matching dishes',
    'results.sort.bestMatch': 'Best match',
    'results.sort.lowestCalories': 'Lowest cal',
    'results.sort.fastest': 'Fastest',
    'results.sort.dishType': 'Dish type',
    'results.viewRecipe': 'View recipe',
    'results.shopping': 'Shopping',
    'results.endOfList': 'No more dishes to show',
    'recipe.viewRecipe': 'View recipe',
    'recipe.shoppingList': 'Shopping List',
    'recipe.copy': 'Copy',
    'recipe.totalCookTime': 'Total time',
    'recipe.servings': 'Servings',
    'recipe.missingIngredients': 'Need to buy',
    'recipe.ownedIngredients': 'You have',
    'discover.title': 'Discover',
    'discover.all': 'All',
    'discover.trending': 'Trending',
    'discover.nearby': 'Near me',
    'discover.newDishes': 'New dishes',
    'discover.topRated': 'Top rated',
    'discover.changeLocation': 'Change',
    'discover.locationUpdating': 'Updating location...',
    'discover.empty': 'No matching dishes found',
    'discover.clearFilters': 'Clear filters',
    'favorites.title': 'Favorites',
    'favorites.savedFeedback': 'Saved to Favorites',
    'favorites.emptyTitle': 'No saved dishes yet',
    'favorites.emptyCta': 'Discover dishes now',
    'favorites.searchPlaceholder': 'Search favorites',
    'favorites.removed': 'Removed from Favorites',
    'favorites.noSearchMatches': 'No matching dishes found',
    'shopping.header': 'Shopping List',
    'shopping.ownedItems': 'You have',
    'shopping.missingItems': 'Need to buy',
    'shopping.save': 'Save list',
    'shopping.copy': 'Copy',
    'shopping.tipLabel': 'Savings tip',
    'shopping.empty': 'No ingredients available',
    'shopping.backToResults': 'Back to results',
    'login.prompt': 'Log in to save favorites and sync your data',
    'login.continueAsGuest': 'Continue without logging in',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.submit': 'Log in',
    'login.register': 'Register',
    'login.success': 'Login successful!',
    'login.invalidCredentials': 'Incorrect email or password',
    'login.rateLimited': 'Too many attempts. Please try again in 5 minutes.',
    'login.offline': 'An internet connection is required to log in',
    'login.missingFields': 'Please enter your email and password',
    'login.comingSoon': 'Registration will be available in a future release',
    'guest.continue': 'Continue as guest',
    'benefits.title': 'Benefits of logging in',
    'benefits.sync': 'Sync your favorites and data',
    'benefits.recommendations': 'Get smarter suggestions',
    'benefits.shoppingLists': 'Save shopping lists',
    'feedback.voiceListening': 'Listening...',
    'feedback.openCamera': 'Open camera',
    'feedback.recipeCopied': 'Recipe copied',
    'feedback.shoppingCopied': 'List copied',
    'feedback.shoppingSaved': 'Shopping list saved',
    'state.loading': 'Loading...',
    'state.error.generic': 'Unable to load data',
    'state.error.retry': 'Retry',
    'state.error.findDishes': 'Unable to find dishes',
    'state.error.recipe': 'Unable to load recipe',
    'state.error.discover': 'Unable to load results',
    'state.error.favorites': 'Unable to load favorites',
    'state.error.shopping': 'Unable to load shopping list',
    'state.offline': 'Connection lost',
    'state.success': 'Done',
    'state.empty': 'No data available',
    'aria.externalLink': 'Open external link',
    'aria.openGrabFood': 'Open GrabFood (external link)',
    'aria.back': 'Go back',
    'aria.loading': 'Loading...',
  },
} as const;

export type TranslationKey = keyof typeof catalog.vi;

let currentLanguage: Language = 'vi';

function isLanguage(value: string | null): value is Language {
  return value === 'vi' || value === 'en';
}

function resolveTranslationKey(key: string) {
  const activeCatalog = catalog[currentLanguage];

  if (key in activeCatalog) {
    return activeCatalog[key as TranslationKey];
  }

  if (key in catalog.vi) {
    return catalog.vi[key as TranslationKey];
  }

  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    throw new Error(`Missing translation key: ${key}`);
  }

  return key;
}

export async function hydrateLanguage() {
  const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (isLanguage(storedLanguage)) {
    currentLanguage = storedLanguage;
  }

  return currentLanguage;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export async function setLanguage(language: Language) {
  currentLanguage = language;
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export function t(key: TranslationKey | string) {
  return resolveTranslationKey(key);
}

export function getInlineLanguageProps(
  language: Language,
  target: 'native' | 'web' = 'native',
) {
  if (target === 'web') {
    return { lang: language };
  }

  return {
    accessibilityLanguage: language === 'en' ? 'en-US' : 'vi-VN',
  };
}

void hydrateLanguage();
