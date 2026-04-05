'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { Loader2, Calendar as CalendarIcon, MapPin, Clock, DollarSign, CheckCircle2, Star, Briefcase } from 'lucide-react';
import type { JobAssignment, Job } from '@/lib/types';

interface HistoryItem {
  assignment: JobAssignment;
  job?: Job;
}

export default function HistoricoPage() {
  const { user, userData } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Query assignments for this guard
    const q = query(
      collection(db, 'job_assignments'),
      where('companyId', '==', userData?.companyId || ''),
      where('guardId', '==', user.uid)
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const assignments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JobAssignment));
      
      // Fetch associated jobs
      const withJobs: HistoryItem[] = await Promise.all(
        assignments.map(async (assignment) => {
          try {
            const jobDoc = await getDoc(doc(db, 'jobs', assignment.jobId));
            const job = jobDoc.exists() ? { id: jobDoc.id, ...jobDoc.data() } as Job : undefined;
            return { assignment, job };
          } catch {
            return { assignment };
          }
        })
      );

      // Sort by date descending
      withJobs.sort((a, b) => {
        const dateA = a.job?.date ? new Date(a.job.date).getTime() : 0;
        const dateB = b.job?.date ? new Date(b.job.date).getTime() : 0;
        return dateB - dateA;
      });

      setItems(withJobs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching history:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="size-8 animate-spin text-[#192c4d]" /></div>;
  }

  // Group by month/year
  const groupedItems = items.reduce((acc, item) => {
    if (!item.job?.date) return acc;
    const date = new Date(item.job.date);
    const monthYear = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(item);
    return acc;
  }, {} as Record<string, HistoryItem[]>);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_out': return { label: 'Concluído', color: 'bg-green-100 text-green-700' };
      case 'checked_in': return { label: 'Em Serviço', color: 'bg-blue-100 text-blue-700' };
      case 'approved': return { label: 'Aprovado', color: 'bg-indigo-100 text-indigo-700' };
      case 'pending': return { label: 'Pendente', color: 'bg-amber-100 text-amber-700' };
      case 'rejected': return { label: 'Rejeitado', color: 'bg-red-100 text-red-700' };
      default: return { label: status, color: 'bg-slate-100 text-slate-700' };
    }
  };

  const totalEarnings = items
    .filter(i => i.assignment.status === 'checked_out')
    .reduce((s, i) => s + (i.assignment.dailyRate || 0), 0);

  const totalHours = items
    .filter(i => i.assignment.totalHours)
    .reduce((s, i) => s + (i.assignment.totalHours || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Meu Histórico</h2>
        <p className="text-slate-500 text-sm">Acompanhe suas escalas, ganhos e avaliações.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total de Escalas</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900">{items.length}</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Briefcase className="size-5" /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Ganhos Totais</p>
              <h3 className="text-2xl font-bold mt-1 text-green-600">R$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign className="size-5" /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Horas Trabalhadas</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900">{totalHours.toFixed(1)}h</h3>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Clock className="size-5" /></div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <CalendarIcon className="size-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Nenhum histórico encontrado</h3>
          <p className="text-slate-500 text-sm">Quando você participar de escalas, o histórico aparecerá aqui.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([monthYear, monthItems]) => (
            <div key={monthYear} className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 capitalize border-b border-slate-200 pb-2">{monthYear}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {monthItems.map(item => {
                  const badge = getStatusBadge(item.assignment.status);
                  return (
                    <div key={item.assignment.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900">{item.job?.clientName || 'Escala'}</h4>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                            <MapPin className="size-3" />
                            {item.job?.location || 'Local não informado'}
                          </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <CalendarIcon className="size-4 text-slate-400" />
                          <span className="font-medium">{item.job?.date ? new Date(item.job.date).toLocaleDateString('pt-BR') : '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Clock className="size-4 text-slate-400" />
                          <span className="font-medium">{item.job?.startTime || '-'} - {item.job?.endTime || '-'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1 text-green-600 font-bold">
                          <DollarSign className="size-4" />
                          <span>R$ {Number(item.assignment.dailyRate || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.assignment.totalHours && (
                            <span className="text-xs text-slate-500">{item.assignment.totalHours}h</span>
                          )}
                          {item.assignment.rating && (
                            <div className="flex items-center gap-0.5 text-xs text-amber-600">
                              <Star className="size-3 fill-amber-400 text-amber-400" />
                              {item.assignment.rating}
                            </div>
                          )}
                          {item.assignment.status === 'checked_out' && (
                            <CheckCircle2 className="size-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
