'use client';

import React, { useState } from 'react';
import { ScanLine, QrCode, CheckCircle2, LogOut as LogOutIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { QRScanner } from '@/components/QRScanner';
import { performCheckin, performCheckout } from '@/lib/firestore-service';
import { useAuth } from '@/hooks/use-auth';
import type { QRCodeData } from '@/lib/types';

export default function CheckinPage() {
  const { user } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const [scanType, setScanType] = useState<'checkin' | 'checkout'>('checkin');

  const handleScan = async (qrData: QRCodeData): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Usuário não autenticado.' };

    // Get GPS
    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // Continue without GPS
    }

    if (qrData.type === 'checkin') {
      return performCheckin(qrData, user.uid, lat, lng);
    } else {
      return performCheckout(qrData, user.uid, lat, lng);
    }
  };

  const openScanner = (type: 'checkin' | 'checkout') => {
    setScanType(type);
    setShowScanner(true);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Check-in / Check-out</h2>
        <p className="text-slate-500 text-sm mt-1">
          Escaneie o QR Code do contratante para iniciar ou finalizar sua escala.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Check-in Card */}
        <motion.button
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openScanner('checkin')}
          className="bg-white rounded-2xl border-2 border-green-200 p-8 flex flex-col items-center gap-4 hover:shadow-xl hover:shadow-green-500/10 transition-all text-center"
        >
          <div className="size-20 rounded-full bg-green-100 flex items-center justify-center">
            <ScanLine className="size-10 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-700">🔐 CHECK-IN</h3>
            <p className="text-sm text-slate-500 mt-1">Iniciar escala</p>
            <p className="text-xs text-slate-400 mt-2">
              Escaneie o QR Code para registrar seu início de turno e ativar o rastreamento GPS.
            </p>
          </div>
          <div className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20">
            Escanear Check-in
          </div>
        </motion.button>

        {/* Check-out Card */}
        <motion.button
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openScanner('checkout')}
          className="bg-white rounded-2xl border-2 border-blue-200 p-8 flex flex-col items-center gap-4 hover:shadow-xl hover:shadow-blue-500/10 transition-all text-center"
        >
          <div className="size-20 rounded-full bg-blue-100 flex items-center justify-center">
            <CheckCircle2 className="size-10 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-700">🔓 CHECK-OUT</h3>
            <p className="text-sm text-slate-500 mt-1">Finalizar escala</p>
            <p className="text-xs text-slate-400 mt-2">
              Escaneie o QR Code para registrar o fim do turno e calcular suas horas trabalhadas.
            </p>
          </div>
          <div className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20">
            Escanear Check-out
          </div>
        </motion.button>
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
          title={scanType === 'checkin' ? 'Check-in' : 'Check-out'}
        />
      )}
    </div>
  );
}
