'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Loader2, CheckCircle2, AlertTriangle, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { QRCodeData } from '@/lib/types';

interface QRScannerProps {
  onScan: (data: QRCodeData) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
  title?: string;
}

export function QRScanner({ onScan, onClose, title = 'Escanear QR Code' }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader';

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setError('');
    setResult(null);

    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          try {
            const qrData: QRCodeData = JSON.parse(decodedText);

            if (!qrData.type || !qrData.jobId || !qrData.token) {
              setError('QR Code inválido. Não contém dados de escala.');
              return;
            }

            // Stop scanning
            await stopScanner();
            setProcessing(true);

            // Process the scan
            const scanResult = await onScan(qrData);
            setResult(scanResult);
            setProcessing(false);

            // Vibrate on success
            if (scanResult.success && navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
          } catch {
            setError('QR Code inválido. Formato não reconhecido.');
          }
        },
        () => {} // ignore errors during scanning
      );

      setScanning(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      setError(
        err?.message?.includes('NotAllowedError')
          ? 'Permissão de câmera negada. Habilite nas configurações do navegador.'
          : 'Erro ao acessar a câmera. Verifique se está usando HTTPS.'
      );
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      scannerRef.current = null;
      setScanning(false);
    } catch {
      // ignore cleanup errors
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  const resetAndScanAgain = () => {
    setResult(null);
    setError('');
    startScanner();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#192c4d] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScanLine className="size-5" />
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-5">
          {!scanning && !result && !processing && (
            <div className="flex flex-col items-center py-8">
              <div className="size-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Camera className="size-10 text-slate-400" />
              </div>
              <p className="text-slate-600 text-sm text-center mb-6">
                Aponte a câmera para o QR Code da escala para realizar o {title.toLowerCase()}.
              </p>
              <button
                onClick={startScanner}
                className="px-6 py-3 bg-[#192c4d] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#192c4d]/90 transition-all shadow-lg shadow-[#192c4d]/20"
              >
                <Camera className="size-5" />
                Abrir Câmera
              </button>
            </div>
          )}

          {/* Camera View */}
          <div
            id={containerId}
            className={`w-full rounded-xl overflow-hidden ${scanning ? '' : 'hidden'}`}
            style={{ minHeight: scanning ? 300 : 0 }}
          />

          {scanning && (
            <p className="text-center text-xs text-slate-500 mt-3 animate-pulse">
              Posicione o QR Code dentro do quadro...
            </p>
          )}

          {/* Processing */}
          {processing && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="size-12 text-[#192c4d] animate-spin mb-4" />
              <p className="text-slate-600 text-sm font-medium">Validando QR Code...</p>
            </div>
          )}

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center py-6"
              >
                <div className={`size-20 rounded-full flex items-center justify-center mb-4 ${
                  result.success ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {result.success ? (
                    <CheckCircle2 className="size-10 text-green-600" />
                  ) : (
                    <AlertTriangle className="size-10 text-red-600" />
                  )}
                </div>
                <h4 className={`text-lg font-bold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.success ? 'Sucesso!' : 'Erro'}
                </h4>
                <p className="text-sm text-slate-600 text-center mt-2">{result.message}</p>

                <div className="flex gap-3 mt-6 w-full">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50"
                  >
                    Fechar
                  </button>
                  {!result.success && (
                    <button
                      onClick={resetAndScanAgain}
                      className="flex-1 px-4 py-2.5 bg-[#192c4d] text-white rounded-lg font-bold hover:bg-[#192c4d]/90 shadow-lg"
                    >
                      Tentar Novamente
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
