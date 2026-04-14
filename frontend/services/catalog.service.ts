import api from './api';
import { Category, Product } from '../types';

export const catalogService = {
  async getCategories(idEmpresa: number): Promise<Category[]> {
    const response = await api.get(`/catalogo/publico?id_empresa=${idEmpresa}`);
    return response.data;
  },

  async getProducts(idEmpresa: number, categoriaId?: number): Promise<Product[]> {
    let url = `/catalogo/publico/produtos?id_empresa=${idEmpresa}`;
    if (categoriaId) {
      url += `&categoria_id=${categoriaId}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  async getProductDetails(idEmpresa: number, productId: number): Promise<Product> {
    const response = await api.get(
      `/catalogo/publico/produto/${productId}?id_empresa=${idEmpresa}`
    );
    return response.data;
  },

  async searchProducts(idEmpresa: number, query: string): Promise<Product[]> {
    const response = await api.get(
      `/catalogo/publico/buscar?id_empresa=${idEmpresa}&q=${encodeURIComponent(query)}`
    );
    return response.data;
  },
};
