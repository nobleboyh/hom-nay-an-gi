export interface Dish {
  id: string;
  name: string;
  dishId: string;
  matchPercentage: number;
  cookTimeMinutes: number;
  caloriesPerServing: number;
  cuisine: string;
  imageUrl?: string;
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

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeStep {
  label: string;
  durationMinutes: number;
  parallelGroup?: string;
}

export interface RecipeDetail {
  dishId: string;
  name: string;
  nameEn: string;
  cuisine: string;
  cookTimeMinutes: number;
  caloriesPerServing: number;
  tags: string[];
  imageDescription: string;
  totalCookTimeMinutes: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
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
