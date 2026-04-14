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
  StyleSheet,
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
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B00', '#FF8C42', '#FFA366']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Logo Section */}
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Ionicons name="gift" size={48} color="#FF6B00" />
                </View>
                <Text style={styles.title}>Diverte Catálogo</Text>
                <Text style={styles.subtitle}>Sistema de Vendas</Text>
              </View>

              {/* Login Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Entrar</Text>

                {/* Usuario Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Usuário</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                    <TextInput
                      style={styles.input}
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
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Senha</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                    <TextInput
                      style={styles.input}
                      placeholder="Digite sua senha"
                      placeholderTextColor="#9CA3AF"
                      value={senha}
                      onChangeText={setSenha}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
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
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.loginButtonText}>Entrar</Text>
                  )}
                </TouchableOpacity>

                {/* Biometric Login */}
                {biometricsEnabled && (
                  <TouchableOpacity
                    style={styles.biometricButton}
                    onPress={handleBiometricLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="finger-print" size={24} color="#FF6B00" />
                    <Text style={styles.biometricButtonText}>Login com Biometria</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Footer */}
              <Text style={styles.footer}>
                © 2025 Diverte Catálogo - Todos os direitos reservados
              </Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 96,
    height: 96,
    backgroundColor: 'white',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeIcon: {
    marginLeft: 8,
  },
  loginButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  biometricButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#FF6B00',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricButtonText: {
    color: '#FF6B00',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 32,
    opacity: 0.8,
  },
});
