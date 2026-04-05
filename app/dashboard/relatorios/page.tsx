'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  Clock,
  Download,
  Filter,
  Search,
  Loader2,
  Calendar,
  Users,
  DollarSign,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  MapPin,
  BarChart3,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '@/components/language-provider';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase';
import type { Job, JobAssignment, Alert, UserData } from '@/lib/types';

export default function ReportsPage() {
  const { t } = useLanguage();
  const { user, userData, companyId } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [guards, setGuards] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    if (!user) return;
    const unsubs: (() => void)[] = [];

    // Jobs
    const jq = query(collection(db, 'jobs'), where('companyId', '==', companyId || ''), orderBy('createdAt', 'desc'), limit(200));
    unsubs.push(onSnapshot(jq, (snap) => {
      setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Job)));
    }));

    // Assignments
    const aq = query(collection(db, 'job_assignments'), where('companyId', '==', companyId || ''));
    unsubs.push(onSnapshot(aq, (snap) => {
      setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() } as JobAssignment)));
      setLoading(false);
    }));

    // Alerts
    const alq = query(collection(db, 'alerts'), where('companyId', '==', companyId || ''), orderBy('createdAt', 'desc'), limit(100));
    unsubs.push(onSnapshot(alq, (snap) => {
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Alert)));
    }));

    // Guards
    const gq = query(collection(db, 'users'), where('companyId', '==', companyId || ''), where('role', '==', 'guard'));
    unsubs.push(onSnapshot(gq, (snap) => {
      setGuards(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserData)));
    }));

    return () => unsubs.forEach(u => u());
  }, [user, companyId]);

  // Filter by period
  const filterByPeriod = (dateStr: string | { toDate?: () => Date } | undefined) => {
    if (!dateStr) return false;
    const date = typeof dateStr === 'string' ? new Date(dateStr) :
                 dateStr && typeof dateStr === 'object' && 'toDate' in dateStr ? dateStr.toDate!() : new Date();
    if (!date || isNaN(date.getTime())) return false;
    const now = new Date();
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    }
    if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return date >= monthAgo;
    }
    return true;
  };

  const filteredJobs = jobs.filter(j => filterByPeriod(j.date || j.createdAt as any));
  const filteredAssignments = assignments.filter(a => filterByPeriod(a.createdAt as any));
  const filteredAlerts = alerts.filter(a => filterByPeriod(a.createdAt as any));

  // Stats
  const completedJobs = filteredJobs.filter(j => j.status === 'completed').length;
  const inProgressJobs = filteredJobs.filter(j => j.status === 'in_progress').length;
  const openJobs = filteredJobs.filter(j => j.status === 'open').length;
  const totalRevenue = filteredAssignments
    .filter(a => a.status === 'checked_out')
    .reduce((s, a) => s + (a.dailyRate || 0), 0);
  const totalHoursWorked = filteredAssignments
    .filter(a => a.totalHours)
    .reduce((s, a) => s + (a.totalHours || 0), 0);
  const activeAlerts = filteredAlerts.filter(a => a.status === 'active' || a.status === 'dispatching').length;
  const sosAlerts = filteredAlerts.filter(a => a.type === 'sos').length;
  const checkinCount = filteredAlerts.filter(a => a.type === 'checkin').length;
  const checkoutCount = filteredAlerts.filter(a => a.type === 'checkout').length;
  const activeGuards = guards.filter(g => g.status === 'Ativo' || g.status === 'On Duty').length;

  // Top guards by completed assignments
  const guardStats = guards.map(g => {
    const guardAssignments = filteredAssignments.filter(a => a.guardId === g.id);
    const completed = guardAssignments.filter(a => a.status === 'checked_out').length;
    const hours = guardAssignments.reduce((s, a) => s + (a.totalHours || 0), 0);
    const earnings = guardAssignments.filter(a => a.status === 'checked_out').reduce((s, a) => s + (a.dailyRate || 0), 0);
    return { ...g, completed, hours, earnings };
  }).filter(g => g.completed > 0).sort((a, b) => b.completed - a.completed).slice(0, 10);

  // Recent completed jobs
  const recentCompleted = filteredJobs
    .filter(j => j.status === 'completed')
    .slice(0, 8);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#192c4d]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('reports.title') || 'Relatórios de Atividade'}</h2>
          <p className="text-slate-500 text-sm">Dados em tempo real do Firestore.</p>
        </div>
        <div className="flex items-center gap-2">
          {(['week', 'month', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === p
                  ? 'bg-[#192c4d] text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p === 'week' ? '7 dias' : p === 'month' ? '30 dias' : 'Tudo'}
            </button>
          ))}
          <button
            onClick={() => {
              const headers = ['Métrica','Valor'];
              const rows = [
                ['Escalas Concluídas', String(completedJobs)],
                ['Escalas em Progresso', String(inProgressJobs)],
                ['Escalas Abertas', String(openJobs)],
                ['Faturamento Total', `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
                ['Horas Trabalhadas', `${totalHoursWorked.toFixed(1)}h`],
                ['Alertas Totais', String(filteredAlerts.length)],
                ['Alertas SOS', String(sosAlerts)],
                ['Check-ins', String(checkinCount)],
                ['Check-outs', String(checkoutCount)],
                ['Guardas Ativos', String(activeGuards)],
                ['Total Guardas', String(guards.length)],
              ];
              if (guardStats.length > 0) {
                rows.push(['', '']);
                rows.push(['--- Ranking de Vigilantes ---', '']);
                rows.push(['Nome', 'Escalas / Horas / Ganhos']);
                guardStats.forEach((g, i) => {
                  rows.push([`${i+1}. ${g.name}`, `${g.completed} escalas / ${g.hours.toFixed(1)}h / R$ ${g.earnings.toLocaleString('pt-BR', {minimumFractionDigits:2})}`]);
                });
              }
              const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
              const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `relatorio_${period}_${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition-all flex items-center gap-1 shadow-sm"
          >
            <Download className="size-3" /> Exportar
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Escalas Concluídas</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900">{completedJobs}</h3>
              <p className="text-[10px] text-green-600 font-bold mt-1">+{inProgressJobs} em andamento</p>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 className="size-5" /></div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Faturamento</p>
              <h3 className="text-2xl font-bold mt-1 text-green-600">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">{totalHoursWorked.toFixed(1)}h trabalhadas</p>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign className="size-5" /></div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Guardas Ativos</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900">{activeGuards}</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">{guards.length} total cadastrados</p>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users className="size-5" /></div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Alertas</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900">{filteredAlerts.length}</h3>
              <p className="text-[10px] text-red-500 font-bold mt-1">{sosAlerts > 0 ? `${sosAlerts} SOS` : 'Sem SOS'} • {activeAlerts} ativos</p>
            </div>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle className="size-5" /></div>
          </div>
        </motion.div>
      </div>

      {/* Operations Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <BarChart3 className="size-4 text-[#192c4d]" /> Resumo de Operações
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 flex items-center gap-2">
                <span className="size-2 bg-green-500 rounded-full" /> Vagas Abertas
              </span>
              <span className="font-bold text-sm">{openJobs}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 flex items-center gap-2">
                <span className="size-2 bg-blue-500 rounded-full" /> Em Progresso
              </span>
              <span className="font-bold text-sm">{inProgressJobs}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 flex items-center gap-2">
                <span className="size-2 bg-slate-400 rounded-full" /> Concluídas
              </span>
              <span className="font-bold text-sm">{completedJobs}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
              <span className="text-sm text-slate-500 flex items-center gap-2">
                <span className="size-2 bg-green-400 rounded-full" /> Check-ins
              </span>
              <span className="font-bold text-sm">{checkinCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 flex items-center gap-2">
                <span className="size-2 bg-indigo-400 rounded-full" /> Check-outs
              </span>
              <span className="font-bold text-sm">{checkoutCount}</span>
            </div>
          </div>
        </div>

        {/* Alert Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <AlertTriangle className="size-4 text-red-500" /> Alertas por Tipo
          </h3>
          <div className="space-y-3">
            {[
              { type: 'sos', label: '🆘 SOS', color: 'bg-red-500' },
              { type: 'relief', label: '🚻 Rendição', color: 'bg-amber-500' },
              { type: 'hydration', label: '💧 Hidratação', color: 'bg-blue-500' },
              { type: 'checkin', label: '🔐 Check-in', color: 'bg-green-500' },
              { type: 'checkout', label: '🔓 Check-out', color: 'bg-indigo-500' },
              { type: 'job_accepted', label: '✅ Vaga Aceita', color: 'bg-purple-500' },
            ].map(item => {
              const count = filteredAlerts.filter(a => a.type === item.type).length;
              const pct = filteredAlerts.length > 0 ? (count / filteredAlerts.length * 100) : 0;
              return (
                <div key={item.type}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-bold text-slate-900">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <TrendingUp className="size-4 text-green-500" /> Indicadores
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Taxa de conclusão</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${filteredJobs.length > 0 ? (completedJobs / filteredJobs.length * 100) : 0}%` }} />
                </div>
                <span className="text-sm font-bold text-slate-900">{filteredJobs.length > 0 ? Math.round(completedJobs / filteredJobs.length * 100) : 0}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500">Média de horas por escala</p>
              <h4 className="text-xl font-bold text-slate-900 mt-1">
                {filteredAssignments.filter(a => a.totalHours).length > 0
                  ? (totalHoursWorked / filteredAssignments.filter(a => a.totalHours).length).toFixed(1)
                  : '0'}h
              </h4>
            </div>
            <div>
              <p className="text-xs text-slate-500">Valor médio da diária</p>
              <h4 className="text-xl font-bold text-green-600 mt-1">
                R$ {filteredAssignments.filter(a => a.status === 'checked_out').length > 0
                  ? (totalRevenue / filteredAssignments.filter(a => a.status === 'checked_out').length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                  : '0,00'}
              </h4>
            </div>
            <div>
              <p className="text-xs text-slate-500">Escalas por guarda (média)</p>
              <h4 className="text-xl font-bold text-slate-900 mt-1">
                {guards.length > 0 ? (filteredAssignments.length / guards.length).toFixed(1) : '0'}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Top Guards Table */}
      {guardStats.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="size-4" /> Ranking de Vigilantes
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">#</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Vigilante</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Escalas</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Horas</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Ganhos</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guardStats.map((g, i) => (
                  <tr key={g.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 text-sm font-bold text-slate-400">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-[#192c4d] flex items-center justify-center text-white text-[10px] font-bold">
                          {(g.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{g.name}</p>
                          <p className="text-[10px] text-slate-400">{g.rank || 'Sem rank'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-slate-700">{g.completed}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{g.hours.toFixed(1)}h</td>
                    <td className="px-6 py-3 text-sm font-bold text-green-600">
                      R$ {g.earnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3">
                      {g.averageRating ? (
                        <span className="text-sm font-bold">⭐ {g.averageRating}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Completed */}
      {recentCompleted.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="size-4" /> Escalas Recentes Concluídas
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {recentCompleted.map((job) => {
              const jobAssignments = assignments.filter(a => a.jobId === job.id && a.status === 'checked_out');
              const jobHours = jobAssignments.reduce((s, a) => s + (a.totalHours || 0), 0);
              return (
                <div key={job.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <CheckCircle2 className="size-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{job.clientName}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><Calendar className="size-3" />{job.date ? new Date(job.date).toLocaleDateString('pt-BR') : '-'}</span>
                        <span className="flex items-center gap-1"><MapPin className="size-3" />{job.location || '-'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      R$ {(job.dailyRate * (job.guardsConfirmed || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {jobAssignments.length} guarda(s) • {jobHours.toFixed(1)}h
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between text-[11px] text-slate-500 shadow-sm">
        <div className="flex items-center gap-6">
          <span><strong className="text-slate-700">{filteredJobs.length}</strong> Escalas no período</span>
          <span><strong className="text-slate-700">{filteredAssignments.length}</strong> Atribuições</span>
          <span><strong className="text-slate-700">{filteredAlerts.length}</strong> Alertas</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-3" />
          Dados em tempo real via Firestore
        </div>
      </footer>
    </div>
  );
}
