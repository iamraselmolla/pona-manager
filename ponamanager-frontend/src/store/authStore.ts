// src/store/authStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { STORAGE_KEYS } from '../constants';
import { authAPI } from '../api/services';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  loadToken: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (token && userData) {
        set({
          token,
          user: JSON.parse(userData),
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const res = await authAPI.login(email, password);
    const { token, user } = res.data.data;
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    set({ token: null, user: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    }));
  },
}));
