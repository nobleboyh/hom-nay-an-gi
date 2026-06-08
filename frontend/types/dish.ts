export interface Dish {
  id: string;
  name: string;
}

export interface Favorite {
  dishId: string;
  dishData: Dish;
  savedAt: string;
}

export interface SearchHistoryItem {
  id: number;
  ingredients: string;
  tags: string;
  cookTimeMax: number;
  resultCount: number;
  selectedDishId: string | null;
  createdAt: string;
}

export interface UserPreference {
  dietaryPreferences: string[];
  allergies: string[];
  dislikedIngredients: string[];
  preferredCuisines: string[];
  measurementUnit: 'metric' | 'imperial';
  theme: 'light' | 'dark' | 'system';
  language: 'vi' | 'en';
  notifications: {
    breakfastReminder: boolean;
    lunchReminder: boolean;
    dinnerReminder: boolean;
    dailySuggestion: boolean;
  };
}
