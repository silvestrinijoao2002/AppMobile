export interface User {
  id_empresa: number;
  id_login: number;
  id_vendedor: number;
  nome: string;
  email?: string;
  is_vendedor: boolean;
  logged_in: boolean;
  success?: boolean;
}

export interface Category {
  id: number;
  nome: string;
  imagem?: string;
  quantidade_produtos?: number;
}

export interface Product {
  id: number;
  codigo_interno: string;
  nome: string;
  descricao?: string;
  preco: number;
  preco_anterior?: number;
  percentual_desconto?: number;
  unidade: string;
  estoque: number;
  qtd_minima_embalagem: number;
  imagem_principal?: string;
  imagens?: string[];
  video?: string;
  codigo_barras?: string;
  em_oferta?: boolean;
  destaque?: boolean;
  composicao?: string;
}

export interface CartItem {
  row_id: string;
  id_produto: number;
  id_kit?: number;
  nome: string;
  preco: number;
  quantidade: number;
  quantidade_real: number;
  subtotal: number;
  imagem?: string;
  observacao?: string;
  unidade?: string;
}

export interface Cart {
  itens: CartItem[];
  subtotal: number;
  custo_total: number;
  quantidade_itens: number;
}

export interface Client {
  id?: number;
  nome: string;
  cpf_cnpj: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
}

export interface Order {
  id: number;
  numero: string;
  cliente: Client;
  tipo_pedido: 'retirada' | 'delivery';
  tipo_operacao: 'normal' | 'consignado';
  forma_pagamento: 'dinheiro' | 'cartao' | 'pix' | 'boleto';
  prazo_pagamento?: number;
  observacao?: string;
  subtotal: number;
  desconto: number;
  total: number;
  status: string;
  data_criacao: string;
  items: CartItem[];
}
