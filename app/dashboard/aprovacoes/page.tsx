'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, X, Loader2, User, Calendar, MapPin, DollarSign, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/use-auth';
import { approveAssignment, rejectAssignment } from '@/lib/firestore-service';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import type { JobAssignment, Job } from '@/lib/types';

interface AssignmentWithJob extends JobAssignment {
  job?: Job;
}

export default function AprovacaoPage() {
  const { user, userData } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const qConstraints: any[] = [where('status', '==', 'pending')];
    if (userData?.companyId) {
      qConstraints.push(where('companyId', '==', userData.companyId));
    }

    const q = query(
      collection(db, 'job_assignments'),
      ...qConstraints
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const assignmentsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JobAssignment));

      // Fetch associated jobs
      const withJobs = await Promise.all(
        assignmentsData.map(async (assignment): Promise<AssignmentWithJob | null> => {
          try {
            const jobDoc = await getDoc(doc(db, 'jobs', assignment.jobId));
            const jobData = jobDoc.exists() ? { id: jobDoc.id, ...jobDoc.data() } as Job : undefined;

            // Filter: only show jobs this user created (if client) or all (if admin)
            if (userData?.role === 'client' && jobData?.contractorId !== user.uid) {
              return null;
            }

            return { ...assignment, job: jobData };
          } catch {
            return { ...assignment };
          }
        })
      );

      setAssignments(withJobs.filter((w): w is AssignmentWithJob => w !== null));
      setLoading(false);
    });

    return () => unsub();
  }, [user, userData]);

  const handleApprove = async (assignment: AssignmentWithJob) => {
    if (!assignment.id) return;
    setProcessing(assignment.id);
    try {
      await approveAssignment(assignment.id, assignment.jobId);
    } catch (error) {
      console.error('Error approving:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (assignment: AssignmentWithJob) => {
    if (!assignment.id) return;
    if (!window.confirm(`Rejeitar ${assignment.guardName}?`)) return;
    setProcessing(assignment.id);
    try {
      await rejectAssignment(assignment.id);
    } catch (error) {
      console.error('Error rejecting:', error);
    } finally {
      setProcessing(null);
    }
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
        <h2 className="text-2xl font-bold text-slate-900">Aprovações Pendentes</h2>
        <p className="text-slate-500 text-sm">
          Aprove ou rejeite solicitações de vigilantes para suas escalas.
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <CheckCircle2 className="size-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Nenhuma solicitação pendente</h3>
          <p className="text-slate-500 text-sm">Quando vigilantes solicitarem participação em escalas, aparecerão aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {assignments.map((assignment) => (
              <motion.div
                key={assignment.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Guard Info */}
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-12 rounded-full bg-[#192c4d]/10 flex items-center justify-center text-[#192c4d] font-bold">
                      {assignment.guardName?.substring(0, 2).toUpperCase() || 'VG'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{assignment.guardName}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        SOLICITAÇÃO PENDENTE
                      </span>
                    </div>
                  </div>

                  {/* Job Details */}
                  {assignment.job && (
                    <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                      <p className="text-sm font-bold text-slate-900">{assignment.job.clientName}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {assignment.job.date ? new Date(assignment.job.date).toLocaleDateString('pt-BR') : '-'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {assignment.job.startTime} - {assignment.job.endTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {assignment.job.location}
                        </span>
                        <span className="flex items-center gap-1 text-green-600 font-bold">
                          <DollarSign className="size-3" />
                          R$ {assignment.job.dailyRate}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-5 pb-5 flex gap-2">
                  <button
                    onClick={() => handleReject(assignment)}
                    disabled={processing === assignment.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all disabled:opacity-40"
                  >
                    {processing === assignment.id ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                    Rejeitar
                  </button>
                  <button
                    onClick={() => handleApprove(assignment)}
                    disabled={processing === assignment.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 disabled:opacity-40"
                  >
                    {processing === assignment.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    Aprovar
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
