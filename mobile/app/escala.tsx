import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/use-auth';
import { Briefcase, Calendar, MapPin, Clock, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function EscalaScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEscalas = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'job_assignments'),
          where('guardId', '==', user.uid),
          where('status', 'in', ['approved', 'checked_in', 'checked_out'])
        );
        const snapshot = await getDocs(q);
        
        const jobsProcess = snapshot.docs.map(async (d) => {
          const assignData = d.data();
          const jobDoc = await getDoc(doc(db, 'jobs', assignData.jobId));
          if (jobDoc.exists()) {
            return {
              id: d.id,
              assignStatus: assignData.status,
              job: { id: jobDoc.id, ...jobDoc.data() }
            };
          }
          return null;
        });

        const results = await Promise.all(jobsProcess);
        const validResults = results.filter(r => r !== null);
        
        // Sort by date inside the app
        validResults.sort((a: any, b: any) => {
          const dateA = a.job.date ? new Date(a.job.date).getTime() : 0;
          const dateB = b.job.date ? new Date(b.job.date).getTime() : 0;
          return dateB - dateA; // Most recent first
        });

        setAssignments(validResults);
      } catch (error) {
        console.error("Erro ao buscar escalas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEscalas();
  }, [user]);

  const renderItem = ({ item }: { item: any }) => {
    const job = item.job;
    const isPast = item.assignStatus === 'checked_out';

    return (
      <View style={[styles.card, isPast && styles.cardPast]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Briefcase size={20} color="#192c4d" />
            <Text style={styles.cardTitle}>{job.clientName || 'Posto'}</Text>
          </View>
          <View style={[styles.statusBadge, item.assignStatus === 'checked_in' ? styles.bgBlue : isPast ? styles.bgGray : styles.bgGreen]}>
            <Text style={[styles.statusText, item.assignStatus === 'checked_in' ? styles.textBlue : isPast ? styles.textGray : styles.textGreen]}>
              {item.assignStatus === 'checked_in' ? 'Em Andamento' : isPast ? 'Finalizada' : 'Confirmada'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Calendar size={16} color="#64748b" />
            <Text style={styles.infoText}>{job.date ? new Date(job.date).toLocaleDateString('pt-BR') : 'A definir'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={16} color="#64748b" />
            <Text style={styles.infoText}>{job.startTime || '00:00'} às {job.endTime || '00:00'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={16} color="#64748b" />
            <Text style={styles.infoText} numberOfLines={2}>{job.location || 'Local não informado'}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minhas Escalas</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#192c4d" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={assignments}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Você não tem nenhuma escala confirmada.</Text>
              <Text style={styles.emptySubtext}>Vá até a aba de Vagas para solicitar participação em eventos disponíveis.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#cbd5e1' },
  header: {
    backgroundColor: '#192c4d',
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: { marginRight: 15 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  listContainer: { padding: 20 },
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
  cardPast: { opacity: 0.7 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#192c4d', flexShrink: 1 },
  cardBody: { gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: '#475569', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  bgGreen: { backgroundColor: '#dcfce7' },
  textGreen: { color: '#16a34a' },
  bgBlue: { backgroundColor: '#dbeafe' },
  textBlue: { color: '#2563eb' },
  bgGray: { backgroundColor: '#f1f5f9' },
  textGray: { color: '#64748b' },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#475569', textAlign: 'center', marginBottom: 10 },
  emptySubtext: { fontSize: 14, color: '#64748b', textAlign: 'center' }
});
