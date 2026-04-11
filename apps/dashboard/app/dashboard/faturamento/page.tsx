'use client';

import React, { useEffect, useState } from 'react';
import { DollarSign, Calendar, Clock, CheckCircle2, Loader2, TrendingUp, Users, Download, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';
import type { JobAssignment, PixPayment } from '@/lib/types';

export default function FaturamentoPage() {
  const { user, userData } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [payments, setPayments] = useState<PixPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    try {
      const [assignmentsData, paymentsData] = await Promise.all([
        api.listAssignments({ status: ['checked_out', 'checked_in', 'approved'] }),
        api.listPayments(userData?.role === 'guard' ? user.uid : undefined),
      ]);
      
      if (userData?.role === 'guard') {
        setAssignments(assignmentsData.filter((a: any) => a.guardId === user.uid));
      } else {
        setAssignments(assignmentsData);
      }
      setPayments(paymentsData);
    } catch (error) {
      console.error('Erro ao carregar faturamento:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [user, userData]);

  const totalEarnings = assignments.reduce((s, a) => s + (a.dailyRate || 0), 0);
  const paidTotal = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
  const pendingTotal = totalEarnings - paidTotal;
  const completedCount = assignments.length;

  const handleProcessPayment = async (assignment: any) => {
    if (!userData?.pixKey) {
      alert('Configure sua chave PIX no perfil antes de receber pagamentos.');
      return;
    }
    try {
      const paymentId = await api.createPayment({
        assignmentId: assignment.id,
        guardId: assignment.guardId,
        guardName: assignment.guardName,
        amount: assignment.dailyRate,
        pixKey: userData.pixKey || '',
        pixKeyType: userData.pixKeyType || 'cpf',
        status: 'pending',
      });
      await api.processPayment(paymentId.id);
      loadData();
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="size-8 animate-spin text-[#192c4d]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {userData?.role === 'guard' ? 'Meus Ganhos' : 'Faturamento'}
        </h2>
        <p className="text-slate-500 text-sm">Controle financeiro detalhado das operações.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Geral</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900">R$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><DollarSign className="size-5" /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Pago</p>
              <h3 className="text-2xl font-bold mt-1 text-green-600">R$ {paidTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 className="size-5" /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Pendente</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600">R$ {pendingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock className="size-5" /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Escalas Concluídas</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900">{completedCount}</h3>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar className="size-5" /></div>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Registros de Pagamento</h3>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Vigilante</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Valor</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Horas</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Status Pagamento</th>
              {(userData?.role === 'admin' || userData?.role === 'client') && (
                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Ação</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assignments.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhum registro encontrado.</td></tr>
            ) : (
              assignments.map((a: any) => {
                const payment = payments.find(p => p.assignmentId === a.id);
                return (
                  <tr key={a.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-[#192c4d]/10 flex items-center justify-center text-[10px] font-bold text-[#192c4d]">
                          {(a.guardName || 'VG').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{a.guardName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-green-600">
                      R$ {(a.dailyRate || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">{a.totalHours ? `${a.totalHours}h` : '-'}</td>
                    <td className="px-6 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        payment?.status === 'completed' ? 'bg-green-100 text-green-700' :
                        payment?.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {payment?.status === 'completed' ? '✅ Pago' :
                         payment?.status === 'processing' ? '⏳ Processando' :
                         '⏳ Pendente'}
                      </span>
                    </td>
                    {(userData?.role === 'admin' || userData?.role === 'client') && (
                      <td className="px-6 py-3 text-right">
                        {(!payment || payment.status === 'failed') && (
                          <button
                            onClick={() => handleProcessPayment(a)}
                            className="px-3 py-1.5 text-xs font-bold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1 ml-auto"
                          >
                            <CreditCard className="size-3" /> Pagar PIX
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
