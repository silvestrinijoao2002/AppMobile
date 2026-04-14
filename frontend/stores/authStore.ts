import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User } from '@/types';
import { authService } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  biometricsEnabled: boolean;
  
  login: (usuario: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  enableBiometrics: (usuario: string, senha: string) => Promise<void>;
  disableBiometrics: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  biometricsEnabled: false,

  login: async (usuario: string, senha: string) => {
    try {
      const user = await authService.login(usuario, senha);
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('session_cookie');
      await SecureStore.deleteItemAsync('biometric_usuario');
      await SecureStore.deleteItemAsync('biometric_senha');
      set({ user: null, isAuthenticated: false, biometricsEnabled: false });
    }
  },

  checkSession: async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user_data');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        const sessionValid = await authService.checkSession();
        if (sessionValid) {
          set({ user, isAuthenticated: true, isLoading: false });
          
          // Check if biometrics are enabled
          const biometricUser = await SecureStore.getItemAsync('biometric_usuario');
          if (biometricUser) {
            set({ biometricsEnabled: true });
          }
          return;
        }
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      console.error('Session check error:', error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  enableBiometrics: async (usuario: string, senha: string) => {
    try {
      await SecureStore.setItemAsync('biometric_usuario', usuario);
      await SecureStore.setItemAsync('biometric_senha', senha);
      set({ biometricsEnabled: true });
    } catch (error) {
      console.error('Enable biometrics error:', error);
      throw error;
    }
  },

  disableBiometrics: async () => {
    try {
      await SecureStore.deleteItemAsync('biometric_usuario');
      await SecureStore.deleteItemAsync('biometric_senha');
      set({ biometricsEnabled: false });
    } catch (error) {
      console.error('Disable biometrics error:', error);
    }
  },
}));
