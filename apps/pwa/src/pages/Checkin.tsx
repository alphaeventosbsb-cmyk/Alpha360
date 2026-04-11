import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { ScanLine, Loader2, CheckCircle2, XCircle, Camera, MapPin } from 'lucide-react';

export default function CheckinPage() {
  const { user, userData } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<any>(null);
  const scannerRef = useRef<any>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const assignments = await api.getGuardAssignments(user.uid);
        const checkedIn = assignments.find((a: any) => a.status === 'checked_in');
        setActiveAssignment(checkedIn || null);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [user]);

  const startScanner = async () => {
    setScanning(true);
    setStatus('idle');
    setMessage('');

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          try {
            scanner.stop().catch(() => {});
            setScanning(false);
            setLoading(true);

            let qrData: any;
            try {
              qrData = JSON.parse(decodedText);
            } catch {
              qrData = { token: decodedText };
            }

            // Get location
            let lat: number | undefined;
            let lng: number | undefined;
            try {
              const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: true, timeout: 5000,
                });
              });
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
            } catch {}

            if (activeAssignment) {
              // Checkout
              await api.checkout({ qrData, lat, lng, assignmentId: activeAssignment.id, jobId: activeAssignment.jobId });
              setStatus('success');
              setMessage('Check-out realizado com sucesso!');
              setActiveAssignment(null);
            } else {
              // Checkin
              await api.checkin({ qrData, lat, lng });
              setStatus('success');
              setMessage('Check-in realizado com sucesso!');
              const assignments = await api.getGuardAssignments(user!.uid);
              const ci = assignments.find((a: any) => a.status === 'checked_in');
              setActiveAssignment(ci || null);
            }
          } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Erro ao processar QR Code.');
          } finally {
            setLoading(false);
          }
        },
        () => {} // ignore scan errors
      );
    } catch (err: any) {
      setScanning(false);
      setStatus('error');
      setMessage('Erro ao acessar a câmera. Verifique as permissões.');
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      <div className="safe-top" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>
          {activeAssignment ? 'Check-out' : 'Check-in'}
        </h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
          {activeAssignment ? 'Escaneie o QR Code para finalizar' : 'Escaneie o QR Code para iniciar'}
        </p>
      </div>

      {/* Active Status */}
      {activeAssignment && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
          border: '1px solid rgba(34,197,94,0.3)', borderRadius: 16, padding: 16, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 99, background: '#22c55e',
              boxShadow: '0 0 8px rgba(34,197,94,0.5)',
            }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: '#22c55e', textTransform: 'uppercase' }}>
              Em Serviço
            </span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 700 }}>{activeAssignment.jobName || 'Escala ativa'}</p>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            Entrada: {activeAssignment.checkinAt ? new Date(activeAssignment.checkinAt).toLocaleTimeString('pt-BR') : '-'}
          </p>
        </div>
      )}

      {/* Scanner Area */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 20, overflow: 'hidden', marginBottom: 20,
      }}>
        {scanning ? (
          <div>
            <div id="qr-reader" style={{ width: '100%' }} />
            <button onClick={stopScanner} style={{
              width: '100%', padding: 14, background: '#ef4444', color: 'white',
              fontSize: 14, fontWeight: 800,
            }}>
              Cancelar Scanner
            </button>
          </div>
        ) : (
          <div style={{
            padding: '48px 24px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            {loading ? (
              <>
                <Loader2 size={48} className="animate-spin" style={{ color: '#3b82f6', marginBottom: 16 }} />
                <p style={{ fontSize: 15, fontWeight: 700 }}>Processando...</p>
              </>
            ) : status === 'success' ? (
              <>
                <div style={{
                  width: 72, height: 72, borderRadius: 99,
                  background: 'rgba(34,197,94,0.15)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <CheckCircle2 size={36} color="#22c55e" />
                </div>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#22c55e' }}>{message}</p>
              </>
            ) : status === 'error' ? (
              <>
                <div style={{
                  width: 72, height: 72, borderRadius: 99,
                  background: 'rgba(239,68,68,0.15)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <XCircle size={36} color="#ef4444" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>{message}</p>
              </>
            ) : (
              <>
                <div style={{
                  width: 88, height: 88, borderRadius: 24,
                  background: 'rgba(59,130,246,0.12)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <Camera size={40} color="#3b82f6" />
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Scanner QR Code</p>
                <p style={{ fontSize: 12, color: '#64748b' }}>Aponte a câmera para o QR Code do posto</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Scan Button */}
      {!scanning && (
        <button
          onClick={() => { setStatus('idle'); setMessage(''); startScanner(); }}
          disabled={loading}
          style={{
            width: '100%', padding: '16px', borderRadius: 14,
            background: activeAssignment
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: 'white', fontSize: 16, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: activeAssignment
              ? '0 4px 20px rgba(239,68,68,0.3)'
              : '0 4px 20px rgba(34,197,94,0.3)',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <ScanLine size={20} />
          {activeAssignment ? 'Fazer Check-out' : 'Fazer Check-in'}
        </button>
      )}
    </div>
  );
}
