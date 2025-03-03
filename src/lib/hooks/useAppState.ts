import { create } from 'zustand';

interface AppState {
  activeTab: 'home' | 'explore' | 'create' | 'notifications' | 'profile' | 'store' | 'ratings';
  isMapVisible: boolean;
  selectedGroup: string | null;
  setActiveTab: (tab: AppState['activeTab']) => void;
  setMapVisible: (visible: boolean) => void;
  setSelectedGroup: (groupId: string | null) => void;
}

export const useAppState = create<AppState>((set) => ({
  activeTab: 'home',
  isMapVisible: false,
  selectedGroup: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setMapVisible: (visible) => set({ isMapVisible: visible }),
  setSelectedGroup: (groupId) => set({ selectedGroup: groupId })
}));