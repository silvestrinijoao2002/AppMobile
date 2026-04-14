import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-700';
      case 'aprovado':
        return 'bg-green-100 text-green-700';
      case 'em separacao':
      case 'em separação':
        return 'bg-blue-100 text-blue-700';
      case 'finalizado':
        return 'bg-gray-100 text-gray-700';
      case 'cancelado':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-lg font-bold text-gray-800">#{item.numero}</Text>
            <View className={`ml-3 px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
              <Text className="text-xs font-semibold">{item.status}</Text>
            </View>
          </View>
          <Text className="text-sm text-gray-600 mt-1">{item.cliente.nome}</Text>
        </View>
        <Text className="text-xl font-bold text-primary">
          {formatCurrency(item.total)}
        </Text>
      </View>

      <View className="border-t border-gray-100 pt-3 flex-row justify-between">
        <View className="flex-row items-center">
          <Ionicons
            name={item.tipo_pedido === 'delivery' ? 'car-outline' : 'storefront-outline'}
            size={16}
            color="#6B7280"
          />
          <Text className="text-xs text-gray-600 ml-1 capitalize">{item.tipo_pedido}</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="card-outline" size={16} color="#6B7280" />
          <Text className="text-xs text-gray-600 ml-1 capitalize">
            {item.forma_pagamento}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text className="text-xs text-gray-600 ml-1">
            {new Date(item.data_criacao).toLocaleDateString('pt-BR')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">Pedidos</Text>

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 -mx-1"
        >
          {[
            { label: 'Hoje', value: 'hoje' },
            { label: 'Semana', value: 'semana' },
            { label: 'Mês', value: 'mes' },
            { label: 'Todos', value: 'todos' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.value}
              className={`mx-1 px-4 py-2 rounded-full ${
                selectedFilter === filter.value ? 'bg-primary' : 'bg-gray-100'
              }`}
              onPress={() => setSelectedFilter(filter.value)}
            >
              <Text
                className={`font-semibold text-sm ${
                  selectedFilter === filter.value ? 'text-white' : 'text-gray-700'
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text className="text-gray-500 mt-4">Carregando pedidos...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
          <Text className="text-gray-500 mt-4 text-center">Nenhum pedido encontrado</Text>
          <Text className="text-gray-400 text-sm mt-2 text-center">
            Seus pedidos aparecerão aqui
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#FF6B00']} />
          }
        />
      )}
    </SafeAreaView>
  );
}
