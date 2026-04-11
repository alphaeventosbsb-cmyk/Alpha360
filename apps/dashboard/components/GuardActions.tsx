'use client';

import React, { useState } from 'react';
import { AlertTriangle, Droplets, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/use-auth';
import type { AlertType } from '@/lib/types';

interface GuardActionsProps {
  currentJobId?: string;
  companyId?: string;
  contractorId?: string;
}

export function GuardActions({ currentJobId, companyId, contractorId }: GuardActionsProps) {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<AlertType | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const actions = [
    {
      type: 'sos' as AlertType,
      icon: AlertTriangle,
      label: '🆘 SOS EMERGÊNCIA',
      description: 'Enviar alerta de emergência com localização',
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      shadowColor: 'shadow-red-500/30',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    {
      type: 'relief' as AlertType,
      icon: Users,
      label: '🚻 Solicitar Rendição',
      description: 'Pedir substituição temporária',
      color: 'bg-amber-500',
      hoverColor: 'hover:bg-amber-600',
      shadowColor: 'shadow-amber-500/30',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    {
      type: 'hydration' as AlertType,
      icon: Droplets,
      label: '💧 Solicitar Hidratação',
      description: 'Pedir água ou suprimentos',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      shadowColor: 'shadow-blue-500/30',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
  ];

  const handleAction = async (type: AlertType) => {
    if (!user) return;
    setLoading(type);
    setShowConfirm(null);

    try {
      // Get current location
      let lat: number | undefined;
      let lng: number | undefined;

      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
            });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch {
          // Continue without GPS
        }
      }

      const messageMap: Record<AlertType, string> = {
        sos: `🆘 EMERGÊNCIA! ${userData?.name || 'Vigilante'} acionou SOS!`,
        relief: `🚻 ${userData?.name || 'Vigilante'} solicitou rendição`,
        hydration: `💧 ${userData?.name || 'Vigilante'} solicitou hidratação`,
        geofence: '',
        checkin: '',
        checkout: '',
        job_accepted: '',
        arrival: '',
      };

      await api.createAlert({
        type,
        jobId: currentJobId,
        guardId: user.uid,
        guardName: userData?.name || user.displayName || 'Vigilante',
        companyId: companyId || '',
        contractorId: contractorId,
        lat,
        lng,
        message: messageMap[type],
        status: type === 'sos' ? 'active' : 'dispatching',
      } as any);

      // Vibrate on SOS
      if (type === 'sos' && navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }

      setFeedback(type === 'sos' ? 'SOS enviado! A equipe foi notificada.' : 'Solicitação enviada com sucesso!');
      setTimeout(() => setFeedback(null), 4000);
    } catch (error) {
      console.error('Error sending alert:', error);
      setFeedback('Erro ao enviar solicitação. Tente novamente.');
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* SOS Button - Big and prominent */}
      <button
        onClick={() => setShowConfirm('sos')}
        disabled={loading === 'sos'}
        className="w-full py-6 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-xl shadow-red-500/30 transition-all active:scale-[0.98] disabled:opacity-60"
      >
        {loading === 'sos' ? (
          <Loader2 className="size-7 animate-spin" />
        ) : (
          <>
            <AlertTriangle className="size-7" />
            🆘 SOS EMERGÊNCIA
          </>
        )}
      </button>

      {/* Other Actions */}
      <div className="grid grid-cols-2 gap-3">
        {actions.slice(1).map((action) => (
          <button
            key={action.type}
            onClick={() => setShowConfirm(action.type)}
            disabled={loading === action.type}
            className={`p-4 rounded-xl border-2 ${action.borderColor} ${action.bgColor} hover:shadow-lg transition-all flex flex-col items-center gap-2 disabled:opacity-60`}
          >
            {loading === action.type ? (
              <Loader2 className={`size-8 ${action.textColor} animate-spin`} />
            ) : (
              <action.icon className={`size-8 ${action.textColor}`} />
            )}
            <span className={`text-xs font-bold ${action.textColor} text-center`}>{action.label}</span>
            <span className="text-[10px] text-slate-500 text-center">{action.description}</span>
          </button>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
            >
              <div className={`size-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                showConfirm === 'sos' ? 'bg-red-100' : showConfirm === 'relief' ? 'bg-amber-100' : 'bg-blue-100'
              }`}>
                {showConfirm === 'sos' && <AlertTriangle className="size-8 text-red-600" />}
                {showConfirm === 'relief' && <Users className="size-8 text-amber-600" />}
                {showConfirm === 'hydration' && <Droplets className="size-8 text-blue-600" />}
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {showConfirm === 'sos' ? 'Confirmar SOS?' : showConfirm === 'relief' ? 'Solicitar Rendição?' : 'Solicitar Hidratação?'}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {showConfirm === 'sos'
                  ? 'Isto enviará um alerta de emergência para toda a equipe com sua localização.'
                  : 'O contratante será notificado da sua solicitação.'
                }
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleAction(showConfirm)}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-white shadow-lg ${
                    showConfirm === 'sos' ? 'bg-red-500 shadow-red-500/20' : showConfirm === 'relief' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-blue-500 shadow-blue-500/20'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-slate-900 text-white rounded-xl shadow-2xl text-sm font-bold"
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
