import api from './api';
import { Category, Product } from '../types';

export const catalogService = {
  async getCategories(idEmpresa: number): Promise<Category[]> {
    const response = await api.get(`/api/mobile/catalogo/categorias?id_empresa=${idEmpresa}`);
    return response.data.categorias ?? [];
  },

  async getProducts(idEmpresa: number, categoriaId?: number, pagina: number = 1): Promise<Product[]> {
    let url = `/api/mobile/catalogo/produtos?id_empresa=${idEmpresa}&pagina=${pagina}`;
    if (categoriaId) {
      url += `&categoria=${categoriaId}`;
    }
    const response = await api.get(url);
    return response.data.produtos ?? [];
  },

  async getProductDetails(idEmpresa: number, productId: number): Promise<Product> {
    const response = await api.get(
      `/api/mobile/catalogo/produto/${productId}?id_empresa=${idEmpresa}`
    );
    return response.data.produto;
  },

  async searchProducts(idEmpresa: number, query: string): Promise<Product[]> {
    const response = await api.get(
      `/api/mobile/catalogo/produtos?id_empresa=${idEmpresa}&q=${encodeURIComponent(query)}`
    );
    return response.data.produtos ?? [];
  },
};
