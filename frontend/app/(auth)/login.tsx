import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import Toast from 'react-native-toast-message';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, enableBiometrics, biometricsEnabled } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!usuario.trim() || !senha.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Preencha usuário e senha',
      });
      return;
    }

    setLoading(true);
    try {
      await login(usuario, senha);
      
      // Ask if user wants to enable biometrics
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (hasHardware && isEnrolled && !biometricsEnabled) {
        Alert.alert(
          'Ativar Biometria?',
          'Deseja usar biometria para fazer login rapidamente?',
          [
            {
              text: 'Não',
              style: 'cancel',
            },
            {
              text: 'Sim',
              onPress: async () => {
                try {
                  await enableBiometrics(usuario, senha);
                  Toast.show({
                    type: 'success',
                    text1: 'Biometria ativada!',
                  });
                } catch (error) {
                  console.error('Enable biometrics error:', error);
                }
              },
            },
          ]
        );
      }

      Toast.show({
        type: 'success',
        text1: 'Login realizado!',
        text2: 'Bem-vindo ao Diverte Catálogo',
      });
      
      router.replace('/(tabs)/catalog');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erro no login',
        text2: error.response?.data?.message || 'Verifique suas credenciais',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Faça login com biometria',
        fallbackLabel: 'Usar senha',
      });

      if (result.success) {
        const savedUsuario = await SecureStore.getItemAsync('biometric_usuario');
        const savedSenha = await SecureStore.getItemAsync('biometric_senha');

        if (savedUsuario && savedSenha) {
          setLoading(true);
          await login(savedUsuario, savedSenha);
          Toast.show({
            type: 'success',
            text1: 'Login realizado!',
          });
          router.replace('/(tabs)/catalog');
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro na biometria',
        text2: 'Tente novamente',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6">
            {/* Logo Section */}
            <View className="items-center mb-12">
              <View className="w-24 h-24 bg-primary rounded-3xl items-center justify-center mb-4">
                <Text className="text-white text-4xl font-bold">DC</Text>
              </View>
              <Text className="text-3xl font-bold text-gray-800">Diverte Catálogo</Text>
              <Text className="text-base text-gray-500 mt-2">Sistema de Vendas</Text>
            </View>

            {/* Login Form */}
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Usuário</Text>
                <TextInput
                  className="bg-white rounded-2xl px-4 py-4 text-base border border-gray-200"
                  placeholder="Digite seu usuário"
                  value={usuario}
                  onChangeText={setUsuario}
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              <View className="mt-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Senha</Text>
                <TextInput
                  className="bg-white rounded-2xl px-4 py-4 text-base border border-gray-200"
                  placeholder="Digite sua senha"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                className="bg-primary rounded-2xl py-4 mt-6 shadow-lg"
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center text-lg font-semibold">Entrar</Text>
                )}
              </TouchableOpacity>

              {biometricsEnabled && (
                <TouchableOpacity
                  className="bg-white border-2 border-primary rounded-2xl py-4 mt-3"
                  onPress={handleBiometricLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text className="text-primary text-center text-lg font-semibold">
                    Entrar com Biometria
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
