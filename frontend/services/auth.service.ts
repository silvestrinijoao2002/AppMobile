import api, { toFormData } from './api';
import { User } from '../types';

export const authService = {
  async login(usuario: string, senha: string): Promise<User> {
    const formData = toFormData({ usuario, senha });
    const response = await api.post('/login', formData);
    return response.data;
  },

  async checkSession(): Promise<User | null> {
    try {
      const response = await api.get('/catalogo/publico/status-login');
      if (response.data.logged_in) {
        return response.data;
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  async logout(): Promise<void> {
    await api.post('/logout');
  },
};
