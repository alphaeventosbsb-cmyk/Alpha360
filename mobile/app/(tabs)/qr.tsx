import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { QrCode, RefreshCcw } from 'lucide-react-native';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/use-auth';
import * as Location from 'expo-location';

export default function QrScreen() {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: any) => {
    setScanned(true);
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado.', [{ text: 'OK', onPress: () => setScanned(false) }]);
      return;
    }

    try {
      setProcessing(true);
      // Extrair JSON do QRCode
      const qrData = JSON.parse(data);
      if (!qrData.type || !qrData.jobId || !qrData.token) {
         throw new Error('QR Code inválido para este sistema.');
      }

      // Adquirir Job e verificar se existe
      const jDoc = await getDoc(doc(db, 'jobs', qrData.jobId));
      if (!jDoc.exists()) {
        throw new Error('Escala não encontrada (ou foi removida).');
      }
      const job = { id: jDoc.id, ...jDoc.data() } as any;

      // Buscar o assignment do guarda atual para esta vaga (só os ativos/aprovados)
      const q = query(
        collection(db, 'job_assignments'),
        where('jobId', '==', qrData.jobId),
        where('guardId', '==', user.uid),
        where('status', 'in', ['approved', 'checked_in'])
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Você não está escalado para esta vaga ou a vaga já foi finalizada.');
      }

      const assignDoc = snapshot.docs[0];
      const assignData = { id: assignDoc.id, ...assignDoc.data() } as any;

      // Puxar localização (ignorando erros se GPS estiver ruim)
      let lat: number | undefined;
      let lng: number | undefined;
      try {
         const loc = await Location.getCurrentPositionAsync({
           accuracy: Location.Accuracy.Balanced, // Alterado para balanceado para funcionar melhor em ambientes fechados (emuladores)
         });
         lat = loc.coords.latitude;
         lng = loc.coords.longitude;
      } catch (e) {
         console.log("Falha ao pegar lock de GPS no Leitor");
      }
      const now = new Date().toISOString();

      if (qrData.type === 'checkin') {
         if (job.qrCheckinToken !== qrData.token) throw new Error('Token de check-in inválido/expirado.');
         if (assignData.status === 'checked_in') throw new Error('Você já bateu o ponto de ENTRADA para esta escala.');

         await updateDoc(doc(db, 'job_assignments', assignData.id), {
           status: 'checked_in', checkinAt: now, checkinLat: lat ?? 0, checkinLng: lng ?? 0,
         });
         await updateDoc(doc(db, 'jobs', job.id), { status: 'in_progress' });
         
         const userUpdate: any = { status: 'Ativo', lastLocationUpdate: now, companyId: job.companyId };
         if (lat !== undefined && lng !== undefined) {
             userUpdate.lat = lat;
             userUpdate.lng = lng;
         }
         await updateDoc(doc(db, 'users', user.uid), userUpdate);

         Alert.alert('Sucesso!', 'Entrada registrada com sucesso.', [{ text: 'OK', onPress: () => setScanned(false) }]);

      } else if (qrData.type === 'checkout') {
         if (job.qrCheckoutToken !== qrData.token) throw new Error('Token de check-out inválido/expirado.');
         if (assignData.status !== 'checked_in') throw new Error('Você precisa bater o ponto de ENTRADA antes de bater o de saída.');

         const checkinTime = new Date(assignData.checkinAt || now);
         const checkoutTime = new Date(now);
         const totalHours = Math.round((checkoutTime.getTime() - checkinTime.getTime()) / (1000 * 60 * 60) * 100) / 100;

         await updateDoc(doc(db, 'job_assignments', assignData.id), {
           status: 'checked_out', checkoutAt: now, checkoutLat: lat ?? 0, checkoutLng: lng ?? 0,
           totalHours: totalHours > 0 ? totalHours : 0.1, paymentStatus: 'pending',
         });
         await updateDoc(doc(db, 'users', user.uid), { status: 'Inativo' });

         // Conferir se finalizamos a Vaga
         const allAssignments = query(collection(db, 'job_assignments'), where('jobId', '==', job.id), where('status', '==', 'checked_in'));
         const remaining = await getDocs(allAssignments);
         if (remaining.empty) {
           await updateDoc(doc(db, 'jobs', job.id), { status: 'completed' });
         }

         Alert.alert('Sucesso!', `Saída registrada. Você trabalhou ${totalHours.toFixed(1)}h.`, [{ text: 'OK', onPress: () => setScanned(false) }]);

      } else {
         throw new Error('Formato de QR Code não suportado.');
      }

    } catch (err: any) {
      console.error(err);
      Alert.alert('Aviso', err.message || 'Falha ao ler QR Code.', [{ text: 'OK', onPress: () => setScanned(false) }]);
    } finally {
      setProcessing(false);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Aguardando permissão da câmera</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text>Sem acesso à câmera</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leitor do Posto (QR Code)</Text>
      <Text style={styles.subtitle}>Escaneie o QR da Escala para Entrada/Saída.</Text>

      <View style={styles.cameraContainer}>
        {processing && (
          <View style={styles.overlay}>
             <ActivityIndicator size="large" color="#3b82f6" />
             <Text style={styles.loadingText}>Validando Ponto...</Text>
          </View>
        )}
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        
        {/* Marcador Visual Centralizado */}
        {!processing && (
          <View style={styles.markerContainer}>
            <View style={styles.markerBorder} />
          </View>
        )}
      </View>

      {scanned && !processing && (
        <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
          <RefreshCcw color="#fff" size={24} />
          <Text style={styles.buttonText}>Escanear Novamente</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#192c4d',
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 40,
    marginTop: 8,
  },
  cameraContainer: {
    width: 300,
    height: 300,
    overflow: 'hidden',
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#3b82f6',
    position: 'relative',
    backgroundColor: '#000',
  },
  markerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerBorder: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontWeight: 'bold',
  },
  button: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
