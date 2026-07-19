import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { create } from 'zustand';

const KEY = 'betapp.profile.preferences.v1';

export const useProfileStore = create((set, get) => ({
  avatarUri: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      set({ avatarUri: parsed.avatarUri || null, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  saveAvatar: async (sourceUri) => {
    const extension = sourceUri.toLowerCase().includes('.png') ? 'png' : 'jpg';
    const avatarUri = `${FileSystem.documentDirectory}profile-avatar.${extension}`;
    const existing = await FileSystem.getInfoAsync(avatarUri);
    if (existing.exists) {
      await FileSystem.deleteAsync(avatarUri, { idempotent: true });
    }
    await FileSystem.copyAsync({ from: sourceUri, to: avatarUri });
    set({ avatarUri });
    await AsyncStorage.setItem(KEY, JSON.stringify({ avatarUri }));
    return avatarUri;
  },
}));
