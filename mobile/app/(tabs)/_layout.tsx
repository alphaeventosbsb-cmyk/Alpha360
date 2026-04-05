import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { MapPin, QrCode, AlertTriangle, UserCircle, Briefcase } from 'lucide-react-native';
import { useAppPermissions } from '../../hooks/use-permissions';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  useAppPermissions(); // Chama os diálogos de permissão assim que a tela abre
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: true,
        header: () => (
          <View style={{
            height: 60 + insets.top,
            paddingTop: insets.top,
            backgroundColor: '#192c4d',
            justifyContent: 'center',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: '#0f1b2e'
          }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Alpha360</Text>
          </View>
        ),
        tabBarStyle: {
          height: 65 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 10,
          backgroundColor: '#192c4d',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Ponto',
          tabBarIcon: ({ color }) => <MapPin size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vagas"
        options={{
          tabBarLabel: 'Vagas',
          tabBarIcon: ({ color }) => <Briefcase size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          tabBarLabel: 'Leitor QR',
          tabBarIcon: ({ color }) => <QrCode size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          tabBarLabel: 'S.O.S',
          tabBarIcon: ({ color }) => <AlertTriangle size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => <UserCircle size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
