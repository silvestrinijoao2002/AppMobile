import api, { toFormData } from './api';
import { Order, Client } from '../types';

export const orderService = {
  async searchClientByDocument(idEmpresa: number, documento: string): Promise<Client | null> {
    const formData = toFormData({
      id_empresa: idEmpresa,
      documento,
    });
    try {
      const response = await api.post('/catalogo/publico/cliente-documento', formData);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  async suggestClients(idEmpresa: number, query: string): Promise<Client[]> {
    const formData = toFormData({
      id_empresa: idEmpresa,
      q: query,
    });
    const response = await api.post('/catalogo/publico/sugerir-clientes', formData);
    return response.data;
  },

  async createOrder(
    idEmpresa: number,
    clienteId: number,
    tipoPedido: string,
    tipoOperacao: string,
    formaPagamento: string,
    prazoPagamento?: number,
    observacao?: string
  ): Promise<Order> {
    const formData = toFormData({
      id_empresa: idEmpresa,
      cliente_id: clienteId,
      tipo_pedido: tipoPedido,
      tipo_operacao: tipoOperacao,
      forma_pagamento: formaPagamento,
      prazo_pagamento: prazoPagamento || '',
      observacao: observacao || '',
    });
    const response = await api.post('/catalogo/publico/finalizar', formData);
    return response.data;
  },

  async getOrders(idEmpresa: number, filtro?: string): Promise<Order[]> {
    let url = `/catalogo/publico/pedidos?id_empresa=${idEmpresa}`;
    if (filtro) {
      url += `&filtro=${filtro}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  async getOrderDetails(idEmpresa: number, orderId: number): Promise<Order> {
    const response = await api.get(
      `/catalogo/publico/pedido/${orderId}?id_empresa=${idEmpresa}`
    );
    return response.data;
  },
};
