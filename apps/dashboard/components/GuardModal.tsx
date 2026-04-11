'use client';

import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  title: string;
  mode?: 'admin' | 'self';
}

export function GuardModal({ isOpen, onClose, onSave, initialData, title, mode = 'admin' }: GuardModalProps) {
  const [saving, setSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    rank: 'Júnior',
    phone: '',
    email: '',
    age: '',
    cpf: '',
    rg: '',
    address: '',
    height: '',
    status: 'Inativo',
    performance: 100,
    pixKey: '',
    pixKeyType: 'cpf',
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        rank: initialData.rank || 'Júnior',
        phone: initialData.phone || '',
        email: initialData.email || '',
        age: initialData.age || '',
        cpf: initialData.cpf || '',
        rg: initialData.rg || '',
        address: initialData.address || '',
        height: initialData.height || '',
        status: initialData.status || 'Inativo',
        performance: initialData.performance ?? 100,
        pixKey: initialData.pixKey || '',
        pixKeyType: initialData.pixKeyType || 'cpf',
      });
    } else {
      setFormData({
        name: '',
        rank: 'Júnior',
        phone: '',
        email: '',
        age: '',
        cpf: '',
        rg: '',
        address: '',
        height: '',
        status: 'Inativo',
        performance: 100,
        pixKey: '',
        pixKeyType: 'cpf',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving guard:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#192c4d] text-white">
            <h3 className="text-lg font-bold">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="size-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                <input 
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                  placeholder="Nome do vigilante"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              {mode === 'admin' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Patente/Rank</label>
                    <select 
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                      value={formData.rank}
                      onChange={e => setFormData({...formData, rank: e.target.value})}
                    >
                      <option>Júnior</option>
                      <option>Pleno</option>
                      <option>Sênior</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                    <select 
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                    >
                      <option>Ativo</option>
                      <option>Inativo</option>
                      <option>Em Intervalo</option>
                      <option>Offline</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                <input 
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                  placeholder="(11) 99999-0000"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                <input 
                  required
                  type="email"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">CPF</label>
                <input 
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={e => setFormData({...formData, cpf: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">RG</label>
                <input 
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                  placeholder="00.000.000-0"
                  value={formData.rg}
                  onChange={e => setFormData({...formData, rg: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Idade</label>
                <input 
                  required
                  type="number"
                  min="16"
                  max="70"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                  placeholder="25"
                  value={formData.age}
                  onChange={e => setFormData({...formData, age: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Altura (cm)</label>
                <input 
                  required
                  type="number"
                  min="120"
                  max="230"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                  placeholder="175"
                  value={formData.height}
                  onChange={e => setFormData({...formData, height: e.target.value})}
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Endereço</label>
                <input 
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                  placeholder="Endereço completo"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>

              {mode === 'admin' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Desempenho (%)</label>
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                      value={isNaN(formData.performance) ? '' : formData.performance}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setFormData({...formData, performance: isNaN(val) ? 0 : val});
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Tipo Chave PIX</label>
                    <select 
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                      value={formData.pixKeyType}
                      onChange={e => setFormData({...formData, pixKeyType: e.target.value})}
                    >
                      <option value="cpf">CPF</option>
                      <option value="email">Email</option>
                      <option value="phone">Telefone</option>
                      <option value="random">Chave Aleatória</option>
                    </select>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Chave PIX</label>
                    <input 
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#192c4d] outline-none"
                      placeholder="Chave PIX para pagamento"
                      value={formData.pixKey}
                      onChange={e => setFormData({...formData, pixKey: e.target.value})}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-[#192c4d] text-white rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-[#192c4d]/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : 'Salvar'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
