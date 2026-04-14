import React, { useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { formatCurrency } from '@/utils/formatters';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export interface CartBottomSheetRef {
  open: () => void;
  close: () => void;
}

const CartBottomSheet = forwardRef<CartBottomSheetRef>((props, ref) => {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '90%'], []);
  const user = useAuthStore((state) => state.user);
  const { cart, updateCartItem, removeFromCart, fetchCart } = useCartStore();
  const [updatingItem, setUpdatingItem] = React.useState<number | null>(null);
  const router = useRouter();

  useImperativeHandle(ref, () => ({
    open: () => bottomSheetRef.current?.expand(),
    close: () => bottomSheetRef.current?.close(),
  }));

  useEffect(() => {
    if (user?.id_vendedor) {
      fetchCart(user.id_vendedor);
    }
  }, [user]);

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (!user?.id_vendedor || newQuantity < 1) return;

    setUpdatingItem(itemId);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await updateCartItem(user.id_vendedor, itemId, newQuantity);
      await fetchCart(user.id_vendedor);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao atualizar',
        text2: error.response?.data?.message || 'Tente novamente',
      });
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!user?.id_vendedor) return;

    setUpdatingItem(itemId);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await removeFromCart(user.id_vendedor, itemId);
      await fetchCart(user.id_vendedor);
      Toast.show({
        type: 'success',
        text1: 'Item removido',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erro ao remover',
        text2: error.response?.data?.message || 'Tente novamente',
      });
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) return;
    bottomSheetRef.current?.close();
    router.push('/checkout');
  };

  const renderItem = ({ item }: any) => {
    const isUpdating = updatingItem === item.id;

    return (
      <View style={styles.cartItem}>
        <Image
          source={{ uri: item.produto.imagem_principal || 'https://via.placeholder.com/80' }}
          style={styles.itemImage}
          contentFit="cover"
        />

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.produto.nome}
          </Text>
          <Text style={styles.itemCode}>{item.produto.codigo_interno}</Text>
          <Text style={styles.itemPrice}>{formatCurrency(item.produto.preco)}</Text>
          {item.observacao && (
            <Text style={styles.itemObs} numberOfLines={1}>
              Obs: {item.observacao}
            </Text>
          )}
        </View>

        <View style={styles.itemActions}>
          <View style={styles.quantityControl}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(item.id, item.quantidade - 1)}
              disabled={isUpdating || item.quantidade <= 1}
            >
              <Ionicons name="remove" size={16} color="#FF6B00" />
            </TouchableOpacity>

            {isUpdating ? (
              <ActivityIndicator size="small" color="#FF6B00" style={styles.quantityValue} />
            ) : (
              <Text style={styles.quantityValue}>{item.quantidade}</Text>
            )}

            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(item.id, item.quantidade + 1)}
              disabled={isUpdating}
            >
              <Ionicons name="add" size={16} color="#FF6B00" />
            </TouchableOpacity>
          </View>

          <Text style={styles.itemSubtotal}>{formatCurrency(item.subtotal)}</Text>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.id)}
            disabled={isUpdating}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.indicator}
    >
      <BottomSheetView style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Carrinho</Text>
          {cart && (cart.quantidade_itens ?? 0) > 0 && (
            <View style={styles.itemCount}>
              <Text style={styles.itemCountText}>{Math.floor(cart.quantidade_itens ?? 0)} itens</Text>
            </View>
          )}
        </View>

        {!cart || (cart.itens ?? []).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Seu carrinho está vazio</Text>
            <Text style={styles.emptySubtext}>Adicione produtos para continuar</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={cart.itens}
              renderItem={renderItem}
              keyExtractor={(item) => item.row_id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />

            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>{formatCurrency(cart.subtotal)}</Text>
              </View>

              {cart.desconto && cart.desconto > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.discountLabel}>Desconto:</Text>
                  <Text style={styles.discountValue}>-{formatCurrency(cart.desconto)}</Text>
                </View>
              )}

              <View style={[styles.totalRow, styles.totalRowFinal]}>
                <Text style={styles.finalLabel}>Total:</Text>
                <Text style={styles.finalValue}>{formatCurrency(cart.subtotal)}</Text>
              </View>

              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={handleCheckout}
                activeOpacity={0.8}
              >
                <Text style={styles.checkoutButtonText}>Finalizar Pedido</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  indicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
    height: 4,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  itemCount: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemCode: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  itemObs: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 20,
    textAlign: 'center',
  },
  itemSubtotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginVertical: 8,
  },
  removeButton: {
    padding: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    padding: 20,
    backgroundColor: 'white',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  discountLabel: {
    fontSize: 14,
    color: '#22C55E',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  totalRowFinal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  finalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  finalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  checkoutButton: {
    backgroundColor: '#22C55E',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default CartBottomSheet;
