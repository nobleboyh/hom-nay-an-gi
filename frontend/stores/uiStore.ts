import { create } from 'zustand';

export type TabName = 'home' | 'discover' | 'favorites' | 'profile';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  durationMs?: number;
}

export interface FilterState {
  foodTypes: string[];
  cuisines: string[];
  cookTime: number | null;
}

export interface UIStore {
  activeTab: TabName;
  expandedCardId: string | null;
  activeFilters: FilterState;
  isLoading: boolean;
  toasts: Toast[];
  setActiveTab: (tab: TabName) => void;
  toggleCard: (id: string) => void;
  setFilters: (partial: Partial<FilterState>) => void;
  setLoading: (loading: boolean) => void;
  addToast: (message: string, type: Toast['type'], durationMs?: number) => void;
  dismissToast: (id: string) => void;
}

let toastCounter = 0;
const DEFAULT_TOAST_DURATION = 4000;
const MAX_TOASTS = 3;

function generateToastId(): string {
  toastCounter += 1;
  return `toast-${Date.now()}-${toastCounter}`;
}

export const useUIStore = create<UIStore>((set, get) => ({
  activeTab: 'home',
  expandedCardId: null,
  activeFilters: {
    foodTypes: [],
    cuisines: ['Việt Nam'],
    cookTime: 30,
  },
  isLoading: false,
  toasts: [],

  setActiveTab: (tab) => set({ activeTab: tab }),

  setLoading: (loading) => set({ isLoading: loading }),

  toggleCard: (id) =>
    set((state) => ({
      expandedCardId: state.expandedCardId === id ? null : id,
    })),

  setFilters: (partial) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, ...partial },
    })),

  addToast: (message, type, durationMs?) =>
    set((state) => {
      const id = generateToastId();
      const duration = durationMs ?? DEFAULT_TOAST_DURATION;
      const toast: Toast = { id, message, type, durationMs: duration };
      let toasts = [...state.toasts, toast];
      if (toasts.length > MAX_TOASTS) {
        toasts = toasts.slice(toasts.length - MAX_TOASTS);
      }

      if (duration > 0) {
        setTimeout(() => {
          get().dismissToast(id);
        }, duration);
      }

      return { toasts };
    }),

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
