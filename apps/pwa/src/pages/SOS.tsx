import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { AlertTriangle, Droplets, Users, Loader2, Shield, CheckCircle2 } from 'lucide-react';

type AlertType = 'sos' | 'relief' | 'hydration';

export default function SOSPage() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<AlertType | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleAction = async (type: AlertType) => {
    if (!user) return;
    setLoading(type);
    setShowConfirm(null);

    try {
      let lat: number | undefined;
      let lng: number | undefined;
      if ('geolocation' in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true, timeout: 5000,
            });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {}
      }

      const messages: Record<AlertType, string> = {
        sos: `🆘 EMERGÊNCIA! ${userData?.name || 'Vigilante'} acionou SOS!`,
        relief: `🚻 ${userData?.name || 'Vigilante'} solicitou rendição`,
        hydration: `💧 ${userData?.name || 'Vigilante'} solicitou hidratação`,
      };

      let jobId = '';
      try {
        const assignments = await api.getGuardAssignments(user.uid);
        const active = assignments.find((a: any) => ['approved', 'checked_in'].includes(a.status));
        if (active) jobId = active.jobId || active.id;
      } catch (e) {
        console.warn('Failed to find active jobId for alert:', e);
      }

      const res = await api.createAlert({
        type,
        guardId: user.uid,
        guardName: userData?.name || 'Vigilante',
        companyId: userData?.companyId || '',
        jobId, // Allows Dashboard to reply directly to this job's Chat
        lat, lng,
        message: messages[type],
        status: type === 'sos' ? 'active' : 'dispatching',
      });

      if (type === 'sos' && navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }

      setFeedback({
        type: 'success',
        message: type === 'sos' ? 'SOS enviado! A equipe foi notificada.' : 'Solicitação enviada!',
      });
      setTimeout(() => setFeedback(null), 4000);

      // Start watching this specific alert for Dashboard Response
      setActiveAlertId(res.id);

    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro ao enviar. Tente novamente.' });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setLoading(null);
    }
  };

  // Poll for Dashboard Response
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [baseResponse, setBaseResponse] = useState<string | null>(null);

  React.useEffect(() => {
    if (!activeAlertId) return;
    const checkStatus = async () => {
      try {
        const alerts = await api.listAlerts({ guardId: user!.uid });
        const myAlert = alerts.find(a => a.id === activeAlertId);
        if (myAlert && myAlert.status === 'resolved') {
          // Dashboard answered!
          setActiveAlertId(null);
          setBaseResponse(myAlert.type.toUpperCase());
          // Play HT Radio Beep
          const audio = new Audio('https://actions.google.com/sounds/v1/communication/beep_short.ogg');
          audio.play().catch(() => {});
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }
      } catch (e) {}
    };
    const iv = setInterval(checkStatus, 3000);
    return () => clearInterval(iv);
  }, [activeAlertId, user]);

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      <div className="safe-top" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={22} color="#ef4444" /> Ações de Emergência
        </h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
          Envie alertas para a central de operações.
        </p>
      </div>

      {/* SOS Button - Big */}
      <button
        onClick={() => setShowConfirm('sos')}
        disabled={loading === 'sos'}
        className="animate-pulse-glow"
        style={{
          width: '100%', padding: '28px 16px', borderRadius: 20,
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white', fontSize: 22, fontWeight: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          border: 'none', marginBottom: 20,
          boxShadow: '0 8px 32px rgba(239,68,68,0.4)',
          opacity: loading === 'sos' ? 0.6 : 1,
        }}
      >
        {loading === 'sos' ? (
          <Loader2 size={28} className="animate-spin" />
        ) : (
          <><AlertTriangle size={28} /> 🆘 SOS EMERGÊNCIA</>
        )}
      </button>

      {/* Other Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => setShowConfirm('relief')}
          disabled={loading === 'relief'}
          style={{
            padding: '24px 12px', borderRadius: 16,
            background: 'var(--color-surface)', border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            opacity: loading === 'relief' ? 0.6 : 1,
          }}
        >
          {loading === 'relief' ? (
            <Loader2 size={28} className="animate-spin" style={{ color: '#f59e0b' }} />
          ) : (
            <Users size={28} color="#f59e0b" />
          )}
          <span style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b' }}>🚻 Rendição</span>
          <span style={{ fontSize: 10, color: '#64748b', textAlign: 'center' }}>Pedir substituição</span>
        </button>

        <button
          onClick={() => setShowConfirm('hydration')}
          disabled={loading === 'hydration'}
          style={{
            padding: '24px 12px', borderRadius: 16,
            background: 'var(--color-surface)', border: '1px solid rgba(59,130,246,0.3)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            opacity: loading === 'hydration' ? 0.6 : 1,
          }}
        >
          {loading === 'hydration' ? (
            <Loader2 size={28} className="animate-spin" style={{ color: '#3b82f6' }} />
          ) : (
            <Droplets size={28} color="#3b82f6" />
          )}
          <span style={{ fontSize: 13, fontWeight: 800, color: '#3b82f6' }}>💧 Hidratação</span>
          <span style={{ fontSize: 10, color: '#64748b', textAlign: 'center' }}>Pedir água/suprimentos</span>
        </button>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div className="animate-fade-in" style={{
            background: '#1e293b', borderRadius: 20, padding: 28,
            width: '100%', maxWidth: 340, textAlign: 'center',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 99, margin: '0 auto 16px',
              background: showConfirm === 'sos' ? 'rgba(239,68,68,0.15)' :
                showConfirm === 'relief' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {showConfirm === 'sos' && <AlertTriangle size={30} color="#ef4444" />}
              {showConfirm === 'relief' && <Users size={30} color="#f59e0b" />}
              {showConfirm === 'hydration' && <Droplets size={30} color="#3b82f6" />}
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
              {showConfirm === 'sos' ? 'Confirmar SOS?' :
                showConfirm === 'relief' ? 'Solicitar Rendição?' : 'Solicitar Hidratação?'}
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>
              {showConfirm === 'sos'
                ? 'Alerta de emergência com sua localização será enviado.'
                : 'O contratante será notificado.'}
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowConfirm(null)}
                style={{
                  flex: 1, padding: 14, borderRadius: 12,
                  border: '1px solid var(--color-border)', fontSize: 14, fontWeight: 700,
                  color: '#94a3b8',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleAction(showConfirm)}
                style={{
                  flex: 1, padding: 14, borderRadius: 12,
                  background: showConfirm === 'sos' ? '#ef4444' :
                    showConfirm === 'relief' ? '#f59e0b' : '#3b82f6',
                  color: 'white', fontSize: 14, fontWeight: 800,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TACTICAL RESPONSE MODAL */}
      {baseResponse && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div className="animate-fade-in" style={{
            background: '#0f172a', borderRadius: 24, padding: 32,
            width: '100%', maxWidth: 360, textAlign: 'center',
            border: '2px solid #3b82f6', boxShadow: '0 0 50px rgba(59,130,246,0.3)'
          }}>
            <div className="animate-pulse" style={{
              width: 80, height: 80, borderRadius: 99, margin: '0 auto 20px',
              background: 'rgba(59,130,246,0.2)', border: '2px solid #3b82f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={40} color="#3b82f6" />
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#eff6ff', marginBottom: 12, textTransform: 'uppercase' }}>
              Base Respondeu
            </h2>
            <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 32, lineHeight: 1.5 }}>
              A sua solicitação <b>{baseResponse}</b> foi recebida pela Central. Reforços e suporte estão a caminho. Permaneça no Protocolo Tático.
            </p>

            <button
              onClick={() => setBaseResponse(null)}
              style={{
                width: '100%', padding: '16px', borderRadius: 12,
                background: '#3b82f6', color: 'white', fontSize: 16, fontWeight: 900,
                boxShadow: '0 4px 16px rgba(59,130,246,0.4)', border: 'none'
              }}
            >
              Ciente (QSL)
            </button>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div className="animate-slide-up" style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 100, padding: '12px 24px', borderRadius: 14,
          background: feedback.type === 'success' ? '#22c55e' : '#ef4444',
          color: 'white', fontSize: 13, fontWeight: 700,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
        }}>
          <CheckCircle2 size={16} /> {feedback.message}
        </div>
      )}
    </div>
  );
}
