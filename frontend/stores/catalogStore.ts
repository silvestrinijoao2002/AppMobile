import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Category, Product } from '@/types';
import { catalogService } from '@/services/catalog.service';

interface CatalogState {
  categories: Category[];
  products: Product[];
  isOnline: boolean;
  isLoading: boolean;
  
  fetchCategories: (idEmpresa: number) => Promise<void>;
  fetchProducts: (idEmpresa: number, categoriaId?: number) => Promise<void>;
  searchProducts: (idEmpresa: number, query: string) => Promise<void>;
  checkConnection: () => void;
}

export const useCatalogStore = create<CatalogState>((set) => {
  // Monitor network status
  NetInfo.addEventListener((state) => {
    set({ isOnline: state.isConnected ?? false });
  });

  return {
    categories: [],
    products: [],
    isOnline: true,
    isLoading: false,

    fetchCategories: async (idEmpresa: number) => {
      try {
        set({ isLoading: true });
        
        // Try to fetch from API
        try {
          const categories = await catalogService.getCategories(idEmpresa);
          await AsyncStorage.setItem('cached_categories', JSON.stringify(categories));
          set({ categories, isLoading: false });
        } catch (error) {
          // If offline, load from cache
          const cached = await AsyncStorage.getItem('cached_categories');
          if (cached) {
            const categories = JSON.parse(cached);
            set({ categories, isLoading: false });
          } else {
            throw error;
          }
        }
      } catch (error) {
        console.error('Fetch categories error:', error);
        set({ isLoading: false });
      }
    },

    fetchProducts: async (idEmpresa: number, categoriaId?: number) => {
      try {
        set({ isLoading: true });
        
        try {
          const products = await catalogService.getProducts(idEmpresa, categoriaId);
          const cacheKey = categoriaId ? `cached_products_${categoriaId}` : 'cached_products_all';
          await AsyncStorage.setItem(cacheKey, JSON.stringify(products));
          set({ products, isLoading: false });
        } catch (error) {
          // If offline, load from cache
          const cacheKey = categoriaId ? `cached_products_${categoriaId}` : 'cached_products_all';
          const cached = await AsyncStorage.getItem(cacheKey);
          if (cached) {
            const products = JSON.parse(cached);
            set({ products, isLoading: false });
          } else {
            throw error;
          }
        }
      } catch (error) {
        console.error('Fetch products error:', error);
        set({ isLoading: false });
      }
    },

    searchProducts: async (idEmpresa: number, query: string) => {
      try {
        set({ isLoading: true });
        const products = await catalogService.searchProducts(idEmpresa, query);
        set({ products, isLoading: false });
      } catch (error) {
        console.error('Search products error:', error);
        set({ isLoading: false });
      }
    },

    checkConnection: () => {
      NetInfo.fetch().then((state) => {
        set({ isOnline: state.isConnected ?? false });
      });
    },
  };
});
