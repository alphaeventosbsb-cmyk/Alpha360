'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  Users, MapPin, AlertTriangle, Activity, TrendingUp, Loader2,
  Briefcase, DollarSign, Calendar, Plus, CheckCircle2, Clock,
  Volume2, VolumeX
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useLanguage } from '@/components/language-provider';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';
import { JobModal } from '@/components/JobModal';
import { requestNotificationPermission, sendLocalNotification } from '@/components/sw-register';
import type { Job, Alert as AlertType } from '@/lib/types';

const LiveMap = dynamic(() => import('@/components/LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-lg">
      <Loader2 className="size-8 text-[#192c4d] animate-spin" />
    </div>
  )
});

// SOS Alarm Hook
function useSOSAlarm() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const startAlarm = useCallback(() => {
    if (isPlaying) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
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
    } catch {}
  }, [isPlaying]);

  const stopAlarm = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close().catch(() => {}); audioContextRef.current = null; }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, []);

  return { startAlarm, stopAlarm, isPlaying };
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user, userData, companyId } = useAuth();
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);

  // SOS alarm
  const { startAlarm, stopAlarm, isPlaying } = useSOSAlarm();
  const [sosAlerts, setSOSAlerts] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevSOSCountRef = useRef(0);

  // Real-time data (via API polling)
  const [guardsOnDuty, setGuardsOnDuty] = useState(0);
  const [totalGuards, setTotalGuards] = useState(0);
  const [openJobs, setOpenJobs] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [completedJobs, setCompletedJobs] = useState(0);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [mapGuards, setMapGuards] = useState<any[]>([]);
  const [mapEvents, setMapEvents] = useState<any[]>([]);
  const [mapAlerts, setMapAlerts] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  // Guard-specific
  const [guardStats, setGuardStats] = useState({ available: 0, nextShift: 'Nenhum', earnings: 0, myAlerts: 0 });

  // Client-specific
  const [clientStats, setClientStats] = useState({ openJobs: 0, filled: 0, spent: 0, alerts: 0 });

  // Carregar dados via API
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [jobs, guards, alerts, assignments] = await Promise.all([
        api.listJobs(),
        api.listGuards(),
        api.listAlerts({ limit: 20 }),
        api.listAssignments({ status: ['pending'] }),
      ]);

      // Guards
      setTotalGuards(guards.length);
      setGuardsOnDuty(guards.filter((g: any) => g.status === 'Ativo' || g.status === 'On Duty').length);
      setMapGuards(guards.filter((g: any) => g.lat && g.lng && g.status === 'Ativo'));

      // Jobs
      setOpenJobs(jobs.filter(j => j.status === 'open').length);
      setCompletedJobs(jobs.filter(j => j.status === 'completed').length);
      setTotalRevenue(jobs.filter(j => j.status === 'completed').reduce((s, j) => s + (j.dailyRate * (j.guardsConfirmed || 1)), 0));
      setRecentJobs(jobs.slice(0, 5));
      setMapEvents(jobs.filter(j => ['open', 'filled', 'in_progress'].includes(j.status)));

      // Alerts
      let filteredAlerts = alerts;
      if (userData?.role === 'client') {
        filteredAlerts = alerts.filter((a: any) => a.contractorId === user.uid);
      } else if (userData?.role === 'guard') {
        filteredAlerts = alerts.filter((a: any) => a.guardId === user.uid);
      }
      setActiveAlerts(filteredAlerts.filter((a: any) => a.status === 'active' || a.status === 'dispatching').length);
      setRecentAlerts(filteredAlerts.slice(0, 6));
      setMapAlerts(filteredAlerts.filter((a: any) => a.lat && a.lng && a.status !== 'resolved'));

      // SOS
      const activeSOS = filteredAlerts.filter((a: any) => a.type === 'sos' && a.status === 'active');
      setSOSAlerts(activeSOS);

      // Assignments
      setPendingApprovals(assignments.length);

      // Client stats
      if (userData?.role === 'client') {
        const myJobs = jobs.filter(j => j.contractorId === user.uid);
        setClientStats({
          openJobs: myJobs.filter(j => j.status === 'open').length,
          filled: myJobs.filter(j => j.status === 'filled' || j.status === 'in_progress').length,
          spent: myJobs.filter(j => j.status === 'completed').reduce((s, j) => s + j.dailyRate, 0),
          alerts: filteredAlerts.length,
        });
      }

      // Guard stats
      if (userData?.role === 'guard') {
        setGuardStats(prev => ({
          ...prev,
          available: jobs.filter(j => j.status === 'open').length,
          myAlerts: filteredAlerts.length,
        }));

        // Guard earnings
        const myAssignments = await api.listAssignments({ guardId: user.uid, status: ['checked_out'] });
        const totalEarnings = myAssignments.reduce((s: number, a: any) => s + (a.dailyRate || 0), 0);
        setGuardStats(prev => ({ ...prev, earnings: totalEarnings }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  }, [user, userData, companyId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // SOS alarm trigger + push notification
  useEffect(() => {
    if (userData?.role === 'guard') return;
    if (sosAlerts.length > 0 && soundEnabled) {
      if (sosAlerts.length > prevSOSCountRef.current) {
        startAlarm();
        if (navigator.vibrate) navigator.vibrate([1000, 500, 1000]);
        const newSOS = sosAlerts[0];
        sendLocalNotification('🆘 SOS ATIVO — Alpha360', {
          body: `${newSOS.guardName || 'Vigilante'}: ${newSOS.message || 'Alerta de emergência!'}`,
          tag: `sos-${newSOS.id}`,
          data: { url: '/dashboard/despacho' },
        });
      }
    } else {
      stopAlarm();
    }
    prevSOSCountRef.current = sosAlerts.length;
  }, [sosAlerts, soundEnabled, startAlarm, stopAlarm, userData]);

  // Request notification permission on mount (admin/client only)
  useEffect(() => {
    if (userData?.role === 'guard') return;
    if (userData?.role === 'admin' || userData?.role === 'client') {
      requestNotificationPermission();
    }
  }, [userData]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getAlertTypeStyle = (type: string) => {
    switch (type) {
      case 'sos': return 'bg-red-100 text-red-800';
      case 'relief': return 'bg-amber-100 text-amber-800';
      case 'hydration': return 'bg-blue-100 text-blue-800';
      case 'checkin': return 'bg-green-100 text-green-800';
      case 'checkout': return 'bg-indigo-100 text-indigo-800';
      case 'job_accepted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'sos': return '🆘 SOS';
      case 'relief': return '🚻 Rendição';
      case 'hydration': return '💧 Hidratação';
      case 'checkin': return '🔐 Check-in';
      case 'checkout': return '🔓 Check-out';
      case 'job_accepted': return '✅ Aceito';
      case 'arrival': return '📍 Chegada';
      default: return type;
    }
  };

  const handleResolveSOSFromBanner = async (alertId: string) => {
    try {
      await api.updateAlert(alertId, { status: 'resolved' } as any);
      stopAlarm();
      loadData(); // Recarregar dados
    } catch (error) {
      console.error('Error resolving SOS:', error);
    }
  };

  // ====== GUARD VIEW ======
  if (userData?.role === 'guard') {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Painel do Vigilante</h2>
          <p className="text-slate-500 text-sm">Bem-vindo(a), {userData.name}. Acompanhe suas escalas e ganhos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Vagas Disponíveis</p>
                <h3 className="text-3xl font-bold mt-1 text-slate-900">{guardStats.available}</h3>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Briefcase className="size-5" /></div>
            </div>
            <Link href="/dashboard/vagas" className="text-xs text-[#192c4d] font-bold mt-3 inline-block hover:underline">Ver vagas →</Link>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Status</p>
                <h3 className={`text-lg font-bold mt-2 ${userData.status === 'Ativo' ? 'text-green-600' : 'text-slate-600'}`}>
                  {userData.status || 'Inativo'}
                </h3>
              </div>
              <div className={`p-2 rounded-lg ${userData.status === 'Ativo' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                <Activity className="size-5" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Ganhos Totais</p>
                <h3 className="text-3xl font-bold mt-1 text-slate-900">R$ {guardStats.earnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign className="size-5" /></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Meus Alertas</p>
                <h3 className="text-3xl font-bold mt-1 text-slate-900">{guardStats.myAlerts}</h3>
              </div>
              <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle className="size-5" /></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/vagas" className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><Briefcase className="size-5 text-blue-600" /></div>
            <span className="text-sm font-bold text-slate-700">Ver Vagas</span>
          </Link>
          <Link href="/dashboard/checkin" className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><CheckCircle2 className="size-5 text-green-600" /></div>
            <span className="text-sm font-bold text-slate-700">Check-in</span>
          </Link>
          <Link href="/dashboard/acoes" className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle className="size-5 text-red-600" /></div>
            <span className="text-sm font-bold text-slate-700">SOS / Ações</span>
          </Link>
          <Link href="/dashboard/chat" className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg"><Activity className="size-5 text-purple-600" /></div>
            <span className="text-sm font-bold text-slate-700">Chat</span>
          </Link>
        </div>
      </div>
    );
  }

  // ====== CLIENT VIEW ======
  if (userData?.role === 'client') {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Painel do Contratante</h2>
            <p className="text-slate-500 text-sm">Bem-vindo(a), {userData.name}.</p>
          </div>
          <button
            onClick={() => setIsJobModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#192c4d] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#192c4d]/20 hover:bg-[#192c4d]/90 transition-all"
          >
            <Plus className="size-4" />
            Nova Escala
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/dashboard/minhas-escalas" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-[#192c4d] transition-colors cursor-pointer block">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Escalas Abertas</p>
                <h3 className="text-3xl font-bold mt-1 text-slate-900">{clientStats.openJobs}</h3>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Briefcase className="size-5" /></div>
            </div>
          </Link>
          <Link href="/dashboard/minhas-escalas" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-[#192c4d] transition-colors cursor-pointer block">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Escalas Preenchidas</p>
                <h3 className="text-3xl font-bold mt-1 text-slate-900">{clientStats.filled}</h3>
              </div>
              <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Users className="size-5" /></div>
            </div>
          </Link>
          <Link href="/dashboard/faturamento" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-[#192c4d] transition-colors cursor-pointer block">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Gasto</p>
                <h3 className="text-3xl font-bold mt-1 text-slate-900">R$ {clientStats.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><DollarSign className="size-5" /></div>
            </div>
          </Link>
          <Link href="/dashboard/aprovacoes" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-amber-300 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Aprovações Pendentes</p>
                <h3 className="text-3xl font-bold mt-1 text-amber-600">{pendingApprovals}</h3>
              </div>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg animate-pulse"><Clock className="size-5" /></div>
            </div>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/qrcodes" className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg"><Activity className="size-5 text-indigo-600" /></div>
            <span className="text-sm font-bold text-slate-700">QR Codes</span>
          </Link>
          <Link href="/dashboard/mapa" className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><MapPin className="size-5 text-green-600" /></div>
            <span className="text-sm font-bold text-slate-700">Mapa ao Vivo</span>
          </Link>
          <Link href="/dashboard/chat" className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg"><Activity className="size-5 text-purple-600" /></div>
            <span className="text-sm font-bold text-slate-700">Chat</span>
          </Link>
          <Link href="/dashboard/alertas" className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle className="size-5 text-red-600" /></div>
            <span className="text-sm font-bold text-slate-700">Alertas</span>
          </Link>
        </div>

        <JobModal
          isOpen={isJobModalOpen}
          onClose={() => setIsJobModalOpen(false)}
          title="Criar Nova Escala"
        />
      </div>
    );
  }

  // ====== ADMIN VIEW ======
  const chartData = [
    { name: 'Seg', value: completedJobs > 0 ? Math.round(completedJobs * 0.15) : 3 },
    { name: 'Ter', value: completedJobs > 0 ? Math.round(completedJobs * 0.2) : 5 },
    { name: 'Qua', value: completedJobs > 0 ? Math.round(completedJobs * 0.18) : 4 },
    { name: 'Qui', value: completedJobs > 0 ? Math.round(completedJobs * 0.25) : 6 },
    { name: 'Sex', value: completedJobs > 0 ? Math.round(completedJobs * 0.15) : 4 },
    { name: 'Sáb', value: completedJobs > 0 ? Math.round(completedJobs * 0.07) : 2 },
  ];

  return (
    <div className="space-y-8">
      {/* SOS Alert Banner */}
      {sosAlerts.length > 0 && (
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
              <h3 className="text-lg font-black">🆘 {sosAlerts.length} SOS ATIVO{sosAlerts.length > 1 ? 'S' : ''}!</h3>
              <p className="text-red-100 text-sm">
                {sosAlerts.map((a: any) => a.guardName || 'Vigilante').join(', ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { if (isPlaying) { stopAlarm(); setSoundEnabled(false); } else { setSoundEnabled(true); startAlarm(); } }}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              {isPlaying ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
            </button>
            <Link href="/dashboard/despacho" className="px-4 py-2 bg-white text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors text-sm">
              Abrir Despacho
            </Link>
            {sosAlerts.length === 1 && (
              <button
                onClick={() => handleResolveSOSFromBanner(sosAlerts[0].id)}
                className="px-4 py-2 bg-white/20 text-white rounded-lg font-bold hover:bg-white/30 transition-colors text-sm"
              >
                ✅ Resolver
              </button>
            )}
          </div>
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Painel Administrativo</h2>
          <p className="text-slate-500 text-sm">Visão geral completa do sistema Alpha360.</p>
        </div>
        <button
          onClick={() => setIsJobModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#192c4d] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#192c4d]/20 hover:bg-[#192c4d]/90 transition-all"
        >
          <Plus className="size-4" />
          Nova Escala
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Guardas em Serviço', value: `${guardsOnDuty}/${totalGuards}`, icon: Users, color: 'text-green-600', bg: 'bg-green-50', trend: guardsOnDuty > 0 ? `${guardsOnDuty} ativos agora` : 'Nenhum ativo', href: '/dashboard/guardas' },
          { label: 'Escalas Abertas', value: openJobs, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', trend: `${openJobs} aguardando`, href: '/dashboard/escala' },
          { label: 'Aprovações', value: pendingApprovals, icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50', trend: `${pendingApprovals} pendentes`, pulse: pendingApprovals > 0, href: '/dashboard/aprovacoes' },
          { label: 'Alertas Ativos', value: activeAlerts, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', trend: activeAlerts > 0 ? `${activeAlerts} requerem ação` : 'Tudo limpo', pulse: activeAlerts > 0, href: '/dashboard/alertas' },
          { label: 'Receita Total', value: `R$ ${totalRevenue.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50', trend: `${completedJobs} escalas concluídas`, href: '/dashboard/faturamento' },
        ].map((stat, i) => (
          <Link href={stat.href} key={i}>
            <motion.div whileHover={{ y: -4 }} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer h-full hover:border-[#192c4d] transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                  <h3 className="text-2xl font-bold mt-1 text-slate-900">{stat.value}</h3>
                </div>
                <div className={`p-2 ${stat.bg} ${stat.color} rounded-lg ${stat.pulse ? 'animate-pulse' : ''}`}>
                  <stat.icon className="size-5" />
                </div>
              </div>
              <p className={`mt-2 text-[10px] font-medium ${stat.color}`}>{stat.trend}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Map + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Monitoramento Global</h3>
            <Link href="/dashboard/mapa" className="text-xs font-bold text-[#192c4d] hover:underline">Tela cheia →</Link>
          </div>
          <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm min-h-[400px] overflow-hidden">
            <div className="w-full h-[384px] rounded-lg overflow-hidden relative">
              <LiveMap events={mapEvents} guards={mapGuards} alerts={mapAlerts} />
              <div className="absolute bottom-3 left-3 bg-white/90 p-2.5 rounded-lg border text-[10px] z-[1000] shadow-md">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2"><span className="size-2 bg-green-500 rounded-full" /> Guardas ({mapGuards.length})</div>
                  <div className="flex items-center gap-2"><span className="size-2 bg-blue-500 rounded-full" /> Escalas ({mapEvents.length})</div>
                  <div className="flex items-center gap-2"><span className="size-2 bg-red-500 rounded-full animate-pulse" /> Alertas ({mapAlerts.length})</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold">Escalas por Dia</h3>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={index === 3 ? '#192c4d' : '#192c4d20'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total concluídas</span>
                <span className="font-bold">{completedJobs}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Receita total</span>
                <span className="font-bold text-green-600">R$ {totalRevenue.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Alertas Recentes</h3>
          <Link href="/dashboard/alertas" className="text-sm font-medium text-[#192c4d] hover:underline">Ver todos →</Link>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Hora</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Vigilante</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Mensagem</th>
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentAlerts.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhum alerta recente.</td></tr>
              ) : (
                recentAlerts.map((alert: any) => (
                  <tr key={alert.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 text-sm">{formatTime(alert.createdAt)}</td>
                    <td className="px-6 py-3 text-sm">{alert.guardName || 'Sistema'}</td>
                    <td className="px-6 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getAlertTypeStyle(alert.type)}`}>
                        {getAlertTypeLabel(alert.type)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 max-w-[200px] truncate">{alert.message}</td>
                    <td className="px-6 py-3">
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${
                        alert.status === 'active' ? 'text-red-600' : alert.status === 'dispatching' ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        <span className={`size-1.5 rounded-full ${
                          alert.status === 'active' ? 'bg-red-600 animate-pulse' : alert.status === 'dispatching' ? 'bg-amber-500' : 'bg-green-500'
                        }`} />
                        {alert.status === 'active' ? 'Ativo' : alert.status === 'dispatching' ? 'Despachando' : 'Resolvido'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <JobModal isOpen={isJobModalOpen} onClose={() => setIsJobModalOpen(false)} title="Criar Nova Escala" />
    </div>
  );
}
