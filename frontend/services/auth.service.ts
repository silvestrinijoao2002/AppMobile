import api, { toFormData } from './api';
import { User } from '../types';

export const authService = {
  async login(usuario: string, senha: string): Promise<User> {
    const formData = toFormData({ usuario, senha });
    const response = await api.post('/api/mobile/login', formData);
    if (!response.data.success) {
      throw { response: { data: { message: response.data.message } } };
    }
    return response.data as User;
  },

  async checkSession(): Promise<User | null> {
    try {
      const response = await api.get('/api/mobile/session');
      if (response.data.success && response.data.logged_in) {
        return response.data as User;
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/api/mobile/logout');
    } catch {
      // ignora erro no logout
    }
  },
};
