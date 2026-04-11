'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { GuardActions } from '@/components/GuardActions';
import { useGeolocation } from '@/hooks/useGeolocation';
import { api } from '@/services/api';
import type { JobAssignment, Job } from '@/lib/types';
import { Loader2, Shield, MapPin, Navigation, Signal, Wifi, WifiOff, Target } from 'lucide-react';

export default function AcoesPage() {
  const { user, userData } = useAuth();
  const [activeAssignment, setActiveAssignment] = useState<JobAssignment | null>(null);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const loadActiveAssignment = async () => {
    if (!user) return;
    try {
      const myAssignments = await api.getGuardAssignments(user.uid);
      const checkedIn = myAssignments.find((a: any) => a.status === 'checked_in');
      
      if (checkedIn) {
        setActiveAssignment(checkedIn);
        const allJobs = await api.listJobs();
        const job = allJobs.find(j => j.id === checkedIn.jobId);
        setActiveJob(job || null);
      } else {
        setActiveAssignment(null);
        setActiveJob(null);
      }
    } catch (error) {
      console.error('Error loading assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveAssignment();
    const interval = setInterval(loadActiveAssignment, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const isOnDuty = userData?.status === 'Ativo' || userData?.status === 'On Duty';

  // GPS tracking — enabled only when guard is on duty
  const geo = useGeolocation({
    guardId: user?.uid || '',
    guardName: userData?.name || user?.displayName || 'Vigilante',
    jobId: activeAssignment?.jobId,
    companyId: activeAssignment?.companyId,
    siteLat: activeJob?.lat,
    siteLng: activeJob?.lng,
    geofenceRadius: 200, // Default, will be overridden by site config
    enabled: isOnDuty && !!user,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#192c4d]" />
      </div>
    );
  }

  const getAccuracyColor = (accuracy: number | null) => {
    if (!accuracy) return 'text-slate-400';
    if (accuracy <= 10) return 'text-green-500';
    if (accuracy <= 30) return 'text-yellow-500';
    if (accuracy <= 100) return 'text-orange-500';
    return 'text-red-500';
  };

  const getAccuracyLabel = (accuracy: number | null) => {
    if (!accuracy) return 'Sem sinal';
    if (accuracy <= 10) return 'Excelente';
    if (accuracy <= 30) return 'Boa';
    if (accuracy <= 100) return 'Moderada';
    return 'Baixa';
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Ações Operacionais</h2>
        <p className="text-slate-500 text-sm mt-1">
          Envie alertas e solicitações durante sua escala.
        </p>
      </div>

      {/* Status Card */}
      <div className={`p-4 rounded-2xl border-2 flex items-center gap-4 ${
        isOnDuty ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'
      }`}>
        <div className={`size-12 rounded-full flex items-center justify-center ${
          isOnDuty ? 'bg-green-500' : 'bg-slate-400'
        } text-white`}>
          <Shield className="size-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">
            {isOnDuty ? 'Você está em serviço' : 'Você não está em serviço'}
          </p>
          <p className="text-xs text-slate-500">
            {isOnDuty
              ? 'GPS ativo • Localização sendo compartilhada'
              : 'Faça check-in para ativar as ações operacionais'
            }
          </p>
          {activeAssignment && (
            <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1">
              <MapPin className="size-3" />
              Escala ativa
            </p>
          )}
        </div>
      </div>

      {/* GPS Tracking Panel — only when on duty */}
      {isOnDuty && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Navigation className="size-4 text-green-500" />
              Rastreamento GPS
            </h3>
            <div className="flex items-center gap-1.5">
              {geo.isTracking ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <span className="size-1.5 bg-green-500 rounded-full animate-pulse" />
                  ATIVO
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  <WifiOff className="size-3" />
                  INATIVO
                </span>
              )}
            </div>
          </div>

          {geo.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              ⚠️ {geo.error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {/* Accuracy */}
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <Signal className={`size-5 mx-auto mb-1 ${getAccuracyColor(geo.accuracy)}`} />
              <p className="text-lg font-black text-slate-900">
                {geo.accuracy ? `${geo.accuracy}m` : '—'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Precisão: {getAccuracyLabel(geo.accuracy)}
              </p>
            </div>

            {/* Distance to site */}
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <Target className={`size-5 mx-auto mb-1 ${geo.isInsideGeofence ? 'text-green-500' : 'text-blue-500'}`} />
              <p className="text-lg font-black text-slate-900">
                {geo.distanceToSite !== null
                  ? geo.distanceToSite > 1000
                    ? `${(geo.distanceToSite / 1000).toFixed(1)}km`
                    : `${geo.distanceToSite}m`
                  : '—'
                }
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {geo.isInsideGeofence ? '✅ No local' : 'Dist. posto'}
              </p>
            </div>

            {/* Connection */}
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              {geo.isTracking ? (
                <Wifi className="size-5 mx-auto mb-1 text-green-500" />
              ) : (
                <WifiOff className="size-5 mx-auto mb-1 text-slate-400" />
              )}
              <p className="text-lg font-black text-slate-900">
                {geo.isTracking ? '30s' : '—'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Intervalo sync
              </p>
            </div>
          </div>

          {/* Coordinates */}
          {geo.lat && geo.lng && (
            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 font-mono">
              <span>{geo.lat.toFixed(6)}, {geo.lng.toFixed(6)}</span>
              {geo.timestamp && (
                <span>
                  Atualizado: {new Date(geo.timestamp).toLocaleTimeString('pt-BR')}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {isOnDuty ? (
        <GuardActions
          currentJobId={activeAssignment?.jobId}
          companyId={activeAssignment?.companyId}
        />
      ) : (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
          <Shield className="size-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            Realize o check-in em uma escala para ativar as ações operacionais.
          </p>
        </div>
      )}
    </div>
  );
}
