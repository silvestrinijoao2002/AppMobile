import api, { toFormData } from './api';
import { Cart } from '../types';

export const cartService = {
  async getCart(idEmpresa: number): Promise<Cart> {
    const response = await api.get(`/catalogo/publico/carrinho?id_empresa=${idEmpresa}`);
    return response.data;
  },

  async addToCart(
    idEmpresa: number,
    produtoId: number,
    quantidade: number,
    observacao?: string
  ): Promise<Cart> {
    const formData = toFormData({
      id_empresa: idEmpresa,
      produto_id: produtoId,
      quantidade,
      observacao: observacao || '',
    });
    const response = await api.post('/catalogo/publico/carrinho/adicionar', formData);
    return response.data;
  },

  async updateCartItem(
    idEmpresa: number,
    itemId: number,
    quantidade: number
  ): Promise<Cart> {
    const formData = toFormData({
      id_empresa: idEmpresa,
      item_id: itemId,
      quantidade,
    });
    const response = await api.post('/catalogo/publico/carrinho/atualizar', formData);
    return response.data;
  },

  async removeFromCart(idEmpresa: number, itemId: number): Promise<Cart> {
    const formData = toFormData({
      id_empresa: idEmpresa,
      item_id: itemId,
    });
    const response = await api.post('/catalogo/publico/carrinho/remover', formData);
    return response.data;
  },

  async clearCart(idEmpresa: number): Promise<void> {
    const formData = toFormData({ id_empresa: idEmpresa });
    await api.post('/catalogo/publico/carrinho/limpar', formData);
  },
};
