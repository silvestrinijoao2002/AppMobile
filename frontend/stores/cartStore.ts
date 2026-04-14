import { create } from 'zustand';
import { Cart } from '@/types';
import { cartService } from '@/services/cart.service';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  
  fetchCart: (idEmpresa: number) => Promise<void>;
  addToCart: (idEmpresa: number, produtoId: number, quantidade: number, observacao?: string) => Promise<void>;
  updateCartItem: (idEmpresa: number, itemId: number, quantidade: number) => Promise<void>;
  removeFromCart: (idEmpresa: number, itemId: number) => Promise<void>;
  clearCart: (idEmpresa: number) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,

  fetchCart: async (idEmpresa: number) => {
    try {
      set({ isLoading: true });
      const cart = await cartService.getCart(idEmpresa);
      set({ cart, isLoading: false });
    } catch (error) {
      console.error('Fetch cart error:', error);
      set({ isLoading: false });
    }
  },

  addToCart: async (idEmpresa: number, produtoId: number, quantidade: number, observacao?: string) => {
    try {
      const cart = await cartService.addToCart(idEmpresa, produtoId, quantidade, observacao);
      set({ cart });
    } catch (error) {
      console.error('Add to cart error:', error);
      throw error;
    }
  },

  updateCartItem: async (idEmpresa: number, itemId: number, quantidade: number) => {
    try {
      const cart = await cartService.updateCartItem(idEmpresa, itemId, quantidade);
      set({ cart });
    } catch (error) {
      console.error('Update cart error:', error);
      throw error;
    }
  },

  removeFromCart: async (idEmpresa: number, itemId: number) => {
    try {
      const cart = await cartService.removeFromCart(idEmpresa, itemId);
      set({ cart });
    } catch (error) {
      console.error('Remove from cart error:', error);
      throw error;
    }
  },

  clearCart: async (idEmpresa: number) => {
    try {
      await cartService.clearCart(idEmpresa);
      set({ cart: null });
    } catch (error) {
      console.error('Clear cart error:', error);
      throw error;
    }
  },
}));
