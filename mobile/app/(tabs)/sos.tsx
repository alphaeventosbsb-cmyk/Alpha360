import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { AlertTriangle, PhoneCall, Droplets, RefreshCcw } from 'lucide-react-native';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/use-auth';
import * as Location from 'expo-location';

export default function SosScreen() {
  const { user } = useAuth();
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const getActiveAssignment = async () => {
    if (!user) return null;
    const q = query(
      collection(db, 'job_assignments'),
      where('guardId', '==', user.uid),
      where('status', '==', 'checked_in')
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data().jobId;
    }
    return null; // Nenhuma escala ativa iniciada
  };

  const dispatchAlert = async (type: string, title: string, message: string) => {
    const jobId = await getActiveAssignment();
    if (!jobId) {
      Alert.alert('Atenção', 'Você não está atualmente em serviço (Nenhum Ponto de Entrada ativo).');
      return;
    }

    Alert.alert(
      `CONFIRMAR ${title}`,
      message,
      [
        { text: "CANCELAR", style: "cancel" },
        { 
          text: "CONFIRMAR E ENVIAR", 
          style: type === 'SOS' ? "destructive" : "default",
          onPress: async () => {
            setLoadingType(type);
            try {
              let lat = 0;
              let lng = 0;
              try {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                lat = loc.coords.latitude;
                lng = loc.coords.longitude;
              } catch (e) {
                console.log("Falha ao pegar lock GPS para alerta");
              }

              await addDoc(collection(db, 'alerts'), {
                tipo: type, // 'SOS', 'RENDICAO', 'HIDRATACAO'
                jobId: jobId,
                guardId: user?.uid,
                guardName: user?.displayName || user?.email || 'Vigilante Alpha',
                lat,
                lng,
                resolvido: false,
                timestamp: new Date().toISOString()
              });

              Alert.alert(`Sucesso: ${title}`, 'A central foi notificada imediatamente.');
            } catch (err) {
              Alert.alert('Erro', 'Falha ao conectar com a base de dados central.');
            } finally {
              setLoadingType(null);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Central Tática</Text>
      <Text style={styles.subtitle}>Reporte ocorrências ou emergências diretamente para a base.</Text>

      {/* SOS Button */}
      <View style={{alignItems: 'center', marginBottom: 40}}>
        <TouchableOpacity 
          style={styles.panicButton} 
          onPress={() => dispatchAlert('SOS', 'EMERGÊNCIA (S.O.S)', 'Isso irá disparar um alarme sonoro na Central de Monitoramento Imediatamente. Você tem certeza?')}
          activeOpacity={0.7}
          disabled={loadingType !== null}
        >
          <View style={styles.panicInner}>
            {loadingType === 'SOS' ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <>
                <AlertTriangle size={64} color="#fff" />
                <Text style={styles.panicText}>S.O.S</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.panicHelper}>PERIGO OU RISCO IMINENTE</Text>
      </View>

      {/* Secondary Alerts Row */}
      <View style={styles.secondaryRow}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => dispatchAlert('HIDRATACAO', 'Solicitar Apoio/Hidratação', 'Pedir apoio da supervisão (Ex: Água, suprimentos ou ajuda leve)?')}
          disabled={loadingType !== null}
        >
           {loadingType === 'HIDRATACAO' ? <ActivityIndicator color="#3b82f6" /> : <Droplets size={32} color="#3b82f6" />}
           <Text style={styles.secondaryText}>Apoio/Hidratação</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => dispatchAlert('RENDICAO', 'Solicitar Rendição', 'Solicitar rendição no posto (Pausa/Banheiro)? O supervisor mais próximo será acionado.')}
          disabled={loadingType !== null}
        >
           {loadingType === 'RENDICAO' ? <ActivityIndicator color="#f59e0b" /> : <RefreshCcw size={32} color="#f59e0b" />}
           <Text style={styles.secondaryText}>Pedir Rendição</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.callButton}>
        <PhoneCall size={24} color="#192c4d" />
        <Text style={styles.callText}>Ligar para o QTH Central</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '600',
  },
  panicButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 6,
    borderColor: '#fca5a5',
  },
  panicInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  panicText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: 2,
  },
  panicHelper: {
     marginTop: 16,
     color: '#ef4444',
     fontWeight: 'bold',
     fontSize: 14,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    marginBottom: 40,
  },
  secondaryButton: {
     flex: 1,
     backgroundColor: '#fff',
     padding: 20,
     borderRadius: 16,
     alignItems: 'center',
     justifyContent: 'center',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.05,
     shadowRadius: 8,
     elevation: 4,
     gap: 12,
  },
  secondaryText: {
     fontSize: 14,
     fontWeight: 'bold',
     color: '#334155',
     textAlign: 'center',
  },
  callButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  callText: {
    color: '#192c4d',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
