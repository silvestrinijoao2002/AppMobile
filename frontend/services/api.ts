import axios from 'axios';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

// Base API configuration
const api = axios.create({
  baseURL: 'https://diverte.asystec.com.br',
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

// Request interceptor to add saved cookies
api.interceptors.request.use(
  (config) => {
    const savedCookie = storage.getString('session_cookie');
    if (savedCookie) {
      config.headers['Cookie'] = savedCookie;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => {
    // Save session cookies if present
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      storage.set('session_cookie', setCookie[0]);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Session expired - clear auth data
      storage.delete('session_cookie');
      storage.delete('user_data');
      // Navigation to login will be handled by the store
    }
    return Promise.reject(error);
  }
);

// Helper to convert object to form data
export const toFormData = (obj: Record<string, any>): string => {
  return Object.keys(obj)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
};

export default api;
