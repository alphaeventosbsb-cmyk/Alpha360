import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { AlertTriangle, PhoneCall } from 'lucide-react-native';

export default function SosScreen() {
  const [loading, setLoading] = useState(false);

  const handlePanicButton = async () => {
    Alert.alert(
      "CONFIRMAR EMERGÊNCIA",
      "Isso irá disparar um alarme sonoro na Central de Monitoramento Imediatamente. Você tem certeza?",
      [
        { text: "CANCELAR", style: "cancel" },
        { 
          text: "DISPARAR S.O.S", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              // Simulando envio para Firebase / Central
              await new Promise(resolve => setTimeout(resolve, 2000));
              Alert.alert('S.O.S ENVIADO', 'A central foi notificada com sua localização. Mantenha a calma, o socorro está a caminho.');
            } catch (err) {
              Alert.alert('Erro', 'Falha ao conectar com a central.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Central de Emergência</Text>
      <Text style={styles.subtitle}>Em caso de risco iminente, pressione o botão vermelho.</Text>

      <TouchableOpacity 
        style={styles.panicButton} 
        onPress={handlePanicButton}
        activeOpacity={0.7}
        disabled={loading}
      >
        <View style={styles.panicInner}>
          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <>
              <AlertTriangle size={64} color="#fff" />
              <Text style={styles.panicText}>S.O.S</Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.callButton}>
        <PhoneCall size={24} color="#192c4d" />
        <Text style={styles.callText}>Ligar para Central Administrativa</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fee2e2', // Light red background for SOS tab
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#7f1d1d',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#b91c1c',
    textAlign: 'center',
    marginBottom: 60,
    fontWeight: '600',
  },
  panicButton: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 8,
    borderColor: '#fca5a5',
  },
  panicInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  panicText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: 2,
  },
  callButton: {
    marginTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: '#192c4d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  callText: {
    color: '#192c4d',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
