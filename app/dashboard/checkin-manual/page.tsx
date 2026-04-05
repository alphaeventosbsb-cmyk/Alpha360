'use client';

import React, { useState } from 'react';
import {
  Search,
  UserCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  ScanLine,
  LogOut,
  Shield,
  Fingerprint,
  Users,
  Briefcase,
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/use-auth';
import {
  searchGuardByNameAndCpf,
  getGuardAssignmentsWithJobs,
  performManualCheckin,
  performManualCheckout,
} from '@/lib/firestore-service';
import type { UserData, JobAssignment, Job } from '@/lib/types';

type Mode = 'checkin' | 'checkout';

interface AssignmentWithJob {
  assignment: JobAssignment;
  job: Job;
}

export default function ManualCheckinPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('checkin');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [searching, setSearching] = useState(false);
  const [guard, setGuard] = useState<UserData | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithJob[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithJob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [searchError, setSearchError] = useState('');

  const resetState = () => {
    setGuard(null);
    setAssignments([]);
    setSelectedAssignment(null);
    setResult(null);
    setSearchError('');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cpf.trim()) return;

    resetState();
    setSearching(true);

    try {
      const found = await searchGuardByNameAndCpf(name.trim(), cpf.trim());
      if (!found) {
        setSearchError('Nenhum vigilante encontrado com esse nome e CPF. Verifique os dados e tente novamente.');
        setSearching(false);
        return;
      }
      setGuard(found);

      // Fetch assignments based on mode
      const statuses = mode === 'checkin' ? ['approved'] : ['checked_in'];
      const guardAssignments = await getGuardAssignmentsWithJobs(found.id!, statuses);

      if (guardAssignments.length === 0) {
        if (mode === 'checkin') {
          setSearchError(`${found.name} não possui nenhuma escala aprovada pendente de check-in.`);
        } else {
          setSearchError(`${found.name} não possui nenhuma escala com check-in ativo para realizar check-out.`);
        }
      }
      setAssignments(guardAssignments);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Erro ao buscar no banco de dados. Tente novamente.');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = async () => {
    if (!user || !guard?.id || !selectedAssignment) return;
    setProcessing(true);

    try {
      let res: { success: boolean; message: string };

      if (mode === 'checkin') {
        res = await performManualCheckin(
          guard.id,
          selectedAssignment.assignment.id!,
          selectedAssignment.job.id!,
          user.uid
        );
      } else {
        res = await performManualCheckout(
          guard.id,
          selectedAssignment.assignment.id!,
          selectedAssignment.job.id!,
          user.uid,
          selectedAssignment.assignment.checkinAt!
        );
      }

      setResult(res);

      if (res.success) {
        // Clear selection after success
        setSelectedAssignment(null);
        setAssignments([]);
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || 'Erro inesperado.' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setName('');
    setCpf('');
    resetState();
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Check-in / Check-out Manual</h2>
        <p className="text-slate-500 text-sm mt-1">
          Quando o QR Code falhar, use o nome e CPF do vigilante para registrar presença manualmente.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex shadow-sm">
        <button
          onClick={() => { setMode('checkin'); resetState(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            mode === 'checkin'
              ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <ScanLine className="size-4" />
          🔐 CHECK-IN Manual
        </button>
        <button
          onClick={() => { setMode('checkout'); resetState(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            mode === 'checkout'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <LogOut className="size-4" />
          🔓 CHECK-OUT Manual
        </button>
      </div>

      {/* Search Form */}
      <motion.div
        key={`form-${mode}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-2xl border-2 ${
          mode === 'checkin' ? 'border-green-200' : 'border-blue-200'
        } shadow-sm overflow-hidden`}
      >
        <div className={`px-6 py-4 ${mode === 'checkin' ? 'bg-green-50 border-b border-green-200' : 'bg-blue-50 border-b border-blue-200'}`}>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Fingerprint className="size-4" />
            Identificar Vigilante
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {mode === 'checkin'
              ? 'Digite o nome e CPF do vigilante para registrar o check-in manualmente.'
              : 'Digite o nome e CPF do vigilante para registrar o check-out. O sistema verificará se ele foi escalado e fez check-in.'}
          </p>
        </div>

        <form onSubmit={handleSearch} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Nome do Vigilante</label>
              <input
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none text-sm"
                placeholder="Ex: Ricardo Santos"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">CPF</label>
              <input
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none text-sm"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={e => setCpf(formatCpf(e.target.value))}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={searching || !name.trim() || !cpf.trim()}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50 ${
                mode === 'checkin'
                  ? 'bg-green-500 text-white hover:bg-green-600 shadow-green-500/20'
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/20'
              }`}
            >
              {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              {searching ? 'Buscando...' : 'Buscar Vigilante'}
            </button>
            {guard && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {searchError && !guard && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex items-start gap-4"
          >
            <div className="size-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5 text-red-600" />
            </div>
            <div>
              <h4 className="font-bold text-red-800 text-sm">Vigilante não encontrado</h4>
              <p className="text-red-600 text-sm mt-1">{searchError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guard Card */}
      <AnimatePresence>
        {guard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl border-2 border-[#192c4d]/20 shadow-lg overflow-hidden"
          >
            <div className="px-6 py-4 bg-[#192c4d] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <UserCheck className="size-4" />
                Vigilante Identificado
              </h3>
              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                guard.status === 'Ativo' || guard.status === 'On Duty'
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-white/20 text-white/80'
              }`}>
                {guard.status || 'Inativo'}
              </span>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-5">
                {/* Photo */}
                <div className="relative">
                  {guard.photoUrl ? (
                    <Image
                      className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-100 shadow-md"
                      src={guard.photoUrl}
                      alt={guard.name}
                      width={96}
                      height={96}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-[#192c4d] flex items-center justify-center text-white text-3xl font-bold border-4 border-slate-100 shadow-md">
                      {guard.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 size-6 rounded-full border-3 border-white flex items-center justify-center ${
                    guard.status === 'Ativo' || guard.status === 'On Duty' ? 'bg-green-500' : 'bg-slate-400'
                  }`}>
                    <Shield className="size-3 text-white" />
                  </div>
                </div>

                {/* Data */}
                <div className="flex-1 space-y-2">
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">{guard.name}</h4>
                    <p className="text-sm text-slate-500">{guard.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 px-3 py-2 rounded-lg">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">CPF</p>
                      <p className="text-sm font-bold text-slate-700">{guard.cpf || '-'}</p>
                    </div>
                    <div className="bg-slate-50 px-3 py-2 rounded-lg">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Rank</p>
                      <p className="text-sm font-bold text-slate-700">{guard.rank || 'Sem rank'}</p>
                    </div>
                    <div className="bg-slate-50 px-3 py-2 rounded-lg">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Telefone</p>
                      <p className="text-sm font-bold text-slate-700">{guard.phone || '-'}</p>
                    </div>
                    <div className="bg-slate-50 px-3 py-2 rounded-lg">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Desempenho</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#192c4d] rounded-full" style={{ width: `${guard.performance ?? 0}%` }} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{guard.performance ?? 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning for no assignments */}
            {searchError && (
              <div className="mx-6 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">{searchError}</p>
              </div>
            )}

            {/* Assignments List */}
            {assignments.length > 0 && (
              <div className="px-6 pb-6 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Briefcase className="size-3.5" />
                  {mode === 'checkin'
                    ? 'Escalas aprovadas — Selecione para check-in'
                    : 'Escalas com check-in — Selecione para check-out'}
                </h4>
                {assignments.map((item) => (
                  <button
                    key={item.assignment.id}
                    onClick={() => setSelectedAssignment(item)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedAssignment?.assignment.id === item.assignment.id
                        ? mode === 'checkin'
                          ? 'border-green-400 bg-green-50 shadow-md shadow-green-500/10'
                          : 'border-blue-400 bg-blue-50 shadow-md shadow-blue-500/10'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-bold text-slate-900">{item.job.clientName}</h5>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        mode === 'checkout' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {mode === 'checkout' && item.assignment.checkinAt
                          ? `Check-in: ${new Date(item.assignment.checkinAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                          : 'APROVADO'
                        }
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {item.job.date ? new Date(item.job.date).toLocaleDateString('pt-BR') : '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {item.job.startTime} - {item.job.endTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {item.job.location || 'Local não informado'}
                      </span>
                      <span className="flex items-center gap-1 text-green-600 font-bold">
                        <DollarSign className="size-3" />
                        R$ {Number(item.job.dailyRate || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </button>
                ))}

                {/* Confirm Button */}
                {selectedAssignment && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <button
                      onClick={handleConfirm}
                      disabled={processing}
                      className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-bold transition-all shadow-lg disabled:opacity-50 ${
                        mode === 'checkin'
                          ? 'bg-green-500 text-white hover:bg-green-600 shadow-green-500/30'
                          : 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/30'
                      }`}
                    >
                      {processing ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="size-5" />
                          {mode === 'checkin'
                            ? `✅ Confirmar Check-in Manual de ${guard?.name}`
                            : `✅ Confirmar Check-out Manual de ${guard?.name}`
                          }
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-2xl p-6 flex flex-col items-center text-center ${
              result.success
                ? 'bg-green-50 border-2 border-green-200'
                : 'bg-red-50 border-2 border-red-200'
            }`}
          >
            <div className={`size-16 rounded-full flex items-center justify-center mb-4 ${
              result.success ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {result.success ? (
                <CheckCircle2 className="size-8 text-green-600" />
              ) : (
                <AlertTriangle className="size-8 text-red-600" />
              )}
            </div>
            <h4 className={`text-lg font-bold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
              {result.success ? 'Sucesso!' : 'Erro'}
            </h4>
            <p className="text-sm text-slate-600 mt-2">{result.message}</p>
            <button
              onClick={handleReset}
              className="mt-4 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              Nova Operação
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
        <Shield className="size-5 text-[#192c4d] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-500 space-y-1">
          <p className="font-bold text-slate-700">Como funciona o check-in/check-out manual?</p>
          <p>• <strong>Check-in:</strong> Busque o vigilante por nome e CPF. O sistema mostra a foto e dados para confirmação. Só permite check-in em escalas aprovadas.</p>
          <p>• <strong>Check-out:</strong> Busque o vigilante por nome e CPF. O sistema verifica se ele foi escalado e fez check-in (QR ou manual). Só então libera o check-out e calcula as horas.</p>
          <p>• Todos os registros manuais ficam marcados nos alertas como "MANUAL" para auditoria.</p>
        </div>
      </div>
    </div>
  );
}
