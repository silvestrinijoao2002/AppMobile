import api, { toFormData } from './api';
import { Cart } from '../types';

export const cartService = {
  async getCart(idEmpresa: number): Promise<Cart> {
    const response = await api.get(`/catalogo/publico/carrinho?id_empresa=${idEmpresa}`);
    // Backend retorna { success, cart: { subtotal, custo_total, quantidade_itens, itens[] } }
    return response.data.cart ?? response.data;
  },

  async addToCart(
    idEmpresa: number,
    produtoId: number,
    quantidade: number,
    observacao?: string
  ): Promise<Cart> {
    const formData = toFormData({
      id_empresa: idEmpresa,
      id_produto: produtoId,   // backend exige id_produto (não produto_id)
      quantidade,
      observacao: observacao || '',
    });
    const response = await api.post('/catalogo/publico/carrinho/adicionar', formData);
    return response.data.cart ?? response.data;
  },

  async updateCartItem(
    idEmpresa: number,
    rowId: string,
    quantidade: number
  ): Promise<Cart> {
    const formData = toFormData({
      id_empresa: idEmpresa,
      row_id: rowId,           // backend exige row_id (não item_id)
      quantidade,
    });
    const response = await api.post('/catalogo/publico/carrinho/atualizar', formData);
    return response.data.cart ?? response.data;
  },

  async removeFromCart(idEmpresa: number, rowId: string): Promise<Cart> {
    const formData = toFormData({
      id_empresa: idEmpresa,
      row_id: rowId,           // backend exige row_id (não item_id)
    });
    const response = await api.post('/catalogo/publico/carrinho/remover', formData);
    return response.data.cart ?? response.data;
  },

  async clearCart(idEmpresa: number): Promise<void> {
    // Não existe endpoint de limpar no backend — removemos item a item via store
    // (ou simplesmente deixamos o carrinho ser limpo após finalizar o pedido)
  },
};
