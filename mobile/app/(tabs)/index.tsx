import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MapPin, CheckCircle, LogOut, QrCode } from 'lucide-react-native';
import * as Location from 'expo-location';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/use-auth';
import { useRouter } from 'expo-router';

export default function PontoScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusText, setStatusText] = useState('Buscando escalas...');
  
  // States to hold the guard's current relevant assignment
  const [activeAssignment, setActiveAssignment] = useState<any>(null); // 'approved' or 'checked_in'
  const [jobData, setJobData] = useState<any>(null);

  const fetchCurrentAssignment = async () => {
    if (!user) return;
    try {
      // Find the active assignment (approved or checked_in)
      const q = query(
        collection(db, 'job_assignments'),
        where('guardId', '==', user.uid),
        where('status', 'in', ['approved', 'checked_in'])
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        // Just take the first valid one if there are multiple
        const assignDoc = snapshot.docs[0];
        const assignData = { id: assignDoc.id, ...assignDoc.data() } as any;
        
        // Fetch the corresponding job to check if it's patrimonial
        const jDoc = await getDoc(doc(db, 'jobs', assignData.jobId));
        if (jDoc.exists()) {
          setActiveAssignment(assignData);
          setJobData({ id: jDoc.id, ...jDoc.data() });
          
          if (assignData.status === 'checked_in') {
            setStatusText('Em serviço. Turno Iniciado.');
          } else {
            setStatusText('Uma escala aguarda início.');
          }
        }
      } else {
        setActiveAssignment(null);
        setJobData(null);
        setStatusText('Você não está em serviço.');
      }
    } catch (error) {
      console.error(error);
      setStatusText('Erro ao buscar escalas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Aviso', 'A localização é recomendada para validar o seu ponto.');
      }
    })();
    fetchCurrentAssignment();
  }, [user]);

  const handleAction = async (action: 'in' | 'out') => {
    if (!activeAssignment || !jobData) return;

    setActionLoading(true);
    try {
      let lat = 0;
      let lng = 0;
      try {
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        lat = location.coords.latitude;
        lng = location.coords.longitude;
      } catch (e) {
        console.log("Location fetch failed, proceeding without strict location");
      }
      
      const now = new Date().toISOString();

      if (action === 'in') {
        // Perform Patrimonial Check-in manually
        await updateDoc(doc(db, 'job_assignments', activeAssignment.id), {
          status: 'checked_in',
          checkinAt: now,
          checkinLat: lat,
          checkinLng: lng,
        });
        
        await updateDoc(doc(db, 'jobs', jobData.id), { status: 'in_progress' });
        
        // Also update guard user status
        await updateDoc(doc(db, 'users', user!.uid), {
          status: 'Ativo', lat, lng, lastLocationUpdate: now
        });

        Alert.alert('Sucesso', 'Ponto registrado com sucesso!');
      } else {
        // Perform Patrimonial Check-out manually
        const checkinTime = new Date(activeAssignment.checkinAt || now);
        const checkoutTime = new Date(now);
        const totalHours = Math.round((checkoutTime.getTime() - checkinTime.getTime()) / (1000 * 60 * 60) * 100) / 100;

        await updateDoc(doc(db, 'job_assignments', activeAssignment.id), {
          status: 'checked_out',
          checkoutAt: now,
          checkoutLat: lat,
          checkoutLng: lng,
          totalHours: totalHours > 0 ? totalHours : 0.1, // Minimum tracking
          paymentStatus: 'pending',
        });
        
        await updateDoc(doc(db, 'users', user!.uid), { status: 'Inativo' });
        
        // Complete the job if all checked out
        const allAssignments = query(
          collection(db, 'job_assignments'),
          where('jobId', '==', jobData.id),
          where('status', '==', 'checked_in')
        );
        const remaining = await getDocs(allAssignments);
        if (remaining.empty) {
          await updateDoc(doc(db, 'jobs', jobData.id), { status: 'completed' });
        }

        Alert.alert('Sucesso', `Turno encerrado! Horas lançadas.`);
      }
      
      await fetchCurrentAssignment();
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao registrar o ponto.');
    } finally {
      setActionLoading(false);
    }
  };

  const isWorking = activeAssignment?.status === 'checked_in';
  const hasApprovedJob = activeAssignment?.status === 'approved';
  const isPatrimonial = jobData?.isPatrimonial === true;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <Text style={styles.timeText}>
          {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
        
        <View style={[styles.statusBadge, isWorking ? styles.bgGreen : styles.bgGray]}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {loading ? (
           <ActivityIndicator size="large" color="#192c4d" />
        ) : !activeAssignment ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.helperText}>Você não possui escalas ativas no momento.</Text>
          </View>
        ) : !isPatrimonial ? (
          // IF IT IS NOT PATRIMONIAL, PREVENT MANUAL CLICK AND REQUIRE QR CODE
          <TouchableOpacity style={[styles.bigButton, styles.buttonQR]} onPress={() => router.push('/qr')}>
            <QrCode color="#fff" size={48} />
            <Text style={styles.buttonText}>ESCANEAR QR CODE</Text>
            <Text style={styles.buttonSubText}>Esta escala exige leitura do código do local.</Text>
          </TouchableOpacity>
        ) : (
          // IF IT IS PATRIMONIAL, ALLOW MANUAL CLICKS
          <>
            {!isWorking ? (
              <TouchableOpacity 
                style={[styles.bigButton, styles.buttonIn]}
                onPress={() => handleAction('in')}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#fff" size="large" /> : (
                  <>
                    <CheckCircle color="#fff" size={48} />
                    <Text style={styles.buttonText}>BATER PONTO (ENTRADA)</Text>
                    <Text style={styles.buttonSubText}>Escala Patrimonial Libreada</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.bigButton, styles.buttonOut]}
                onPress={() => handleAction('out')}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#fff" size="large" /> : (
                  <>
                    <LogOut color="#fff" size={48} />
                    <Text style={styles.buttonText}>REGISTRAR SAÍDA</Text>
                    <Text style={styles.buttonSubText}>Encerrar Escala Patrimonial</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
      
      {(activeAssignment && isPatrimonial) && (
        <Text style={styles.helperText}>Sua localização será registrada pelo GPS ativo.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#cbd5e1',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  dateText: {
    fontSize: 16,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#192c4d',
    marginVertical: 10,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
  },
  bgGray: { backgroundColor: '#e2e8f0' },
  bgGreen: { backgroundColor: '#dcfce7' },
  statusText: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  actions: {
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  bigButton: {
    width: '100%',
    height: 180,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonIn: {
    backgroundColor: '#22c55e', // Green
  },
  buttonOut: {
    backgroundColor: '#ef4444', // Red
  },
  buttonQR: {
    backgroundColor: '#3b82f6', // Blue
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 16,
    textAlign: 'center',
  },
  buttonSubText: {
    color: '#rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  helperText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#475569',
    fontWeight: 'bold',
  }
});
