import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useCartStore } from '@/stores/cartStore';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { formatCurrency } from '@/utils/formatters';
import { Image } from 'expo-image';

export default function CatalogScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { categories, products, isOnline, isLoading, fetchCategories, fetchProducts, searchProducts } = useCatalogStore();
  const { cart, addToCart, fetchCart } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [addingProduct, setAddingProduct] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id_vendedor) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (user?.id_vendedor) {
      await fetchCategories(user.id_vendedor);
      await fetchProducts(user.id_vendedor);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (user?.id_vendedor) {
      await fetchCart(user.id_vendedor);
    }
    setRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() && user?.id_vendedor) {
      await searchProducts(user.id_vendedor, query);
    } else if (user?.id_vendedor) {
      await fetchProducts(user.id_vendedor, selectedCategory || undefined);
    }
  };

  const handleCategoryPress = async (categoryId: number) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    if (user?.id_vendedor) {
      await fetchProducts(user.id_vendedor, categoryId === selectedCategory ? undefined : categoryId);
    }
  };

  const handleAddToCart = async (productId: number) => {
    if (!user?.id_vendedor || !isOnline) {
      Toast.show({
        type: 'error',
        text1: 'Sem conexão',
        text2: 'Você precisa estar online para adicionar ao carrinho',
      });
      return;
    }

    setAddingProduct(productId);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await addToCart(user.id_vendedor, productId, 1);
      await fetchCart(user.id_vendedor);
      Toast.show({
        type: 'success',
        text1: 'Produto adicionado!',
        position: 'bottom',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: error.response?.data?.message || 'Não foi possível adicionar',
      });
    } finally {
      setAddingProduct(null);
    }
  };

  const renderProduct = ({ item }: any) => {
    const discount = item.percentual_desconto || 0;
    const isAdding = addingProduct === item.id;

    return (
      <View className="w-[48%] bg-white rounded-2xl p-3 mb-4 shadow-sm">
        {/* Product Image */}
        <View className="relative">
          <Image
            source={{ uri: item.imagem_principal || 'https://via.placeholder.com/200' }}
            style={{ width: '100%', height: 150 }}
            contentFit="cover"
            className="rounded-xl"
            placeholder="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
          />
          {discount > 0 && (
            <View className="absolute top-2 right-2 bg-red-500 rounded-full px-2 py-1">
              <Text className="text-white text-xs font-bold">-{discount}%</Text>
            </View>
          )}
          {item.destaque && (
            <View className="absolute top-2 left-2 bg-secondary rounded-full px-2 py-1">
              <Text className="text-white text-xs font-bold">Destaque</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View className="mt-3">
          <Text className="text-xs text-gray-500 mb-1">{item.codigo_interno}</Text>
          <Text className="text-sm font-semibold text-gray-800 leading-5" numberOfLines={2}>
            {item.nome}
          </Text>

          {/* Price */}
          <View className="mt-2">
            {item.preco_anterior && item.preco_anterior > item.preco && (
              <Text className="text-xs text-gray-400 line-through">
                {formatCurrency(item.preco_anterior)}
              </Text>
            )}
            <Text className="text-lg font-bold text-primary">
              {formatCurrency(item.preco)}
            </Text>
          </View>

          {/* Stock */}
          <Text className="text-xs text-gray-500 mt-1">
            Estoque: {item.estoque} {item.unidade}
          </Text>

          {/* Add to Cart Button */}
          <TouchableOpacity
            className="bg-primary rounded-xl py-2 mt-3 flex-row items-center justify-center"
            onPress={() => handleAddToCart(item.id)}
            disabled={isAdding || !isOnline}
            activeOpacity={0.8}
          >
            {isAdding ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="cart-outline" size={16} color="white" />
                <Text className="text-white font-semibold text-sm ml-2">Adicionar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-2xl font-bold text-gray-800">Catálogo</Text>
            <Text className="text-sm text-gray-500">Olá, {user?.nome || 'Vendedor'}!</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/cart' as any)}
            className="relative"
          >
            <Ionicons name="cart-outline" size={28} color="#FF6B00" />
            {cart && cart.quantidade_total > 0 && (
              <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {cart.quantidade_total > 99 ? '99+' : cart.quantidade_total}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Offline Indicator */}
        {!isOnline && (
          <View className="bg-amber-100 rounded-lg px-3 py-2 flex-row items-center mb-3">
            <Ionicons name="cloud-offline-outline" size={16} color="#F59E0B" />
            <Text className="text-amber-700 text-xs ml-2 font-medium">Modo Offline</Text>
          </View>
        )}

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2">
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {/* Categories Horizontal Scroll */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="bg-white border-b border-gray-200"
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        >
          <TouchableOpacity
            className={`mr-3 px-4 py-2 rounded-full ${
              selectedCategory === null ? 'bg-primary' : 'bg-gray-100'
            }`}
            onPress={() => {
              setSelectedCategory(null);
              if (user?.id_vendedor) fetchProducts(user.id_vendedor);
            }}
          >
            <Text
              className={`font-semibold ${
                selectedCategory === null ? 'text-white' : 'text-gray-700'
              }`}
            >
              Todos
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              className={`mr-3 px-4 py-2 rounded-full ${
                selectedCategory === category.id ? 'bg-primary' : 'bg-gray-100'
              }`}
              onPress={() => handleCategoryPress(category.id)}
            >
              <Text
                className={`font-semibold ${
                  selectedCategory === category.id ? 'text-white' : 'text-gray-700'
                }`}
              >
                {category.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Products Grid */}
      {isLoading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text className="text-gray-500 mt-4">Carregando produtos...</Text>
        </View>
      ) : products.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
          <Text className="text-gray-500 mt-4 text-center">
            {searchQuery ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#FF6B00']} />
          }
        />
      )}
    </SafeAreaView>
  );
}
