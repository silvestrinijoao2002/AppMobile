import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { orderService } from '@/services/order.service';
import { Client } from '@/types';
import { formatCurrency, formatDocument, formatPhone } from '@/utils/formatters';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

export default function CheckoutScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const cart = useCartStore((state) => state.cart);
  const [step, setStep] = useState(1);

  // Step 1: Client data
  const [documento, setDocumento] = useState('');
  const [searchingClient, setSearchingClient] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  // Step 2: Order data
  const [tipoPedido, setTipoPedido] = useState<'balcao' | 'delivery' | 'mesa'>('balcao');
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const [observacao, setObservacao] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Carrinho vazio',
        text2: 'Adicione produtos antes de finalizar',
      });
      router.back();
    }
  }, [cart]);

  const maskDocument = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      // CPF
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    } else {
      // CNPJ
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    }
  };

  const handleSearchClient = async () => {
    if (!user?.id_vendedor || !documento) return;

    const cleanDoc = documento.replace(/\D/g, '');
    if (cleanDoc.length < 11) {
      Toast.show({ type: 'error', text1: 'CPF/CNPJ inválido' });
      return;
    }

    setSearchingClient(true);
    try {
      const foundClient = await orderService.searchClientByDocument(user.id_vendedor, cleanDoc);
      if (foundClient) {
        setClient(foundClient);
        setShowNewClientForm(false);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({
          type: 'success',
          text1: 'Cliente encontrado!',
        });
      } else {
        setShowNewClientForm(true);
        setNome('');
        setTelefone('');
        setEmail('');
        Toast.show({
          type: 'info',
          text1: 'Cliente não encontrado',
          text2: 'Preencha os dados para cadastrar',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro na busca',
      });
    } finally {
      setSearchingClient(false);
    }
  };

  const handleConfirmClient = () => {
    if (client || (showNewClientForm && nome && documento)) {
      setStep(2);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Preencha os dados do cliente',
      });
    }
  };

  const handleSubmitOrder = async () => {
    if (!user?.id_vendedor || !cart) return;

    setSubmitting(true);
    try {
      const orderData = {
        id_empresa: user.id_vendedor,
        tipo_pedido: tipoPedido,
        tipo_operacao: 'pedido',
        cliente_nome: client?.nome || nome,
        cliente_telefone: client?.telefone || telefone,
        cliente_documento: documento.replace(/\D/g, ''),
        id_cliente_existente: client?.id || 0,
        id_forma_pagamento: 1,
        forma_pagamento: formaPagamento,
        observacao: observacao || '',
      };

      const order = await orderService.createOrder(
        orderData.id_empresa,
        orderData.id_cliente_existente,
        orderData.tipo_pedido,
        orderData.tipo_operacao,
        orderData.forma_pagamento,
        undefined,
        orderData.observacao
      );

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Pedido confirmado!',
        text2: `Pedido #${order.numero}`,
      });

      router.replace({
        pathname: '/order-success',
        params: {
          orderId: order.id,
          orderNumber: order.numero,
          clientName: order.cliente.nome,
          total: order.total,
          paymentMethod: order.forma_pagamento,
        },
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao finalizar pedido',
        text2: error.response?.data?.message || 'Tente novamente',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finalizar Pedido</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]}>
            <Text style={[styles.progressDotText, step >= 1 && styles.progressDotTextActive]}>1</Text>
          </View>
          <Text style={[styles.progressLabel, step >= 1 && styles.progressLabelActive]}>Cliente</Text>
        </View>

        <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />

        <View style={styles.progressStep}>
          <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]}>
            <Text style={[styles.progressDotText, step >= 2 && styles.progressDotTextActive]}>2</Text>
          </View>
          <Text style={[styles.progressLabel, step >= 2 && styles.progressLabelActive]}>Pedido</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {step === 1 ? (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Identificar Cliente</Text>

              {/* Document Search */}
              <View style={styles.section}>
                <Text style={styles.label}>CPF ou CNPJ</Text>
                <View style={styles.searchRow}>
                  <TextInput
                    style={styles.documentInput}
                    placeholder="000.000.000-00"
                    value={documento}
                    onChangeText={(text) => setDocumento(maskDocument(text))}
                    keyboardType="numeric"
                    maxLength={18}
                  />
                  <TouchableOpacity
                    style={styles.searchButton}
                    onPress={handleSearchClient}
                    disabled={searchingClient}
                  >
                    {searchingClient ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Ionicons name="search" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Found Client */}
              {client && (
                <View style={styles.clientCard}>
                  <View style={styles.clientHeader}>
                    <Ionicons name="checkmark-circle" size={32} color="#22C55E" />
                    <Text style={styles.clientFoundText}>Cliente encontrado!</Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{client.nome}</Text>
                    {client.telefone && <Text style={styles.clientDetail}>Tel: {client.telefone}</Text>}
                    {client.cidade && <Text style={styles.clientDetail}>Cidade: {client.cidade}</Text>}
                  </View>
                </View>
              )}

              {/* New Client Form */}
              {showNewClientForm && (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Novo Cliente</Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Nome/Razão Social *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Digite o nome"
                      value={nome}
                      onChangeText={setNome}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Telefone/WhatsApp *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="(00) 00000-0000"
                      value={telefone}
                      onChangeText={setTelefone}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Email (opcional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="email@exemplo.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              )}

              {/* Confirm Client Button */}
              {(client || showNewClientForm) && (
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmClient}
                >
                  <Text style={styles.confirmButtonText}>Confirmar Cliente</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Dados do Pedido</Text>

              {/* Order Type */}
              <View style={styles.section}>
                <Text style={styles.label}>Tipo de Pedido</Text>
                <View style={styles.orderTypeRow}>
                  {[
                    { value: 'balcao', label: 'Balcão', icon: 'storefront' },
                    { value: 'delivery', label: 'Delivery', icon: 'car' },
                    { value: 'mesa', label: 'Mesa', icon: 'restaurant' },
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.orderTypeCard,
                        tipoPedido === type.value && styles.orderTypeCardActive,
                      ]}
                      onPress={() => setTipoPedido(type.value as any)}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={28}
                        color={tipoPedido === type.value ? '#FF6B00' : '#9CA3AF'}
                      />
                      <Text
                        style={[
                          styles.orderTypeLabel,
                          tipoPedido === type.value && styles.orderTypeLabelActive,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Payment Method */}
              <View style={styles.section}>
                <Text style={styles.label}>Forma de Pagamento</Text>
                <View style={styles.paymentList}>
                  {[
                    { value: 'dinheiro', label: 'Dinheiro', icon: 'cash' },
                    { value: 'cartao', label: 'Cartão', icon: 'card' },
                    { value: 'pix', label: 'PIX', icon: 'phone-portrait' },
                    { value: 'boleto', label: 'Boleto', icon: 'barcode' },
                  ].map((payment) => (
                    <TouchableOpacity
                      key={payment.value}
                      style={[
                        styles.paymentItem,
                        formaPagamento === payment.value && styles.paymentItemActive,
                      ]}
                      onPress={() => setFormaPagamento(payment.value)}
                    >
                      <Ionicons
                        name={payment.icon as any}
                        size={24}
                        color={formaPagamento === payment.value ? '#FF6B00' : '#6B7280'}
                      />
                      <Text
                        style={[
                          styles.paymentLabel,
                          formaPagamento === payment.value && styles.paymentLabelActive,
                        ]}
                      >
                        {payment.label}
                      </Text>
                      {formaPagamento === payment.value && (
                        <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Observations */}
              <View style={styles.section}>
                <Text style={styles.label}>Observações (opcional)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Ex: entregar pela manhã"
                  value={observacao}
                  onChangeText={setObservacao}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Order Summary */}
              {cart && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Resumo do Pedido</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Itens ({cart.quantidade_total}):</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(cart.subtotal)}</Text>
                  </View>
                  {cart.desconto > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: '#22C55E' }]}>Desconto:</Text>
                      <Text style={{ color: '#22C55E', fontWeight: '600' }}>
                        -{formatCurrency(cart.desconto)}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                    <Text style={styles.summaryTotalLabel}>Total:</Text>
                    <Text style={styles.summaryTotalValue}>{formatCurrency(cart.total)}</Text>
                  </View>
                </View>
              )}

              {/* Submit Order Button */}
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitOrder}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                    <Text style={styles.submitButtonText}>Confirmar Pedido</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Back Button */}
              <TouchableOpacity style={styles.backToStep1} onPress={() => setStep(1)}>
                <Text style={styles.backToStep1Text}>Voltar para Cliente</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressDotActive: {
    backgroundColor: '#FF6B00',
  },
  progressDotText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  progressDotTextActive: {
    color: 'white',
  },
  progressLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  progressLabelActive: {
    color: '#1F2937',
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  progressLineActive: {
    backgroundColor: '#FF6B00',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
  },
  documentInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 12,
  },
  searchButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientFoundText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
    marginLeft: 12,
  },
  clientInfo: {},
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  clientDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#22C55E',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  orderTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderTypeCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  orderTypeCardActive: {
    borderColor: '#FF6B00',
    backgroundColor: '#FFF7ED',
  },
  orderTypeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '600',
  },
  orderTypeLabelActive: {
    color: '#FF6B00',
  },
  paymentList: {},
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentItemActive: {
    borderColor: '#FF6B00',
    backgroundColor: '#FFF7ED',
  },
  paymentLabel: {
    flex: 1,
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 12,
    fontWeight: '600',
  },
  paymentLabelActive: {
    color: '#1F2937',
  },
  textArea: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryRowTotal: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  submitButton: {
    backgroundColor: '#22C55E',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  backToStep1: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  backToStep1Text: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});
