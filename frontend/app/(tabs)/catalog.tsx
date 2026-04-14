import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  StyleSheet,
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
import CartBottomSheet, { CartBottomSheetRef } from '@/components/CartBottomSheet';

export default function CatalogScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { categories, products, isOnline, isLoading, fetchCategories, fetchProducts, searchProducts } = useCatalogStore();
  const { cart, addToCart, fetchCart } = useCartStore();
  const cartBottomSheetRef = useRef<CartBottomSheetRef>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [addingProduct, setAddingProduct] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id_empresa) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (user?.id_empresa) {
      await fetchCategories(user.id_empresa);
      await fetchProducts(user.id_empresa);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (user?.id_empresa) {
      await fetchCart(user.id_empresa);
    }
    setRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() && user?.id_empresa) {
      await searchProducts(user.id_empresa, query);
    } else if (user?.id_empresa) {
      await fetchProducts(user.id_empresa, selectedCategory || undefined);
    }
  };

  const handleCategoryPress = async (categoryId: number) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    if (user?.id_empresa) {
      await fetchProducts(user.id_empresa, categoryId === selectedCategory ? undefined : categoryId);
    }
  };

  const handleAddToCart = async (productId: number) => {
    if (!user?.id_empresa || !isOnline) {
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
      await addToCart(user.id_empresa, productId, 1);
      await fetchCart(user.id_empresa);
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

  const handleProductPress = (productId: number) => {
    router.push(`/product/${productId}`);
  };

  const renderProduct = ({ item }: any) => {
    const discount = item.percentual_desconto || 0;
    const isAdding = addingProduct === item.id;

    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => handleProductPress(item.id)}
        activeOpacity={0.7}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.imagem_principal || 'https://via.placeholder.com/200' }}
            style={styles.productImage}
            contentFit="cover"
            placeholder="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
          />
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}
          {item.destaque && (
            <View style={styles.highlightBadge}>
              <Text style={styles.highlightText}>Destaque</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productCode}>{item.codigo_interno}</Text>
          <Text style={styles.productName} numberOfLines={2}>
            {item.nome}
          </Text>

          {/* Price */}
          <View style={styles.priceContainer}>
            {item.preco_anterior && item.preco_anterior > item.preco && (
              <Text style={styles.oldPrice}>
                {formatCurrency(item.preco_anterior)}
              </Text>
            )}
            <Text style={styles.price}>
              {formatCurrency(item.preco)}
            </Text>
          </View>

          {/* Stock */}
          <Text style={styles.stock}>
            Estoque: {item.estoque} {item.unidade}
          </Text>

          {/* Add to Cart Button */}
          <TouchableOpacity
            style={[styles.addButton, (!isOnline || isAdding) && styles.addButtonDisabled]}
            onPress={() => handleAddToCart(item.id)}
            disabled={isAdding || !isOnline}
            activeOpacity={0.8}
          >
            {isAdding ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <View style={styles.addButtonContent}>
                <Ionicons name="cart-outline" size={16} color="white" />
                <Text style={styles.addButtonText}>Adicionar</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Catálogo</Text>
            <Text style={styles.headerSubtitle}>Olá, {user?.nome || 'Vendedor'}!</Text>
          </View>
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => cartBottomSheetRef.current?.open()}
          >
            <Ionicons name="cart-outline" size={28} color="#FF6B00" />
            {cart && (cart.quantidade_itens ?? 0) > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {(cart.quantidade_itens ?? 0) > 99 ? '99+' : Math.floor(cart.quantidade_itens ?? 0)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Offline Indicator */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color="#F59E0B" />
            <Text style={styles.offlineText}>Modo Offline</Text>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Categories Horizontal Scroll */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === null && styles.categoryChipActive]}
            onPress={() => {
              setSelectedCategory(null);
              if (user?.id_vendedor) fetchProducts(user.id_vendedor);
            }}
          >
            <Text style={[styles.categoryText, selectedCategory === null && styles.categoryTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryChip, selectedCategory === category.id && styles.categoryChipActive]}
              onPress={() => handleCategoryPress(category.id)}
            >
              <Text style={[styles.categoryText, selectedCategory === category.id && styles.categoryTextActive]}>
                {category.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Products Grid */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Carregando produtos...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>
            {searchQuery ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.productList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#FF6B00']} />
          }
        />
      )}

      {/* Cart Bottom Sheet */}
      <CartBottomSheet ref={cartBottomSheetRef} />
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  cartButton: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  offlineText: {
    color: '#92400E',
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  categoriesContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryChip: {
    marginRight: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  categoryChipActive: {
    backgroundColor: '#FF6B00',
  },
  categoryText: {
    fontWeight: '600',
    color: '#374151',
  },
  categoryTextActive: {
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
  productList: {
    paddingTop: 16,
    paddingBottom: 80,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  productCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  highlightBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  highlightText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    marginTop: 12,
  },
  productCode: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
  },
  priceContainer: {
    marginTop: 8,
  },
  oldPrice: {
    fontSize: 10,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  stock: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingVertical: 8,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
});
w',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
});
