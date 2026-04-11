'use client';

import React, { useState, useEffect } from 'react';
import { Shield, User, Building2, ArrowRight, ArrowLeft, Loader2, CheckCircle2, Phone, MapPin, CreditCard, Ruler, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';

// CNPJ validation
function isValidCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, '');
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  
  let sum = 0;
  let weight = [5,4,3,2,9,8,7,6,5,4,3,2];
  for (let i = 0; i < 12; i++) sum += parseInt(cnpj[i]) * weight[i];
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cnpj[12]) !== digit) return false;
  
  sum = 0;
  weight = [6,5,4,3,2,9,8,7,6,5,4,3,2];
  for (let i = 0; i < 13; i++) sum += parseInt(cnpj[i]) * weight[i];
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cnpj[13]) !== digit) return false;
  
  return true;
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export default function OnboardingPage() {
  const { user, userData, loading: authLoading, refreshUserData } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'role' | 'form'>('role');
  const [selectedRole, setSelectedRole] = useState<'guard' | 'client' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Guard form
  const [guardForm, setGuardForm] = useState({
    name: '',
    phone: '',
    cpf: '',
    rg: '',
    age: '',
    height: '',
    address: '',
    neighborhood: '',
    city: '',
    uf: '',
    pixKey: '',
    pixKeyType: 'cpf' as 'cpf' | 'email' | 'phone' | 'random',
  });

  // Client form
  const [clientForm, setClientForm] = useState({
    companyName: '',
    cnpj: '',
    phone: '',
  });

  // If already onboarded, redirect to dashboard
  useEffect(() => {
    if (!authLoading && userData?.onboardingComplete) {
      router.replace('/dashboard');
    }
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [user, userData, authLoading, router]);

  // Pre-fill name from auth
  useEffect(() => {
    if (user) {
      setGuardForm(prev => ({
        ...prev,
        name: user.displayName || user.email?.split('@')[0] || '',
      }));
    }
  }, [user]);

  const handleRoleSelect = (role: 'guard' | 'client') => {
    setSelectedRole(role);
    setStep('form');
    setError('');
  };

  const handleGuardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    if (!guardForm.name.trim()) { setError('Preencha seu nome completo.'); return; }
    if (!guardForm.phone.trim()) { setError('Preencha seu telefone.'); return; }
    if (!guardForm.cpf.trim()) { setError('Preencha seu CPF.'); return; }

    setSaving(true);
    try {
      await api.post('/api/onboarding/guard', {
        name: guardForm.name,
        phone: guardForm.phone,
        cpf: guardForm.cpf,
        rg: guardForm.rg,
        age: guardForm.age,
        height: guardForm.height,
        address: guardForm.address,
        neighborhood: guardForm.neighborhood,
        city: guardForm.city,
        uf: guardForm.uf,
        pixKey: guardForm.pixKey,
        pixKeyType: guardForm.pixKeyType,
      });

      await refreshUserData();
      router.replace('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    if (!clientForm.companyName.trim()) { setError('Preencha o nome da empresa.'); return; }
    if (!clientForm.cnpj.trim()) { setError('Preencha o CNPJ.'); return; }
    if (!isValidCNPJ(clientForm.cnpj)) { setError('CNPJ inválido. Verifique os dígitos.'); return; }
    if (!clientForm.phone.trim()) { setError('Preencha o telefone.'); return; }

    setSaving(true);
    try {
      await api.post('/api/onboarding/client', {
        companyName: clientForm.companyName,
        cnpj: clientForm.cnpj,
        phone: clientForm.phone,
      });

      await refreshUserData();
      router.replace('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <Loader2 className="size-8 text-[#192c4d] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="bg-[#192c4d] p-6 text-center text-white">
            <div className="size-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Shield className="size-7" />
            </div>
            <h1 className="text-xl font-bold">Bem-vindo ao Alpha360</h1>
            <p className="text-slate-400 text-sm mt-1">
              {step === 'role' ? 'Como você deseja usar a plataforma?' : 
               selectedRole === 'guard' ? 'Complete seu cadastro de Vigilante' : 'Dados da sua empresa'}
            </p>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Role selection */}
              {step === 'role' && (
                <motion.div
                  key="role"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-slate-600 text-center mb-6">
                    Selecione seu perfil para personalizar sua experiência:
                  </p>

                  {/* Guard card */}
                  <button
                    onClick={() => handleRoleSelect('guard')}
                    className="w-full p-5 rounded-xl border-2 border-slate-200 hover:border-[#192c4d] hover:shadow-lg transition-all group text-left flex items-start gap-4"
                  >
                    <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors shrink-0">
                      <Shield className="size-7 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-base">Sou Vigilante</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Quero me cadastrar para receber escalas, fazer check-in/out por QR Code e acompanhar meus ganhos.
                      </p>
                    </div>
                    <ArrowRight className="size-5 text-slate-300 group-hover:text-[#192c4d] mt-2 transition-colors shrink-0" />
                  </button>

                  {/* Client card */}
                  <button
                    onClick={() => handleRoleSelect('client')}
                    className="w-full p-5 rounded-xl border-2 border-slate-200 hover:border-[#192c4d] hover:shadow-lg transition-all group text-left flex items-start gap-4"
                  >
                    <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors shrink-0">
                      <Building2 className="size-7 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-base">Sou Contratante</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Quero gerenciar escalas, monitorar operações em tempo real e contratar profissionais de segurança.
                      </p>
                    </div>
                    <ArrowRight className="size-5 text-slate-300 group-hover:text-[#192c4d] mt-2 transition-colors shrink-0" />
                  </button>
                </motion.div>
              )}

              {/* Step 2: Guard form */}
              {step === 'form' && selectedRole === 'guard' && (
                <motion.div
                  key="guard-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <button
                    onClick={() => { setStep('role'); setError(''); }}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#192c4d] mb-4 transition-colors"
                  >
                    <ArrowLeft className="size-4" /> Voltar
                  </button>

                  <form onSubmit={handleGuardSubmit} className="space-y-3">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nome Completo *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                          required
                          type="text"
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#192c4d] outline-none transition-all text-sm"
                          placeholder="Seu nome completo"
                          value={guardForm.name}
                          onChange={e => setGuardForm({...guardForm, name: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Telefone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                          required
                          type="tel"
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#192c4d] outline-none transition-all text-sm"
                          placeholder="(61) 99999-9999"
                          value={guardForm.phone}
                          onChange={e => setGuardForm({...guardForm, phone: formatPhone(e.target.value)})}
                        />
                      </div>
                    </div>

                    {/* CPF and RG side by side */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">CPF *</label>
                        <input
                          required
                          type="text"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#192c4d] outline-none transition-all text-sm"
                          placeholder="000.000.000-00"
                          value={guardForm.cpf}
                          onChange={e => setGuardForm({...guardForm, cpf: formatCPF(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">RG</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#192c4d] outline-none transition-all text-sm"
                          placeholder="Número do RG"
                          value={guardForm.rg}
                          onChange={e => setGuardForm({...guardForm, rg: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Age and Height */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Idade</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                          <input
                            type="number"
                            min="18"
                            max="70"
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#192c4d] outline-none transition-all text-sm"
                            placeholder="Ex: 28"
                            value={guardForm.age}
                            onChange={e => setGuardForm({...guardForm, age: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Altura (cm)</label>
                        <div className="relative">
                          <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                          <input
                            type="number"
                            min="140"
                            max="220"
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#192c4d] outline-none transition-all text-sm"
                            placeholder="Ex: 180"
                            value={guardForm.height}
                            onChange={e => setGuardForm({...guardForm, height: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Endereço</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                          type="text"
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#192c4d] outline-none transition-all text-sm"
                          placeholder="Rua, número"
                          value={guardForm.address}
                          onChange={e => setGuardForm({...guardForm, address: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Neighborhood, City, UF */}
                    <div className="grid grid-cols-5 gap-3">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Bairro</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#192c4d] outline-none transition-all text-sm"
                          placeholder="Bairro"
                          value={guardForm.neighborhood}
                          onChange={e => setGuardForm({...guardForm, neighborhood: e.target.value})}
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Cidade</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#192c4d] outline-none transition-all text-sm"
                          placeholder="Cidade"
                          value={guardForm.city}
                          onChange={e => setGuardForm({...guardForm, city: e.target.value})}
                        />
                      </div>
                      <div className="col-span-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">UF</label>
                        <input
                          type="text"
                          maxLength={2}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#192c4d] outline-none transition-all text-sm uppercase"
                          placeholder="DF"
                          value={guardForm.uf}
                          onChange={e => setGuardForm({...guardForm, uf: e.target.value.toUpperCase()})}
                        />
                      </div>
                    </div>

                    {/* PIX */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Chave PIX (para receber pagamentos)</label>
                      <div className="flex gap-2">
                        <select
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#192c4d] outline-none transition-all text-sm"
                          value={guardForm.pixKeyType}
                          onChange={e => setGuardForm({...guardForm, pixKeyType: e.target.value as any})}
                        >
                          <option value="cpf">CPF</option>
                          <option value="email">Email</option>
                          <option value="phone">Telefone</option>
                          <option value="random">Aleatória</option>
                        </select>
                        <div className="relative flex-1">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                          <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#192c4d] outline-none transition-all text-sm"
                            placeholder="Sua chave PIX"
                            value={guardForm.pixKey}
                            onChange={e => setGuardForm({...guardForm, pixKey: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    {error && (
                      <p className="text-xs font-bold text-red-500 text-center">{error}</p>
                    )}

                    <button
                      disabled={saving}
                      type="submit"
                      className="w-full bg-[#192c4d] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-lg shadow-[#192c4d]/20 disabled:opacity-50 mt-4"
                    >
                      {saving ? <Loader2 className="size-5 animate-spin" /> : (
                        <>
                          <CheckCircle2 className="size-4" />
                          Finalizar Cadastro
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Step 2: Client form */}
              {step === 'form' && selectedRole === 'client' && (
                <motion.div
                  key="client-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <button
                    onClick={() => { setStep('role'); setError(''); }}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#192c4d] mb-4 transition-colors"
                  >
                    <ArrowLeft className="size-4" /> Voltar
                  </button>

                  <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-700">
                      <strong>Email:</strong> {user?.email}
                    </p>
                  </div>

                  <form onSubmit={handleClientSubmit} className="space-y-4">
                    {/* Company name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nome da Empresa *</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                          required
                          type="text"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#192c4d] outline-none transition-all text-sm"
                          placeholder="Nome da sua empresa"
                          value={clientForm.companyName}
                          onChange={e => setClientForm({...clientForm, companyName: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* CNPJ */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">CNPJ *</label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#192c4d] outline-none transition-all text-sm"
                        placeholder="00.000.000/0000-00"
                        value={clientForm.cnpj}
                        onChange={e => setClientForm({...clientForm, cnpj: formatCNPJ(e.target.value)})}
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Telefone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                          required
                          type="tel"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#192c4d] outline-none transition-all text-sm"
                          placeholder="(61) 99999-9999"
                          value={clientForm.phone}
                          onChange={e => setClientForm({...clientForm, phone: formatPhone(e.target.value)})}
                        />
                      </div>
                    </div>

                    {error && (
                      <p className="text-xs font-bold text-red-500 text-center">{error}</p>
                    )}

                    <button
                      disabled={saving}
                      type="submit"
                      className="w-full bg-[#192c4d] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-lg shadow-[#192c4d]/20 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="size-5 animate-spin" /> : (
                        <>
                          <CheckCircle2 className="size-4" />
                          Começar a usar o Alpha360
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          © 2026 Alpha360 — Sistema de Gestão de Segurança
        </p>
      </motion.div>
    </div>
  );
}
