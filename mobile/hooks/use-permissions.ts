import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import { Accelerometer } from 'expo-sensors';

export function useAppPermissions() {
  const [allGranted, setAllGranted] = useState(false);

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // 1. Câmera
        const cameraStatus = await Camera.requestCameraPermissionsAsync();
        
        // 2. Microfone
        const audioStatus = await Audio.requestPermissionsAsync();
        
        // 3. GPS / Localização
        const locationStatus = await Location.requestForegroundPermissionsAsync();
        
        // 4. Acelerômetro é dado por padrão na instalação em muitos dispositivos, mas podemos verificar a disponibilidade
        const hasAccelerometer = await Accelerometer.isAvailableAsync();

        if (
          cameraStatus.status === 'granted' &&
          audioStatus.status === 'granted' &&
          locationStatus.status === 'granted'
        ) {
          setAllGranted(true);
        } else {
          Alert.alert(
            'Permissões Necessárias', 
            'O App AlphaGuard depende de GPS, Câmera e Microfone para garantir a segurança operacional e auditar registros. Por favor, libere nas configurações.'
          );
        }
      } catch (e) {
        console.error("Erro solicitando permissões", e);
      }
    };

    requestPermissions();
  }, []);

  return allGranted;
}
