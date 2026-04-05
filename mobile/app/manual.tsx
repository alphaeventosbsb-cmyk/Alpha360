import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft, BookOpen, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ManualScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manual do App</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <CheckCircle2 color="#16a34a" size={24} />
            <Text style={styles.cardTitle}>Ponto Inicial</Text>
          </View>
          <Text style={styles.cardText}>
            1. Para registrar o ponto, você deve estar dentro do local da base.{'\n'}
            2. Aperte o botão de CHECK-IN e confirme usando a biometria/rosto ou botão de acesso se disponível.{'\n'}
            3. No fim do expediente, bata o CHECK-OUT.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <BookOpen color="#3b82f6" size={24} />
            <Text style={styles.cardTitle}>Vagas e Escalas</Text>
          </View>
          <Text style={styles.cardText}>
            1. Na aba de "Vagas", ache a escala desejada e solicite participação.{'\n'}
            2. Quando a agência aprovar, ela mudará para "Minha Escala de Serviço" aqui no Perfil.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AlertTriangle color="#ef4444" size={24} />
            <Text style={styles.cardTitle}>Botão do Pânico (S.O.S)</Text>
          </View>
          <Text style={styles.cardText}>
            Use a Central de S.O.S apenas em emergências! Seu microfone e câmera vão enviar amostras, além da localização GPS em tempo real para a central e os agentes QRF responsáveis na hora.
          </Text>
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
  content: { padding: 20 },
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#192c4d' },
  cardText: { fontSize: 14, color: '#475569', lineHeight: 22 }
});
