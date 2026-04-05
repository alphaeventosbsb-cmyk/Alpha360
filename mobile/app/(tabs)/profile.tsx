import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../hooks/use-auth';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { UserCircle, LogOut, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, userData } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível desconectar.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <UserCircle size={80} color="#192c4d" />
        <Text style={styles.name}>{user?.displayName || 'Vigilante Alpha'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>TÁTICO / PATRULHA</Text>
        </View>
      </View>

      {userData && !userData.registrationComplete && (
        <TouchableOpacity style={styles.alertButton} onPress={() => router.push('/register')}>
          <Text style={styles.alertButtonText}>⚠️ Completar Dossiê Tático</Text>
        </TouchableOpacity>
      )}

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/escala')}>
          <Text style={styles.menuItemText}>Minha Escala de Serviço</Text>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/historico')}>
          <Text style={styles.menuItemText}>Histórico de Rondas</Text>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/manual')}>
          <Text style={styles.menuItemText}>Manual do App</Text>
          <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Encerrar Sessão e Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  header: {
    backgroundColor: '#fff',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#192c4d',
    marginTop: 12,
  },
  email: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: '#192c4d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 16,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  menu: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  logoutButton: {
    margin: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertButton: {
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: '#fef2f2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  alertButtonText: {
    color: '#dc2626',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
