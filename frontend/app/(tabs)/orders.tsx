import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { orderService } from '@/services/order.service';
import { Order } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import Toast from 'react-native-toast-message';

export default function OrdersScreen() {
  const user = useAuthStore((state) => state.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('hoje');

  useEffect(() => {
    loadOrders();
  }, [selectedFilter]);

  const loadOrders = async () => {
    if (!user?.id_vendedor) return;
    
    try {
      setLoading(true);
      const data = await orderService.getOrders(user.id_vendedor, selectedFilter);
      setOrders(data);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível carregar pedidos',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendente':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'aprovado':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'em separacao':
      case 'em separação':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'finalizado':
        return { bg: '#F3F4F6', text: '#374151' };
      case 'cancelado':
        return { bg: '#FEE2E2', text: '#991B1B' };
      default:
        return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const statusStyle = getStatusStyle(item.status);
    
    return (
      <TouchableOpacity style={styles.orderCard} activeOpacity={0.7}>
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={styles.orderNumberRow}>
              <Text style={styles.orderNumber}>#{item.numero}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.clientName}>{item.cliente.nome}</Text>
          </View>
          <Text style={styles.orderTotal}>{formatCurrency(item.total)}</Text>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.orderDetail}>
            <Ionicons
              name={item.tipo_pedido === 'delivery' ? 'car-outline' : 'storefront-outline'}
              size={16}
              color="#6B7280"
            />
            <Text style={styles.orderDetailText}>{item.tipo_pedido}</Text>
          </View>
          <View style={styles.orderDetail}>
            <Ionicons name="card-outline" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>{item.forma_pagamento}</Text>
          </View>
          <View style={styles.orderDetail}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.orderDetailText}>
              {new Date(item.data_criacao).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pedidos</Text>

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          {[
            { label: 'Hoje', value: 'hoje' },
            { label: 'Semana', value: 'semana' },
            { label: 'Mês', value: 'mes' },
            { label: 'Todos', value: 'todos' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[styles.filterChip, selectedFilter === filter.value && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter.value)}
            >
              <Text style={[styles.filterText, selectedFilter === filter.value && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Carregando pedidos...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>Nenhum pedido encontrado</Text>
          <Text style={styles.emptySubtext}>Seus pedidos aparecerão aqui</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.ordersList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#FF6B00']} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  filtersContainer: {
    marginTop: 12,
    marginHorizontal: -4,
  },
  filterChip: {
    marginHorizontal: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: '#FF6B00',
  },
  filterText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#374151',
  },
  filterTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6B7280',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  ordersList: {
    padding: 16,
    paddingBottom: 80,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusBadge: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  clientName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderDetailText: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
});
