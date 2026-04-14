import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { catalogService } from '@/services/catalog.service';
import { Product } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { addToCart, fetchCart } = useCartStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [observacao, setObservacao] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!user?.id_empresa || !id) return;

    try {
      setLoading(true);
      const data = await catalogService.getProductDetails(user.id_empresa, Number(id));
      setProduct(data);
      setQuantity(data.qtd_minima_embalagem || 1);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao carregar produto',
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user?.id_empresa || !product) return;

    setAdding(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await addToCart(user.id_empresa, product.id, quantity, observacao);
      await fetchCart(user.id_empresa);
      Toast.show({
        type: 'success',
        text1: 'Adicionado ao carrinho!',
        text2: `${quantity} ${product.unidade} de ${product.nome}`,
      });
      router.back();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: error.response?.data?.message || 'Não foi possível adicionar',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleQuantityChange = (delta: number) => {
    const minQty = product?.qtd_minima_embalagem || 1;
    const newQty = quantity + delta * minQty;
    if (newQty >= minQty) {
      setQuantity(newQty);
    }
  };

  const getQuantityLabel = () => {
    if (!product) return '';
    const minQty = product.qtd_minima_embalagem || 1;
    const boxes = quantity / minQty;
    if (minQty > 1) {
      return `${boxes} cx (${quantity} un)`;
    }
    return `${quantity} ${product.unidade}`;
  };

  const images = product?.imagens || (product?.imagem_principal ? [product.imagem_principal] : []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </SafeAreaView>
    );
  }

  if (!product) return null;

  const discount = product.percentual_desconto || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Produto</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        {images.length > 0 && (
          <View>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {images.map((img, index) => (
                <Image
                  key={index}
                  source={{ uri: img }}
                  style={styles.productImage}
                  contentFit="contain"
                />
              ))}
            </ScrollView>

            {/* Dots Indicator */}
            {images.length > 1 && (
              <View style={styles.dotsContainer}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[styles.dot, currentImageIndex === index && styles.dotActive]}
                  />
                ))}
              </View>
            )}

            {/* Discount Badge */}
            {discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discount}%</Text>
              </View>
            )}
          </View>
        )}

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Text style={styles.productName}>{product.nome}</Text>
              <Text style={styles.productCode}>Cód: {product.codigo_interno}</Text>
            </View>
            <View style={styles.stockBadge}>
              <Ionicons name="cube-outline" size={14} color="#6B7280" />
              <Text style={styles.stockText}>{product.estoque} {product.unidade}</Text>
            </View>
          </View>

          {/* Price Block */}
          <View style={styles.priceBlock}>
            {product.preco_anterior && product.preco_anterior > product.preco && (
              <Text style={styles.oldPrice}>{formatCurrency(product.preco_anterior)}</Text>
            )}
            <View style={styles.currentPriceRow}>
              <Text style={styles.currentPrice}>{formatCurrency(product.preco)}</Text>
              {discount > 0 && (
                <View style={styles.discountTag}>
                  <Text style={styles.discountTagText}>-{discount}% OFF</Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {product.descricao && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descrição</Text>
              <Text style={styles.description}>{product.descricao}</Text>
            </View>
          )}

          {/* Composition */}
          {product.composicao && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Composição</Text>
              <Text style={styles.description}>{product.composicao}</Text>
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantidade</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(-1)}
                disabled={quantity <= (product.qtd_minima_embalagem || 1)}
              >
                <Ionicons name="remove-circle" size={32} color="#FF6B00" />
              </TouchableOpacity>

              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityValue}>{getQuantityLabel()}</Text>
                {product.qtd_minima_embalagem > 1 && (
                  <Text style={styles.quantityHint}>
                    Mínimo: {product.qtd_minima_embalagem} un/cx
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(1)}
              >
                <Ionicons name="add-circle" size={32} color="#FF6B00" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Observation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observação (opcional)</Text>
            <TextInput
              style={styles.observationInput}
              placeholder="Ex: embalar separadamente"
              value={observacao}
              onChangeText={setObservacao}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addButton, adding && styles.addButtonDisabled]}
          onPress={handleAddToCart}
          disabled={adding}
          activeOpacity={0.8}
        >
          {adding ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="cart" size={24} color="white" />
              <Text style={styles.addButtonText}>Adicionar ao Carrinho</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  content: {
    flex: 1,
  },
  productImage: {
    width: width,
    height: width,
    backgroundColor: '#F9FAFB',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#FF6B00',
    width: 24,
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleLeft: {
    flex: 1,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  productCode: {
    fontSize: 14,
    color: '#6B7280',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stockText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '600',
  },
  priceBlock: {
    marginBottom: 24,
  },
  oldPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  currentPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  discountTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  discountTagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
  },
  quantityButton: {
    padding: 8,
  },
  quantityDisplay: {
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  quantityHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  observationInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: 'white',
  },
  addButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});
