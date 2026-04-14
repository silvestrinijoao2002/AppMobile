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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import Toast from 'react-native-toast-message';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
            { text: 'Não', style: 'cancel' },
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
    <View className="flex-1">
      <LinearGradient
        colors={['#FF6B00', '#FF8C42', '#FFA366']}
        className="flex-1"
      >
        <SafeAreaView className="flex-1" edges={['top']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <ScrollView
              contentContainerClassName="flex-grow justify-center px-6"
              keyboardShouldPersistTaps="handled"
            >
              {/* Logo Section */}
              <View className="items-center mb-12">
                <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-6 shadow-2xl">
                  <Ionicons name="gift" size={48} color="#FF6B00" />
                </View>
                <Text className="text-4xl font-bold text-white mb-2">Diverte Catálogo</Text>
                <Text className="text-lg text-white/90">Sistema de Vendas</Text>
              </View>

              {/* Login Card */}
              <View className="bg-white rounded-3xl p-6 shadow-2xl">
                <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
                  Entrar
                </Text>

                {/* Usuario Input */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Usuário</Text>
                  <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-4 border-2 border-gray-200">
                    <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                    <TextInput
                      className="flex-1 ml-3 text-base text-gray-800"
                      placeholder="Digite seu usuário"
                      placeholderTextColor="#9CA3AF"
                      value={usuario}
                      onChangeText={setUsuario}
                      autoCapitalize="none"
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Senha Input */}
                <View className="mb-6">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Senha</Text>
                  <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-4 border-2 border-gray-200">
                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                    <TextInput
                      className="flex-1 ml-3 text-base text-gray-800"
                      placeholder="Digite sua senha"
                      placeholderTextColor="#9CA3AF"
                      value={senha}
                      onChangeText={setSenha}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="ml-2"
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  className="bg-primary rounded-2xl py-4 shadow-lg active:scale-95"
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                  style={{
                    transform: [{ scale: loading ? 0.95 : 1 }],
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-white text-center text-lg font-bold">Entrar</Text>
                  )}
                </TouchableOpacity>

                {/* Biometric Login */}
                {biometricsEnabled && (
                  <TouchableOpacity
                    className="bg-white border-2 border-primary rounded-2xl py-4 mt-3 flex-row items-center justify-center"
                    onPress={handleBiometricLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="finger-print" size={24} color="#FF6B00" />
                    <Text className="text-primary text-center text-lg font-bold ml-2">
                      Login com Biometria
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Footer */}
              <Text className="text-white text-center text-sm mt-8 opacity-80">
                © 2025 Diverte Catálogo - Todos os direitos reservados
              </Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
