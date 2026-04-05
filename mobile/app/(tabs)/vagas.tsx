import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { collection, query, where, onSnapshot, orderBy, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/use-auth';
import { Briefcase, Calendar, MapPin, DollarSign, Clock, Users, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function VagasScreen() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Buscar Vagas em aberto (Ordenação feita no app para evitar criar Index composto no Firebase agora)
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('status', '==', 'open')
    );

    const unsubJobs = onSnapshot(jobsQuery, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Ordena localmente do mais recente para o mais antigo
      const sortedData = data.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setJobs(sortedData);
      setLoading(false);
    });

    // Buscar as requisições que EU fiz
    const requestsQuery = query(
      collection(db, 'job_assignments'),
      where('guardId', '==', user.uid)
    );

    const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMyRequests(data);
    });

    return () => {
      unsubJobs();
      unsubRequests();
    };
  }, [user]);

  const handleRequestJob = async (job: any) => {
    if (!user) return;
    setRequesting(job.id);
    
    try {
      const assignmentId = `${job.id}_${user.uid}`;
      const assigRef = doc(db, 'job_assignments', assignmentId);
      
      await setDoc(assigRef, {
        jobId: job.id,
        guardId: user.uid,
        guardName: user.displayName || user.email || 'Vigilante',
        status: 'pending',
        companyId: job.companyId || '',
        assignedAt: new Date().toISOString()
      });
      
      Alert.alert('Sucesso', 'Solicitação pendente enviada. Aguarde a central aprovar.');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível solicitar a vaga.');
    } finally {
      setRequesting(null);
    }
  };

  const renderJob = ({ item }: { item: any }) => {
    const request = myRequests.find(r => r.jobId === item.id);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Briefcase size={20} color="#192c4d" />
            <Text style={styles.cardTitle}>{item.clientName || 'Novo Posto'}</Text>
          </View>
          <Text style={styles.rateText}>R$ {item.dailyRate || '0,00'}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Calendar size={16} color="#64748b" />
            <Text style={styles.infoText}>{item.date ? new Date(item.date).toLocaleDateString('pt-BR') : 'A definir'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={16} color="#64748b" />
            <Text style={styles.infoText}>{item.startTime || '00:00'} às {item.endTime || '00:00'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={16} color="#64748b" />
            <Text style={styles.infoText} numberOfLines={1}>{item.location || 'Local não informado'}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {request ? (
            <View style={[styles.statusBadge, request.status === 'approved' ? styles.bgGreen : request.status === 'rejected' ? styles.bgRed : styles.bgYellow]}>
              <Text style={[styles.statusText, request.status === 'approved' ? styles.textGreen : request.status === 'rejected' ? styles.textRed : styles.textYellow]}>
                {request.status === 'approved' ? 'Escalado! ✅' : request.status === 'rejected' ? 'Rejeitado ❌' : 'Aguardando Aprovação ⏳'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.requestButton} 
              onPress={() => handleRequestJob(item)}
              disabled={requesting === item.id}
            >
              {requesting === item.id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.requestButtonText}>Puxar Escala</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#192c4d" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderJob}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma vaga ou escala aberta no momento.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#cbd5e1',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#192c4d',
  },
  rateText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#16a34a',
  },
  cardBody: {
    gap: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  cardFooter: {
    marginTop: 8,
  },
  requestButton: {
    backgroundColor: '#192c4d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusBadge: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
  },
  bgYellow: { backgroundColor: '#fef3c7' },
  bgGreen: { backgroundColor: '#dcfce7' },
  bgRed: { backgroundColor: '#fee2e2' },
  textYellow: { color: '#d97706', fontWeight: 'bold' },
  textGreen: { color: '#16a34a', fontWeight: 'bold' },
  textRed: { color: '#dc2626', fontWeight: 'bold' },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#64748b',
    fontWeight: 'bold',
  }
});
