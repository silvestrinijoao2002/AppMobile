import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/utils/formatters';
import * as Haptics from 'expo-haptics';

export default function OrderSuccessScreen() {
  const { orderId, orderNumber, clientName, total, paymentMethod } = useLocalSearchParams();
  const router = useRouter();
  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleShareWhatsApp = () => {
    const message = `🎉 *Pedido Confirmado!*\n\n` +
      `Número: *#${orderNumber}*\n` +
      `Cliente: ${clientName}\n` +
      `Total: ${formatCurrency(Number(total))}\n` +
      `Pagamento: ${paymentMethod}\n\n` +
      `Obrigado pela preferência! 🎁`;

    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      // Fallback to web WhatsApp
      Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
    });
  };

  const handleNewOrder = () => {
    router.replace('/(tabs)/catalog');
  };

  const handleViewOrders = () => {
    router.replace('/(tabs)/orders');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Success Animation */}
        <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="checkmark" size={80} color="white" />
        </Animated.View>

        {/* Success Message */}
        <Text style={styles.title}>Pedido Confirmado!</Text>
        <Text style={styles.orderNumber}>Pedido #{orderNumber}</Text>

        {/* Order Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={20} color="#6B7280" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Cliente</Text>
              <Text style={styles.detailValue}>{clientName}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={20} color="#6B7280" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Total</Text>
              <Text style={styles.detailValue}>{formatCurrency(Number(total))}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="card-outline" size={20} color="#6B7280" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Pagamento</Text>
              <Text style={styles.detailValue}>{paymentMethod}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleViewOrders}>
            <Ionicons name="document-text" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Ver Pedidos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleNewOrder}>
            <Ionicons name="add-circle-outline" size={20} color="#FF6B00" />
            <Text style={styles.secondaryButtonText}>Novo Pedido</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.whatsappButton} onPress={handleShareWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color="white" />
            <Text style={styles.whatsappButtonText}>Compartilhar via WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF6B00',
    marginBottom: 32,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailText: {
    marginLeft: 16,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  buttonsContainer: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#FF6B00',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#FF6B00',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
