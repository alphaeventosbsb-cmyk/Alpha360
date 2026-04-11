import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Briefcase, ScanLine, Clock, MapPin, ChevronRight,
  Loader2, CalendarDays, Star
} from 'lucide-react';

export default function HomePage() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const data = await api.getGuardAssignments(user.uid);
        const active = data.filter((a: any) =>
          ['approved', 'checked_in', 'invited', 'pending'].includes(a.status)
        );
        setAssignments(active);
      } catch (err) {
        console.error('Error loading assignments:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const checkedIn = assignments.find(a => a.status === 'checked_in');
  const upcoming = assignments.filter(a => a.status === 'approved');
  const pending = assignments.filter(a => a.status === 'pending' || a.status === 'invited');

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }} className="safe-top">
        <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Olá, vigilante</p>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginTop: 2 }}>
          {userData?.name || user?.displayName || 'Bem-vindo'}
        </h1>
        {userData?.rank && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 700, color: '#3b82f6', background: 'rgba(59,130,246,0.1)',
            padding: '4px 10px', borderRadius: 8, marginTop: 8,
          }}>
            <Star size={12} /> {userData.rank}
          </span>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28,
      }}>
        {[
          { icon: Briefcase, label: 'Vagas', desc: 'Disponíveis', path: '/vagas', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
          { icon: ScanLine, label: 'Check-in', desc: 'QR Code', path: '/checkin', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
          { icon: Shield, label: 'SOS', desc: 'Emergência', path: '/sos', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
          { icon: CalendarDays, label: 'Perfil', desc: 'Meus Dados', path: '/perfil', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              padding: '20px 12px', borderRadius: 16,
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <item.icon size={22} color={item.color} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{item.label}</p>
              <p style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>{item.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Active Check-in */}
      {checkedIn && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 16, padding: 16, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: 99, background: '#22c55e',
              boxShadow: '0 0 8px rgba(34,197,94,0.5)',
            }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Em Serviço
            </span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 700 }}>{checkedIn.jobName || checkedIn.clientName || 'Escala ativa'}</p>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            Check-in: {checkedIn.checkinAt ? new Date(checkedIn.checkinAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
          </p>
        </div>
      )}

      {/* Upcoming Assignments */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={16} color="#3b82f6" /> Escalas Confirmadas
        </h2>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <Loader2 size={24} className="animate-spin" style={{ color: '#3b82f6' }} />
          </div>
        ) : upcoming.length === 0 ? (
          <div style={{
            padding: '32px 16px', textAlign: 'center', borderRadius: 14,
            border: '1px dashed var(--color-border)', color: '#64748b',
          }}>
            <Briefcase size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
            <p style={{ fontSize: 13, fontWeight: 600 }}>Nenhuma escala confirmada</p>
            <p style={{ fontSize: 11, marginTop: 4 }}>Procure vagas disponíveis</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.map((a, i) => (
              <div key={i} style={{
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700 }}>{a.jobName || a.clientName || 'Escala'}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <MapPin size={12} color="#64748b" />
                    <span style={{ fontSize: 11, color: '#64748b' }}>{a.location || 'Local não informado'}</span>
                  </div>
                </div>
                <ChevronRight size={18} color="#475569" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 14, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer'
        }} onClick={() => navigate('/vagas')}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b' }}>Ações Pendentes</p>
            <p style={{ fontSize: 11, color: '#d97706', marginTop: 2 }}>Você tem {pending.length} solicitação(ões) em análise</p>
          </div>
          <ChevronRight size={18} color="#f59e0b" />
        </div>
      )}
    </div>
  );
}
