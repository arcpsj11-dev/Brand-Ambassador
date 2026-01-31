import { create } from 'zustand';

export type AppTab = 'dashboard' | 'slots' | 'archive' | 'diagnosis' | 'admin' | 'profile';

interface UIState {
    activeTab: AppTab;
    contentMode: 'canvas' | 'kitchen';
    setActiveTab: (tab: AppTab) => void;
    setContentMode: (mode: 'canvas' | 'kitchen') => void;
}

export const useUIStore = create<UIState>((set) => ({
    activeTab: 'dashboard',
    contentMode: 'canvas',
    setActiveTab: (activeTab) => set({ activeTab }),
    setContentMode: (contentMode) => set({ contentMode }),
}));
