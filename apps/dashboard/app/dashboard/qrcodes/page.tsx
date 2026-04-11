'use client';

import React, { useEffect, useState } from 'react';
import { QrCode, Loader2, Calendar, MapPin, Users, DollarSign, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { QRGenerator } from '@/components/QRGenerator';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';
import type { Job, QRCodeData } from '@/lib/types';

export default function QRCodesPage() {
  const { user, userData } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const loadJobs = async () => {
    if (!user) return;
    try {
      let data = await api.listJobs();
      data = data.filter(j => j.status === 'filled' || j.status === 'in_progress');
      if (userData?.role === 'client') {
        data = data.filter(j => j.contractorId === user.uid);
      }
      setJobs(data);
    } catch (error) {
      console.error('Erro ao carregar QR codes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 15000);
    return () => clearInterval(interval);
  }, [user, userData]);

  const regenerateTokens = async (job: Job) => {
    if (!job.id) return;
    const newCheckin = crypto.randomUUID();
    const newCheckout = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await api.updateJob(job.id, {
      qrCheckinToken: newCheckin,
      qrCheckoutToken: newCheckout,
      qrExpiresAt: expiresAt.toISOString(),
    } as any);
    loadJobs();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#192c4d]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">QR Codes das Escalas</h2>
        <p className="text-slate-500 text-sm">
          Gere e gerencie os QR Codes de check-in e check-out para cada escala.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <QrCode className="size-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Nenhuma escala confirmada</h3>
          <p className="text-slate-500 text-sm">QR Codes aparecerão quando houver escalas com guardas confirmados.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {jobs.map((job) => {
            const expiresAt = job.qrExpiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            const checkinQR: QRCodeData = {
              type: 'checkin',
              jobId: job.id!,
              token: job.qrCheckinToken || '',
              expiresAt,
            };

            const checkoutQR: QRCodeData = {
              type: 'checkout',
              jobId: job.id!,
              token: job.qrCheckoutToken || '',
              expiresAt,
            };

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Job Header */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-[#192c4d] text-white flex items-center justify-center">
                      <QrCode className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{job.clientName}</h3>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="size-3" />{job.date ? new Date(job.date).toLocaleDateString('pt-BR') : 'Sem data'}</span>
                        <span className="flex items-center gap-1"><MapPin className="size-3" />{job.location}</span>
                        <span className="flex items-center gap-1"><Users className="size-3" />{job.guardsConfirmed || 0}/{job.guardsNeeded} guardas</span>
                        <span className="flex items-center gap-1"><DollarSign className="size-3" />R$ {job.dailyRate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      job.status === 'in_progress' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {job.status === 'in_progress' ? 'EM ANDAMENTO' : 'CONFIRMADA'}
                    </span>
                    <button
                      onClick={() => regenerateTokens(job)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <RefreshCw className="size-3.5" />
                      Regenerar QR
                    </button>
                  </div>
                </div>

                {/* QR Codes */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <QRGenerator
                    data={checkinQR}
                    jobTitle={job.clientName}
                    jobDate={job.date ? new Date(job.date).toLocaleDateString('pt-BR') : undefined}
                    size={180}
                  />
                  <QRGenerator
                    data={checkoutQR}
                    jobTitle={job.clientName}
                    jobDate={job.date ? new Date(job.date).toLocaleDateString('pt-BR') : undefined}
                    size={180}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
