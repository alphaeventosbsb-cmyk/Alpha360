'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Radio, AlertTriangle, CheckCircle2, Phone, MapPin, Clock, User, 
  Loader2, Volume2, VolumeX, Shield, Droplets, Users as UsersIcon,
  Navigation, Filter, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';
import type { Alert } from '@/lib/types';
import { sendLocalNotification } from '@/components/sw-register';

const LiveMap = dynamic(() => import('@/components/LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-lg">
      <Loader2 className="size-6 text-[#192c4d] animate-spin" />
    </div>
  ),
});

// Web Audio API alarm generator
function useSOSAlarm() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const startAlarm = useCallback(() => {
    if (isPlaying) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gainRef.current = gain;

      let on = true;
      const playTone = () => {
        if (!audioContextRef.current) return;
        try {
          const osc = audioContextRef.current.createOscillator();
          osc.type = 'square';
          osc.frequency.setValueAtTime(on ? 880 : 660, audioContextRef.current.currentTime);
          osc.connect(gain);
          osc.start();
          osc.stop(audioContextRef.current.currentTime + 0.3);
          on = !on;
        } catch {}
      };

      playTone();
      intervalRef.current = setInterval(playTone, 500);
      setIsPlaying(true);
    } catch (error) {
      console.error('[SOS Alarm] Error:', error);
    }
  }, [isPlaying]);

  const stopAlarm = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, []);

  return { startAlarm, stopAlarm, isPlaying };
}

export default function DespachoPage() {
  const { user, userData } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [resolvedAlerts, setResolvedAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sos' | 'relief' | 'hydration'>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [guardPhones, setGuardPhones] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { startAlarm, stopAlarm, isPlaying } = useSOSAlarm();
  const prevSOSCountRef = useRef(0);

  // Load alerts via API
  const loadAlerts = async () => {
    if (!user) return;
    try {
      const allAlerts = await api.listAlerts({ limit: 50 });
      const active = allAlerts.filter((a: any) => a.status === 'active' || a.status === 'dispatching');
      const resolved = allAlerts.filter((a: any) => a.status === 'resolved').slice(0, 10);
      setAlerts(active);
      setResolvedAlerts(resolved);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // SOS alarm trigger + push notification
  useEffect(() => {
    const sosAlerts = alerts.filter(a => a.type === 'sos' && a.status === 'active');
    if (sosAlerts.length > 0 && soundEnabled) {
      if (sosAlerts.length > prevSOSCountRef.current) {
        startAlarm();
        // Vibrate on mobile
        if (navigator.vibrate) {
          navigator.vibrate([1000, 500, 1000, 500, 1000]);
        }
        // Push notification
        const newSOS = sosAlerts[0];
        sendLocalNotification('🆘 SOS ATIVO — Alpha360', {
          body: `${newSOS.guardName || 'Vigilante'}: ${newSOS.message || 'Alerta de emergência!'}`,
          tag: `sos-despacho-${newSOS.id}`,
          data: { url: '/dashboard/despacho' },
        });
      }
    } else {
      stopAlarm();
    }
    prevSOSCountRef.current = sosAlerts.length;
  }, [alerts, soundEnabled, startAlarm, stopAlarm]);

  const handleResolve = async (alertId: string) => {
    setResolving(alertId);
    try {
      await api.updateAlert(alertId, { status: 'resolved' } as any);
      if (selectedAlert?.id === alertId) setSelectedAlert(null);
      loadAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    } finally {
      setResolving(null);
    }
  };

  const handleDispatch = async (alertId: string) => {
    setResolving(alertId);
    try {
      await api.updateAlert(alertId, { status: 'dispatching' } as any);
      loadAlerts();
    } catch (error) {
      console.error('Error dispatching:', error);
    } finally {
      setResolving(null);
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'sos': return { icon: AlertTriangle, label: 'SOS EMERGÊNCIA', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-300', emoji: '🆘' };
      case 'relief': return { icon: UsersIcon, label: 'Rendição', color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-300', emoji: '🚻' };
      case 'hydration': return { icon: Droplets, label: 'Hidratação', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-300', emoji: '💧' };
      case 'arrival': return { icon: Navigation, label: 'Chegada', color: 'text-teal-600', bg: 'bg-teal-100', border: 'border-teal-300', emoji: '📍' };
      default: return { icon: Shield, label: type, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300', emoji: '⚠️' };
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.type === filter);
  const sosCount = alerts.filter(a => a.type === 'sos' && a.status === 'active').length;
  const reliefCount = alerts.filter(a => a.type === 'relief').length;
  const hydrationCount = alerts.filter(a => a.type === 'hydration').length;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="size-8 animate-spin text-[#192c4d]" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* SOS Banner */}
      {sosCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500 text-white rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-red-500/30 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="size-12 bg-white/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="size-7" />
            </div>
            <div>
              <h3 className="text-lg font-black">🆘 {sosCount} SOS ATIVO{sosCount > 1 ? 'S' : ''}!</h3>
              <p className="text-red-100 text-sm">
                {alerts.filter(a => a.type === 'sos' && a.status === 'active').map(a => a.guardName).join(', ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isPlaying) {
                  stopAlarm();
                  setSoundEnabled(false);
                } else {
                  setSoundEnabled(true);
                  startAlarm();
                }
              }}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              {isPlaying ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
            </button>
            {sosCount === 1 && (
              <button
                onClick={() => handleResolve(alerts.find(a => a.type === 'sos' && a.status === 'active')!.id!)}
                disabled={!!resolving}
                className="px-4 py-2 bg-white text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors text-sm"
              >
                {resolving ? <Loader2 className="size-4 animate-spin" /> : '✅ Resolver'}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Radio className="size-6 text-[#192c4d]" />
            Central de Despacho
          </h2>
          <p className="text-slate-500 text-sm">Gerencie alertas operacionais em tempo real.</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
            <Activity className="size-3 animate-pulse" /> Sistema Online
          </span>
        </div>
      </div>

      {/* Stats & Filters */}
      <div className="grid grid-cols-4 gap-3">
        <button onClick={() => setFilter('all')} className={`p-4 rounded-xl border transition-all ${filter === 'all' ? 'bg-[#192c4d] text-white border-[#192c4d] shadow-lg shadow-[#192c4d]/20' : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'}`}>
          <p className="text-2xl font-black">{alerts.length}</p>
          <p className="text-xs font-medium opacity-70">Todos Ativos</p>
        </button>
        <button onClick={() => setFilter('sos')} className={`p-4 rounded-xl border transition-all ${filter === 'sos' ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20' : sosCount > 0 ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'}`}>
          <p className="text-2xl font-black">{sosCount}</p>
          <p className="text-xs font-medium opacity-70">🆘 SOS</p>
        </button>
        <button onClick={() => setFilter('relief')} className={`p-4 rounded-xl border transition-all ${filter === 'relief' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'}`}>
          <p className="text-2xl font-black">{reliefCount}</p>
          <p className="text-xs font-medium opacity-70">🚻 Rendição</p>
        </button>
        <button onClick={() => setFilter('hydration')} className={`p-4 rounded-xl border transition-all ${filter === 'hydration' ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'}`}>
          <p className="text-2xl font-black">{hydrationCount}</p>
          <p className="text-xs font-medium opacity-70">💧 Hidratação</p>
        </button>
      </div>

      {/* Main Content: Alerts + Map */}
      <div className="flex gap-6 h-[500px]">
        {/* Alert List */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Alertas Ativos ({filteredAlerts.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredAlerts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                <div className="text-center">
                  <CheckCircle2 className="size-10 mx-auto mb-2 text-green-300" />
                  <p className="font-medium">Nenhum alerta ativo</p>
                  <p className="text-xs">Tudo sob controle.</p>
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {filteredAlerts.map((alert) => {
                  const config = getTypeConfig(alert.type);
                  const isSOS = alert.type === 'sos' && alert.status === 'active';
                  const phone = alert.guardId ? guardPhones[alert.guardId] : undefined;
                  
                  return (
                    <motion.div
                      key={alert.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      onClick={() => setSelectedAlert(alert)}
                      className={`p-4 cursor-pointer transition-all hover:bg-slate-50 ${
                        selectedAlert?.id === alert.id ? 'bg-slate-50 border-l-4 border-l-[#192c4d]' : ''
                      } ${isSOS ? 'bg-red-50/50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
                          <config.icon className={`size-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                              {config.emoji} {config.label}
                            </span>
                            <span className={`text-[9px] font-bold ${
                              alert.status === 'active' ? 'text-red-500' : 'text-amber-500'
                            }`}>
                              {alert.status === 'active' ? '● ATIVO' : '● DESPACHANDO'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 mt-1 line-clamp-1">{alert.message}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                            {alert.guardName && (
                              <span className="flex items-center gap-1"><User className="size-3" />{alert.guardName}</span>
                            )}
                            <span className="flex items-center gap-1"><Clock className="size-3" />{formatTime(alert.createdAt)}</span>
                          </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex flex-col gap-1 shrink-0">
                          {phone && (
                            <a href={`tel:${phone}`} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Ligar">
                              <Phone className="size-4" />
                            </a>
                          )}
                          {alert.status === 'active' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDispatch(alert.id!); }}
                              disabled={resolving === alert.id}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Despachar"
                            >
                              <Navigation className="size-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleResolve(alert.id!); }}
                            disabled={resolving === alert.id}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Resolver"
                          >
                            {resolving === alert.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Mini Map + Detail */}
        <div className="w-[400px] flex flex-col gap-4 shrink-0">
          {/* Map */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-full">
              <LiveMap
                events={[]}
                guards={[]}
                alerts={filteredAlerts.filter(a => a.lat && a.lng)}
                sites={[]}
                sosActive={sosCount > 0}
              />
            </div>
          </div>

          {/* Selected Alert Detail */}
          {selectedAlert && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black px-2 py-1 rounded-lg ${getTypeConfig(selectedAlert.type).bg} ${getTypeConfig(selectedAlert.type).color}`}>
                  {getTypeConfig(selectedAlert.type).emoji} {getTypeConfig(selectedAlert.type).label}
                </span>
                <button onClick={() => setSelectedAlert(null)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
              </div>
              <p className="text-sm text-slate-700">{selectedAlert.message}</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                {selectedAlert.guardName && (
                  <span className="flex items-center gap-1"><User className="size-3" /> {selectedAlert.guardName}</span>
                )}
                <span className="flex items-center gap-1"><Clock className="size-3" /> {formatTime(selectedAlert.createdAt)}</span>
                {selectedAlert.lat && selectedAlert.lng && (
                  <span className="flex items-center gap-1"><MapPin className="size-3" /> {selectedAlert.lat.toFixed(4)}, {selectedAlert.lng.toFixed(4)}</span>
                )}
              </div>
              <div className="flex gap-2">
                {selectedAlert.guardId && guardPhones[selectedAlert.guardId] && (
                  <a href={`tel:${guardPhones[selectedAlert.guardId]}`} className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors">
                    <Phone className="size-3" /> Ligar
                  </a>
                )}
                {selectedAlert.status === 'active' && (
                  <button onClick={() => handleDispatch(selectedAlert.id!)} className="flex-1 flex items-center justify-center gap-1 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors">
                    <Navigation className="size-3" /> Despachar
                  </button>
                )}
                <button onClick={() => handleResolve(selectedAlert.id!)} disabled={resolving === selectedAlert.id} className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#192c4d] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-colors">
                  {resolving === selectedAlert.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />} Resolver
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Recent Resolved */}
      {resolvedAlerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Últimos Resolvidos</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
            {resolvedAlerts.map((alert) => {
              const config = getTypeConfig(alert.type);
              return (
                <div key={alert.id} className="px-5 py-2.5 flex items-center gap-3 text-sm">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>{config.emoji}</span>
                  <span className="text-slate-600 flex-1 truncate">{alert.message}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">{formatTime(alert.createdAt)}</span>
                  <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
