import React, { useState, useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MapPin, QrCode, AlertTriangle, UserCircle, Briefcase, Fingerprint, MessageCircle } from 'lucide-react-native';
import { useAppPermissions } from '../../hooks/use-permissions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../hooks/use-auth';
export default function TabLayout() {
  useAppPermissions(); // Chama os diálogos de permissão assim que a tela abre
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { user, loading } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [hasBiometrics, setHasBiometrics] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      checkBiometricsAndAuthenticate();
    }
  }, [user, loading]);

  const checkBiometricsAndAuthenticate = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Se não houver biometria ou não estiver configurada, acessa direto
        setHasBiometrics(false);
        setIsUnlocked(true);
        setIsChecking(false);
        return;
      }

      setHasBiometrics(true);
      authenticate();
    } catch (error) {
      console.log("Erro ao checar biometria:", error);
      setIsUnlocked(true); // Fallback caso ocorra erro ao tentar verificar hardware
      setIsChecking(false);
    }
  };

  const authenticate = async () => {
    setIsChecking(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentique-se no AlphaGuard',
        fallbackLabel: 'Usar Senha',
        cancelLabel: 'Cancelar',
      });

      if (result.success) {
        setIsUnlocked(true);
      }
    } catch (err) {
      console.log("Erro na autenticação:", err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading || !user) return null;

  if (isChecking || (!isUnlocked && hasBiometrics)) {
    return (
      <View style={[styles.lockContainer, { paddingTop: insets.top }]}>
        <Fingerprint size={80} color="#192c4d" style={{ marginBottom: 20 }} />
        <Text style={styles.lockTitle}>Acesso Bloqueado</Text>
        <Text style={styles.lockSubtitle}>Confirme sua identidade via biometria para acessar a operação.</Text>
        
        {isChecking ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.unlockButton} onPress={authenticate}>
              <Fingerprint size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.unlockText}>Tentar Desbloquear Novamente</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Sair da Conta do Vigilante</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: true,
        header: () => (
          <View style={{
            height: 60 + insets.top,
            paddingTop: insets.top,
            backgroundColor: '#192c4d',
            justifyContent: 'center',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: '#0f1b2e'
          }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Alpha360</Text>
          </View>
        ),
        tabBarStyle: {
          height: 65 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 10,
          backgroundColor: '#192c4d',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Ponto',
          tabBarIcon: ({ color }) => <MapPin size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vagas"
        options={{
          tabBarLabel: 'Vagas',
          tabBarIcon: ({ color }) => <Briefcase size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          tabBarLabel: 'Leitor QR',
          tabBarIcon: ({ color }) => <QrCode size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          tabBarLabel: 'S.O.S',
          tabBarIcon: ({ color }) => <AlertTriangle size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color }) => <MessageCircle size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => <UserCircle size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  lockContainer: {
    flex: 1,
    backgroundColor: '#f6f7f8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#192c4d',
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 40,
  },
  actionContainer: {
    width: '100%',
    gap: 16,
  },
  unlockButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  unlockText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
