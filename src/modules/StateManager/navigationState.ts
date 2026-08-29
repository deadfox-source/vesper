import { create } from 'zustand';

export type ScreenType = 'ONBOARDING' | 'HOME' | 'TABLETOP' | 'PROFILE';

interface NavigationState {
  currentScreen: ScreenType;
  navigate: (screen: ScreenType) => void;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentScreen: 'HOME', // Default to Onboarding for the first-time experience
  navigate: (screen) => set({ currentScreen: screen }),
  
  hasCompletedOnboarding: false,
  completeOnboarding: () => set({ 
    hasCompletedOnboarding: true, 
    currentScreen: 'TABLETOP' // Automatically route to main grid after lore dump
  }),
}));
