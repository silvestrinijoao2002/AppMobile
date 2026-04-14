export interface User {
  id_vendedor: number;
  nome: string;
  email?: string;
  logged_in: boolean;
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
  id: number;
  produto_id: number;
  produto: Product;
  quantidade: number;
  observacao?: string;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  desconto: number;
  total: number;
  quantidade_total: number;
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
