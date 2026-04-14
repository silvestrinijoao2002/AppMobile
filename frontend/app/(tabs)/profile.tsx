import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
  const { user, logout, biometricsEnabled, disableBiometrics } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          Toast.show({
            type: 'success',
            text1: 'Logout realizado!',
          });
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleToggleBiometrics = () => {
    if (biometricsEnabled) {
      Alert.alert(
        'Desativar Biometria',
        'Deseja desativar o login por biometria?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Desativar',
            style: 'destructive',
            onPress: async () => {
              await disableBiometrics();
              Toast.show({
                type: 'success',
                text1: 'Biometria desativada',
              });
            },
          },
        ]
      );
    } else {
      Toast.show({
        type: 'info',
        text1: 'Dica',
        text2: 'Faça login novamente para ativar a biometria',
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">Perfil</Text>
      </View>

      <ScrollView className="flex-1">
        {/* User Card */}
        <View className="bg-white m-4 rounded-2xl p-6 shadow-sm items-center">
          <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-3">
            <Text className="text-white text-3xl font-bold">
              {user?.nome?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text className="text-xl font-bold text-gray-800">{user?.nome || 'Usuário'}</Text>
          {user?.email && (
            <Text className="text-sm text-gray-500 mt-1">{user.email}</Text>
          )}
          <View className="mt-3 bg-gray-100 px-4 py-2 rounded-full">
            <Text className="text-xs font-medium text-gray-600">
              ID: {user?.id_vendedor}
            </Text>
          </View>
        </View>

        {/* Settings Section */}
        <View className="mx-4 mb-4">
          <Text className="text-sm font-semibold text-gray-500 uppercase mb-3 px-2">
            Configurações
          </Text>

          <View className="bg-white rounded-2xl shadow-sm">
            {/* Biometrics Toggle */}
            <TouchableOpacity
              className="flex-row items-center justify-between p-4 border-b border-gray-100"
              onPress={handleToggleBiometrics}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                  <Ionicons name="finger-print-outline" size={20} color="#3B82F6" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold text-gray-800">Biometria</Text>
                  <Text className="text-xs text-gray-500">Login rápido e seguro</Text>
                </View>
              </View>
              <View
                className={`w-12 h-6 rounded-full items-center ${
                  biometricsEnabled ? 'bg-secondary justify-end' : 'bg-gray-300 justify-start'
                } flex-row px-1`}
              >
                <View className="w-5 h-5 bg-white rounded-full shadow" />
              </View>
            </TouchableOpacity>

            {/* App Info */}
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
                  <Ionicons name="information-circle-outline" size={20} color="#A855F7" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold text-gray-800">Versão</Text>
                  <Text className="text-xs text-gray-500">1.0.0</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View className="mx-4 mb-8">
          <TouchableOpacity
            className="bg-red-500 rounded-2xl py-4 shadow-lg"
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text className="text-white text-center text-base font-semibold ml-2">
                Sair da Conta
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="items-center pb-8">
          <Text className="text-xs text-gray-400">Diverte Catálogo</Text>
          <Text className="text-xs text-gray-400 mt-1">© 2025 - Todos os direitos reservados</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
