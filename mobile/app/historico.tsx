import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft, Clock, MapPin, CheckCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function HistoricoScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico de Rondas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.emptyContainer}>
          <Clock size={48} color="#9ca3af" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>Nenhuma ronda registrada</Text>
          <Text style={styles.emptySubtext}>Quando você escanear QRs de ronda durante seu turno, eles aparecerão aqui no histórico.</Text>
        </View>
      </ScrollView>
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
  content: { padding: 20, flexGrow: 1, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#475569', textAlign: 'center', marginBottom: 10 },
  emptySubtext: { fontSize: 14, color: '#64748b', textAlign: 'center' }
});
