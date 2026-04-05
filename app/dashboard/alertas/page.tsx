'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Trash2, Loader2, Filter, Clock, MapPin, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/use-auth';
import { deleteAlert, updateAlert } from '@/lib/firestore-service';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase';
import type { Alert } from '@/lib/types';

export default function AlertasPage() {
  const { user, userData } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  useEffect(() => {
    if (!user) return;

    const constraints: any[] = [
      where('companyId', '==', userData?.companyId || ''),
      orderBy('createdAt', 'desc'),
      limit(50),
    ];

    const q = query(collection(db, 'alerts'), ...constraints);
    const unsub = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Alert));

      // Filter by role
      if (userData?.role === 'guard') {
        data = data.filter(a => a.guardId === user.uid);
      } else if (userData?.role === 'client') {
        data = data.filter(a => a.contractorId === user.uid);
      }

      setAlerts(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user, userData]);

  const handleResolve = async (alertId: string) => {
    try {
      await updateAlert(alertId, { status: 'resolved' });
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleDelete = async (alertId: string) => {
    if (!window.confirm('Excluir este alerta?')) return;
    try {
      await deleteAlert(alertId);
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'active') return a.status === 'active' || a.status === 'dispatching';
    if (filter === 'resolved') return a.status === 'resolved';
    return true;
  });

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'sos': return { bg: 'bg-red-100', text: 'text-red-700', label: '🆘 SOS Emergência' };
      case 'relief': return { bg: 'bg-amber-100', text: 'text-amber-700', label: '🚻 Rendição' };
      case 'hydration': return { bg: 'bg-blue-100', text: 'text-blue-700', label: '💧 Hidratação' };
      case 'checkin': return { bg: 'bg-green-100', text: 'text-green-700', label: '🔐 Check-in' };
      case 'checkout': return { bg: 'bg-indigo-100', text: 'text-indigo-700', label: '🔓 Check-out' };
      case 'arrival': return { bg: 'bg-teal-100', text: 'text-teal-700', label: '📍 Chegada' };
      case 'job_accepted': return { bg: 'bg-purple-100', text: 'text-purple-700', label: '✅ Vaga Aceita' };
      default: return { bg: 'bg-slate-100', text: 'text-slate-700', label: type };
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return { bg: 'bg-red-500', text: 'text-red-600', label: 'Ativo' };
      case 'dispatching': return { bg: 'bg-amber-500', text: 'text-amber-600', label: 'Despachando' };
      case 'resolved': return { bg: 'bg-green-500', text: 'text-green-600', label: 'Resolvido' };
      default: return { bg: 'bg-slate-400', text: 'text-slate-600', label: status };
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#192c4d]" />
      </div>
    );
  }

  const activeCount = alerts.filter(a => a.status === 'active' || a.status === 'dispatching').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Central de Alertas</h2>
          <p className="text-slate-500 text-sm">{activeCount} alertas ativos</p>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'active', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f
                  ? 'bg-[#192c4d] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f === 'all' ? `Todos (${alerts.length})` : f === 'active' ? `Ativos (${activeCount})` : `Resolvidos (${alerts.length - activeCount})`}
            </button>
          ))}
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <AlertTriangle className="size-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Nenhum alerta</h3>
          <p className="text-slate-500 text-sm">Alertas aparecerão aqui quando forem disparados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredAlerts.map((alert) => {
              const typeStyle = getTypeStyle(alert.type);
              const statusStyle = getStatusStyle(alert.status);
              const isSOS = alert.type === 'sos' && alert.status !== 'resolved';

              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`bg-white rounded-xl border ${isSOS ? 'border-red-300 shadow-lg shadow-red-500/10' : 'border-slate-200'} overflow-hidden`}
                >
                  <div className={`flex items-center gap-4 p-4 ${isSOS ? 'bg-red-50/50' : ''}`}>
                    {/* Status dot */}
                    <div className={`size-3 rounded-full ${statusStyle.bg} shrink-0 ${isSOS ? 'animate-pulse' : ''}`} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                          {typeStyle.label}
                        </span>
                        <span className={`text-[10px] font-bold ${statusStyle.text}`}>{statusStyle.label}</span>
                      </div>
                      <p className="text-sm text-slate-700 mt-1 truncate">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-[10px] text-slate-400">
                        {alert.guardName && (
                          <span className="flex items-center gap-1"><User className="size-3" />{alert.guardName}</span>
                        )}
                        <span className="flex items-center gap-1"><Clock className="size-3" />{formatTime(alert.createdAt)}</span>
                        {alert.lat && alert.lng && (
                          <span className="flex items-center gap-1"><MapPin className="size-3" />{alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {alert.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolve(alert.id!)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Resolver"
                        >
                          <CheckCircle2 className="size-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(alert.id!)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
