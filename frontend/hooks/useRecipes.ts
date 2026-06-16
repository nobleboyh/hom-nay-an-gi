import { useCallback } from 'react';
import { useDataStore } from '../stores/dataStore';
import type { FilterState } from '../stores/uiStore';

export function useRecipes() {
  const dishes = useDataStore((s) => s.dishes);
  const homeStatus = useDataStore((s) => s.homeStatus);
  const storeFetchDishes = useDataStore((s) => s.fetchDishes);
  const storeFetchSurpriseMe = useDataStore((s) => s.fetchSurpriseMe);

  const fetchDishes = useCallback(
    async (ingredients: string[], filters: FilterState) => {
      await storeFetchDishes(ingredients, filters);
    },
    [storeFetchDishes],
  );

  const fetchSurpriseMe = useCallback(async () => {
    await storeFetchSurpriseMe();
  }, [storeFetchSurpriseMe]);

  return { dishes, homeStatus, fetchDishes, fetchSurpriseMe };
}
