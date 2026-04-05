import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { CheckCircle, MapPin, Search, ChevronRight, User, Key, Camera as CameraIcon, UploadCloud, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import * as Location from 'expo-location';

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 5;

  // Camera permissions
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<any>(null);

  // Form states
  const existingUser = auth.currentUser;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (existingUser) {
      setEmail(existingUser.email || '');
      setName(existingUser.displayName || 'Vigilante Alpha');
      setStep(2); // Pula a senha, pois já tem conta
    }
  }, []);

  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [phone, setPhone] = useState('');

  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // ------- MASKS AND VALIDATORS -------

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const maskCEP = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1');
  };

  const isValidCPF = (cpfValue: string) => {
    if (typeof cpfValue !== 'string') return false;
    const cl = cpfValue.replace(/\D/g, '');
    if (cl.length !== 11 || /^(\d)\1{10}$/.test(cl)) return false;
    let sum = 0, rest;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cl.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if ((rest === 10) || (rest === 11)) rest = 0;
    if (rest !== parseInt(cl.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cl.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if ((rest === 10) || (rest === 11)) rest = 0;
    if (rest !== parseInt(cl.substring(10, 11))) return false;
    return true;
  };

  // ------- VIA CEP --------

  const fetchCep = async () => {
    const rawCep = cep.replace(/\D/g, '');
    if (rawCep.length !== 8) {
      Alert.alert('CEP Inválido', 'O CEP deve conter 8 dígitos numéricos.');
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await resp.json();
      if (data.erro) throw new Error('CEP não encontrado');
      
      setAddress(data.logradouro || '');
      setNeighborhood(data.bairro || '');
      setCity(data.localidade || '');
      setUf(data.uf || '');
    } catch(err) {
      Alert.alert('Erro', 'Não foi possível buscar este CEP. Preencha os campos manualmente.');
    } finally {
      setLoading(false);
    }
  };

  // ------- CAMERA --------

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5, // Optimize size
        base64: true,
      });
      setPhotoUri(photo.uri);
      setPhotoBase64(photo.base64 || null);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível capturar a foto.');
    }
  };

  const retakePicture = () => {
    setPhotoUri(null);
    setPhotoBase64(null);
  };

  // ------- PROGRESS & SAVE --------

  const nextStep = () => {
    // Validations before moving
    if (step === 1 && !existingUser) {
      if (!email.includes('@') || password.length < 6 || name.trim().split(' ').length < 2) {
        return Alert.alert('Atenção', 'Informe um e-mail válido, senha forte (+6 caracteres) e seu nome completo.');
      }
    } else if (step === 2) {
      if (!isValidCPF(cpf)) return Alert.alert('Atenção', 'CPF inválido pelo algorítmo da Receita Federal.');
      if (rg.length < 3 || phone.length < 14) return Alert.alert('Atenção', 'Preencha o RG e Telefone corretamente.');
    } else if (step === 3) {
      if (address.length === 0 || city.length === 0 || addressNumber.length === 0) return Alert.alert('Atenção', 'Complete os dados de residência obrigatoriamente.');
    } else if (step === 4) {
      if (!height || !weight) return Alert.alert('Atenção', 'Informe seu peso e altura.');
    } else if (step === 5) {
      if (!photoUri) return Alert.alert('Atenção', 'Você deve capturar a foto de rosto (Selfie Operacional) antes de finalizar.');
      return handleSubmit(); // Send form
    }
    
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (step === 1 || (step === 2 && existingUser)) router.replace(existingUser ? '/profile' : '/login');
    else setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let uidToUse = '';
      
      if (existingUser) {
        uidToUse = existingUser.uid;
        if (name.trim()) await updateProfile(existingUser, { displayName: name.trim() });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        uidToUse = userCredential.user.uid;
        await updateProfile(userCredential.user, { displayName: name.trim() });
      }

      // 2. Upload Photo
      let uploadedPhotoUrl = '';
      if (photoBase64) {
        const photoRef = ref(storage, `guards/${uidToUse}/profile_${Date.now()}.jpg`);
        await uploadString(photoRef, photoBase64, 'base64', { contentType: 'image/jpeg' });
        uploadedPhotoUrl = await getDownloadURL(photoRef);
      } else if (photoUri) {
        // Fallback for URIs if base64 completely fails
        const response = await fetch(photoUri);
        const blob = await response.blob();
        const photoRef = ref(storage, `guards/${uidToUse}/profile_${Date.now()}.jpg`);
        await uploadBytes(photoRef, blob);
        uploadedPhotoUrl = await getDownloadURL(photoRef);
      }

      // 3. Save to Firestore
      await setDoc(doc(db, 'users', uidToUse), {
        email: email.trim(),
        name: name.trim(),
        role: 'guard',
        cpf: cpf.replace(/\D/g, ''),
        rg,
        phone: phone.replace(/\D/g, ''),
        height,
        weight,
        photoUrl: uploadedPhotoUrl,
        address: `${address}, ${addressNumber}`,
        complement,
        neighborhood,
        city,
        uf,
        cep: cep.replace(/\D/g, ''),
        registrationComplete: true, // Key to bypass blockers
        status: 'Inativo',
        createdAt: new Date().toISOString()
      }, { merge: true });

      Alert.alert('Sucesso!', 'Seu Dossiê foi salvo com sucesso.', [
        { text: 'Concluir', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Falha no Cadastro', typeof error?.message === 'string' ? error.message : 'Verifique os dados ou se este e-mail já está em uso.');
    } finally {
      setLoading(false);
    }
  };

  // ------- RENDERERS --------

  const renderStepCircles = () => {
    return (
      <View style={styles.stepContainer}>
        {[1, 2, 3, 4, 5].map((idx) => (
          <View key={idx} style={[styles.stepDot, step >= idx ? styles.stepDotActive : null]} />
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[{ flex: 1, backgroundColor: '#f8fafc' }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={prevStep} disabled={loading}>
          <ArrowLeft size={24} color="#192c4d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cadastro Operacional</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderStepCircles()}

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled" 
        style={{ flex: 1 }}
        automaticallyAdjustKeyboardInsets={true}
      >
        {step === 1 && (
          <View style={styles.formGroup}>
            <Text style={styles.stepTitle}>Identificação Básica</Text>
            <Text style={styles.stepSubtitle}>Como faremos seu registro de login.</Text>

            <Text style={styles.label}>Nome Completo</Text>
            <TextInput style={styles.input} placeholder="João da Silva" value={name} onChangeText={setName} />

            <Text style={styles.label}>E-mail Pessoal</Text>
            <TextInput style={styles.input} placeholder="seu@email.com" keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" />

            <Text style={styles.label}>Senha de Acesso (Mín. 6 letras/números)</Text>
            <TextInput style={styles.input} placeholder="******" secureTextEntry value={password} onChangeText={setPassword} />
          </View>
        )}

        {step === 2 && (
          <View style={styles.formGroup}>
            <Text style={styles.stepTitle}>Dados Pessoais</Text>
            <Text style={styles.stepSubtitle}>Segurança contra fraudes.</Text>

            <Text style={styles.label}>CPF (Restrito)</Text>
            <TextInput style={styles.input} placeholder="000.000.000-00" keyboardType="numeric" value={cpf} onChangeText={(t) => setCpf(maskCPF(t))} maxLength={14} />

            <Text style={styles.label}>RG ou Funcional</Text>
            <TextInput style={styles.input} placeholder="0000000-0" value={rg} onChangeText={setRg} />

            <Text style={styles.label}>Telefone / WhatsApp</Text>
            <TextInput style={styles.input} placeholder="(00) 00000-0000" keyboardType="phone-pad" value={phone} onChangeText={(t) => setPhone(maskPhone(t))} maxLength={15} />
          </View>
        )}

        {step === 3 && (
          <View style={styles.formGroup}>
            <Text style={styles.stepTitle}>Endereço Residencial</Text>
            <Text style={styles.stepSubtitle}>Preencha o CEP para auto-completar.</Text>

            <Text style={styles.label}>CEP</Text>
            <View style={styles.cepContainer}>
              <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="00000-000" keyboardType="numeric" value={cep} onChangeText={(t) => setCep(maskCEP(t))} maxLength={9} />
              <TouchableOpacity style={styles.searchCepBtn} onPress={fetchCep} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Search size={20} color="#fff" />}
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Logradouro (Rua/Avenida)</Text>
            <TextInput style={styles.input} placeholder="Rua das Oliveiras" value={address} onChangeText={setAddress} />

            <View style={styles.row}>
              <View style={[styles.flex1, { marginRight: 8 }]}>
                <Text style={styles.label}>Número</Text>
                <TextInput style={styles.input} placeholder="75" keyboardType="default" value={addressNumber} onChangeText={setAddressNumber} />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>Complemento</Text>
                <TextInput style={styles.input} placeholder="Apt 101, Bloco B" value={complement} onChangeText={setComplement} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.flex1, { marginRight: 8 }]}>
                <Text style={styles.label}>Cidade</Text>
                <TextInput style={styles.input} placeholder="São Paulo" value={city} onChangeText={setCity} />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>Bairro</Text>
                <TextInput style={styles.input} placeholder="Centro" value={neighborhood} onChangeText={setNeighborhood} />
              </View>
              <View style={{ flex: 0.4 }}>
                <Text style={styles.label}>UF</Text>
                <TextInput style={styles.input} placeholder="SP" value={uf} onChangeText={setUf} maxLength={2} autoCapitalize="characters" />
              </View>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.formGroup}>
            <Text style={styles.stepTitle}>Perfil Tático</Text>
            <Text style={styles.stepSubtitle}>Para dimensionamento nas contratações.</Text>

            <View style={styles.alertBox}>
              <CheckCircle color="#3b82f6" size={20} style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.alertText}>Esses dados auxiliam nossos algoritmos a escalar a equipe ideal para cada posto.</Text>
            </View>

            <Text style={styles.label}>Altura estimada (Ex: 1.80)</Text>
            <TextInput style={styles.input} placeholder="Metros" keyboardType="numeric" value={height} onChangeText={setHeight} maxLength={4} />

            <Text style={styles.label}>Peso estimado (Ex: 85)</Text>
            <TextInput style={styles.input} placeholder="KG" keyboardType="numeric" value={weight} onChangeText={setWeight} maxLength={4} />
          </View>
        )}

        {step === 5 && (
          <View style={styles.formGroup}>
            <Text style={styles.stepTitle}>Selfie Operacional</Text>
            <Text style={styles.stepSubtitle}>Reconhecimento obrigatório de rosto.</Text>

            <View style={styles.alertBoxWarning}>
              <AlertTriangle color="#ef4444" size={20} style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.alertTextWarning}>Retire óculos escuros e bonés. O uso de fotos de galeria é bloqueado nesta segurança.</Text>
            </View>

            {photoUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: photoUri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.retakeBtn} onPress={retakePicture}>
                  <RefreshCw color="#fff" size={20} style={{ marginRight: 8 }} />
                  <Text style={styles.retakeTxt}>Tirar Novamente</Text>
                </TouchableOpacity>
              </View>
            ) : hasPermission ? (
              <View style={styles.cameraFrame}>
                <CameraView 
                  style={StyleSheet.absoluteFillObject} 
                  facing="front" 
                  ref={cameraRef}
                />
                
                {/* Visual Overlay */}
                <View style={styles.cameraOverlay}>
                  <View style={styles.faceTarget} />
                </View>

                <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
                  <View style={styles.captureInnerBtn} />
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ textAlign: 'center', marginTop: 30, color: '#ef4444' }}>Precisamos de acesso à câmera.</Text>
            )}
          </View>
        )}
        
        {/* Espaço morto para scroll */}
        <View style={{ height: 20 }} />

        {/* Action Bar inside ScrollView for better Android behavior */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.actionBtn} onPress={nextStep} disabled={loading}>
            {loading ? (
               <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.actionBtnText}>{step === totalSteps ? 'Concluir Cadastro e Enviar' : 'Avançar Etapa'}</Text>
                {step !== totalSteps && <ChevronRight color="#fff" size={20} style={{ marginLeft: 8 }} />}
                {step === totalSteps && <UploadCloud color="#fff" size={20} style={{ marginLeft: 8 }} />}
              </>
            )}
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#192c4d',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    backgroundColor: '#fff',
  },
  stepDot: {
    width: 32,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  stepDotActive: {
    backgroundColor: '#3b82f6',
  },
  scrollContent: {
    padding: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  cepContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchCepBtn: {
    backgroundColor: '#192c4d',
    borderRadius: 12,
    width: 53,
    height: 53,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 24,
  },
  alertText: {
    flex: 1,
    color: '#1e3a8a',
    fontSize: 13,
    lineHeight: 20,
  },
  alertBoxWarning: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 24,
  },
  alertTextWarning: {
    flex: 1,
    color: '#991b1b',
    fontSize: 13,
    lineHeight: 20,
  },
  bottomBar: {
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  actionBtn: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraFrame: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceTarget: {
    width: 200,
    height: 250,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 100,
    borderStyle: 'dashed',
  },
  captureBtn: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInnerBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  retakeBtn: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  retakeTxt: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
