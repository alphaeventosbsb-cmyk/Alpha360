'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  Download,
  UserPlus,
  Clock,
  Loader2,
  Calendar,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/language-provider';
import { useAuth } from '@/hooks/use-auth';
import { subscribeToJobs, subscribeToGuards, subscribeToAssignments } from '@/lib/firestore-service';
import { JobModal } from '@/components/JobModal';
import type { Job, UserData, JobAssignment } from '@/lib/types';

export default function SchedulerPage() {
  const { t } = useLanguage();
  const { user, userData, companyId } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [guards, setGuards] = useState<UserData[]>([]);
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);

  // Week navigation
  const [weekOffset, setWeekOffset] = useState(0);

  const getWeekDays = (offset: number) => {
    const now = new Date();
    const monday = new Date(now);
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(now.getDate() + diff + offset * 7);

    const days = [];
    const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        name: dayNames[i],
        date: d.getDate().toString(),
        fullDate: d.toISOString().split('T')[0],
        isToday: d.toDateString() === now.toDateString(),
        isWeekend: i >= 5,
        dateObj: d,
      });
    }
    return days;
  };

  const days = getWeekDays(weekOffset);
  const weekStart = days[0].dateObj;
  const weekEnd = days[6].dateObj;

  const formatWeekRange = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const s = weekStart;
    const e = weekEnd;
    if (s.getMonth() === e.getMonth()) {
      return `${s.getDate()} - ${e.getDate()} ${months[s.getMonth()]}, ${s.getFullYear()}`;
    }
    return `${s.getDate()} ${months[s.getMonth()]} - ${e.getDate()} ${months[e.getMonth()]}, ${s.getFullYear()}`;
  };

  // Filters
  const [filters, setFilters] = useState({
    open: true,
    filled: true,
    inProgress: true,
    completed: false,
  });

  useEffect(() => {
    if (!user) return;
    const unsubs: (() => void)[] = [];

    // Subscribe to jobs
    unsubs.push(subscribeToJobs(companyId || '', undefined, (data) => {
      setJobs(data);
      setLoading(false);
    }));

    // Subscribe to guards
    unsubs.push(subscribeToGuards(companyId || '', (data) => {
      setGuards(data);
    }));

    // Subscribe to assignments
    unsubs.push(subscribeToAssignments({ companyId: companyId || '' }, (data) => {
      setAssignments(data);
    }));

    return () => unsubs.forEach(u => u());
  }, [user, companyId]);

  // Get jobs for a specific date
  const getJobsForDate = (dateStr: string) => {
    return jobs.filter(job => {
      if (!job.date) return false;
      const jobDate = job.date.split('T')[0]; // handle ISO format
      const matchDate = jobDate === dateStr;
      const matchFilter =
        (job.status === 'open' && filters.open) ||
        (job.status === 'filled' && filters.filled) ||
        (job.status === 'in_progress' && filters.inProgress) ||
        (job.status === 'completed' && filters.completed);
      return matchDate && matchFilter;
    });
  };

  // Get assignments for a guard on a specific date
  const getGuardShiftsForDate = (guardId: string, dateStr: string) => {
    const guardAssignments = assignments.filter(a => 
      a.guardId === guardId && 
      (a.status === 'approved' || a.status === 'checked_in' || a.status === 'checked_out')
    );
    
    return guardAssignments.filter(a => {
      const job = jobs.find(j => j.id === a.jobId);
      if (!job || !job.date) return false;
      return job.date.split('T')[0] === dateStr;
    }).map(a => {
      const job = jobs.find(j => j.id === a.jobId)!;
      return { assignment: a, job };
    });
  };

  // Guards with approved assignments (to show in schedule)
  const guardsWithShifts = guards.filter(g => {
    return assignments.some(a => 
      a.guardId === g.id && 
      (a.status === 'approved' || a.status === 'checked_in' || a.status === 'checked_out')
    );
  });

  // Stats
  const totalShifts = assignments.filter(a => a.status !== 'rejected' && a.status !== 'pending').length;
  const assignedShifts = assignments.filter(a => a.status === 'approved' || a.status === 'checked_in').length;
  const pendingShifts = assignments.filter(a => a.status === 'pending').length;

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
        <h2 className="text-2xl font-bold text-slate-900">{t('schedule.title') || 'Escala de Guardas'}</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsJobModalOpen(true)}
            className="flex items-center gap-2 bg-[#192c4d] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-[#192c4d]/90 transition-all"
          >
            <Plus className="size-4" />
            {t('schedule.addShift') || 'Nova Escala'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setWeekOffset(w => w - 1)}
              className="p-1.5 hover:bg-slate-100 rounded-lg"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-sm font-bold text-slate-900 min-w-[200px] text-center">{formatWeekRange()}</span>
            <button 
              onClick={() => setWeekOffset(w => w + 1)}
              className="p-1.5 hover:bg-slate-100 rounded-lg"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
          {weekOffset !== 0 && (
            <button 
              onClick={() => setWeekOffset(0)}
              className="text-xs font-bold text-[#192c4d] underline hover:no-underline"
            >
              Hoje
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50">
            <Download className="size-4" />
            {t('schedule.exportPdf') || 'Exportar PDF'}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Scheduler Grid */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="w-64 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 border-r border-slate-200">
                    {t('schedule.guards') || 'Guardas'}
                  </th>
                  {days.map((day, i) => (
                    <th key={i} className={cn(
                      "px-2 py-3 text-center border-r border-slate-200 last:border-r-0",
                      day.isWeekend && "bg-slate-100/50"
                    )}>
                      <span className="block text-xs font-bold text-slate-500 uppercase">{day.name}</span>
                      <span className={cn(
                        "text-sm font-black",
                        day.isToday && "text-[#192c4d] underline underline-offset-4 decoration-2",
                      )}>{day.date}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guardsWithShifts.length === 0 && jobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="size-8 text-slate-300" />
                        <p className="font-medium">Nenhuma escala encontrada</p>
                        <p className="text-xs text-slate-400">Crie uma nova escala para começar.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {guardsWithShifts.map((guard) => (
                      <tr key={guard.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-4 border-r border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {guard.photoUrl ? (
                                <Image
                                  className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                                  src={guard.photoUrl}
                                  alt={guard.name}
                                  width={40}
                                  height={40}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-[#192c4d] flex items-center justify-center text-white text-sm font-bold border border-slate-200">
                                  {guard.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                              )}
                              <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${
                                guard.status === 'Ativo' || guard.status === 'On Duty' ? 'bg-green-500' : 'bg-slate-400'
                              }`}></span>
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold truncate">{guard.name}</p>
                              <p className="text-[10px] text-slate-500 uppercase font-semibold truncate">{guard.rank || 'Sem rank'}</p>
                            </div>
                          </div>
                        </td>
                        {days.map((day, dayIndex) => {
                          const shifts = getGuardShiftsForDate(guard.id!, day.fullDate);
                          return (
                            <td key={dayIndex} className={cn(
                              "p-1 border-r border-slate-200 last:border-r-0 align-top",
                              day.isWeekend && "bg-slate-50/30"
                            )}>
                              {shifts.map((shift, si) => (
                                <div key={si} className={cn(
                                  "p-2 rounded-lg shadow-sm border-l-4 mb-1",
                                  shift.assignment.status === 'checked_in'
                                    ? "bg-green-100/60 border-green-500 text-green-800"
                                    : shift.assignment.status === 'checked_out'
                                    ? "bg-slate-100/60 border-slate-400 text-slate-600"
                                    : "bg-[#192c4d]/10 border-[#192c4d] text-[#192c4d]"
                                )}>
                                  <p className="text-[10px] font-bold truncate">{shift.job.clientName}</p>
                                  <p className="text-[9px] opacity-70 font-medium">{shift.job.startTime} - {shift.job.endTime}</p>
                                </div>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Open Jobs Row */}
                    <tr className="bg-slate-50/30">
                      <td className="px-4 py-4 border-r border-slate-200 italic">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                            <UserPlus className="size-4" />
                          </div>
                          <p className="text-sm font-semibold text-slate-500">{t('schedule.openJobs') || 'Vagas abertas'}</p>
                        </div>
                      </td>
                      {days.map((day, i) => {
                        const dayJobs = getJobsForDate(day.fullDate).filter(j => j.status === 'open');
                        return (
                          <td key={i} className="p-1 border-r border-slate-200 last:border-r-0 align-top">
                            <div className="space-y-1">
                              {dayJobs.map((job) => (
                                <div key={job.id} className="border-2 border-dashed border-green-300 bg-green-50/50 p-2 rounded-lg">
                                  <p className="text-[10px] font-bold truncate text-green-700">{job.clientName}</p>
                                  <p className="text-[9px] font-medium italic text-green-600">R$ {job.dailyRate}</p>
                                  <div className="flex gap-1 mt-1">
                                    <span className="text-[8px] bg-green-100 text-green-700 px-1 rounded font-bold">
                                      {job.guardsConfirmed || 0}/{job.guardsNeeded} vagas
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filters Sidebar */}
        <aside className="w-72 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col shrink-0 overflow-hidden h-fit">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Filter className="size-4" />
              {t('schedule.filterTitle') || 'Filtros da Escala'}
            </h3>
          </div>
          <div className="p-4 space-y-6">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">Filtrar por Status</p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={filters.open}
                    onChange={e => setFilters({...filters, open: e.target.checked})}
                    className="size-4 rounded border-slate-300 text-green-600 focus:ring-green-500" 
                  />
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-slate-600">Abertas</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={filters.filled}
                    onChange={e => setFilters({...filters, filled: e.target.checked})}
                    className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium text-slate-600">Preenchidas</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={filters.inProgress}
                    onChange={e => setFilters({...filters, inProgress: e.target.checked})}
                    className="size-4 rounded border-slate-300 text-[#192c4d] focus:ring-[#192c4d]" 
                  />
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-[#192c4d]"></div>
                    <span className="text-sm font-medium text-slate-600">Em Progresso</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={filters.completed}
                    onChange={e => setFilters({...filters, completed: e.target.checked})}
                    className="size-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500" 
                  />
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-slate-400"></div>
                    <span className="text-sm font-medium text-slate-600">Concluídas</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Esta Semana</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Escalas abertas</span>
                <span className="font-bold text-green-600">{jobs.filter(j => j.status === 'open').length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Em progresso</span>
                <span className="font-bold text-[#192c4d]">{jobs.filter(j => j.status === 'in_progress').length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Guardas ativos</span>
                <span className="font-bold">{guards.filter(g => g.status === 'Ativo' || g.status === 'On Duty').length}</span>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-slate-200">
            <button 
              onClick={() => setFilters({ open: true, filled: true, inProgress: true, completed: false })}
              className="w-full py-2 bg-slate-100 text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
            >
              {t('schedule.resetFilters') || 'Resetar Filtros'}
            </button>
          </div>
        </aside>
      </div>

      {/* Footer Stats Bar */}
      <footer className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between text-[11px] text-slate-500 shadow-sm">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5"><strong className="text-slate-700">{totalShifts}</strong> Total de Turnos</span>
          <span className="flex items-center gap-1.5"><strong className="text-slate-700">{assignedShifts}</strong> Atribuídos</span>
          <span className="flex items-center gap-1.5"><strong className="text-amber-600">{pendingShifts}</strong> Pendentes</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-3" />
          Dados em tempo real via Firestore
        </div>
      </footer>

      <JobModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        title="Criar Nova Escala"
      />
    </div>
  );
}
