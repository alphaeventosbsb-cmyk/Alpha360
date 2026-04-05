'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  Search, 
  Plus, 
  Download, 
  Eye, 
  Pencil, 
  Trash2,
  Loader2,
  Star,
  MapPin
} from 'lucide-react';
import { GuardModal } from '@/components/GuardModal';
import { useLanguage } from '@/components/language-provider';
import { useAuth } from '@/hooks/use-auth';
import { subscribeToGuards, updateUser, createUser } from '@/lib/firestore-service';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import type { UserData } from '@/lib/types';

export default function GuardsPage() {
  const { t } = useLanguage();
  const { user, userData, companyId } = useAuth();
  const [guards, setGuards] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelfModalOpen, setIsSelfModalOpen] = useState(false);
  const [editingGuard, setEditingGuard] = useState<UserData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rankFilter, setRankFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToGuards(companyId || '', (data) => {
      setGuards(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user, companyId]);

  const handleSave = async (formData: any) => {
    try {
      if (editingGuard && editingGuard.id) {
        // Update existing guard
        await updateUser(editingGuard.id, {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          cpf: formData.cpf,
          rg: formData.rg,
          age: formData.age,
          height: formData.height,
          address: formData.address,
          rank: formData.rank,
          status: formData.status,
          performance: formData.performance,
        });
      } else {
        // Create new guard in users collection with role='guard'
        const newId = `guard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await createUser(newId, {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          cpf: formData.cpf,
          rg: formData.rg,
          age: formData.age,
          height: formData.height,
          address: formData.address,
          rank: formData.rank || 'Júnior',
          status: formData.status || 'Inativo',
          performance: formData.performance || 100,
          role: 'guard',
          companyId: companyId || '',
        });
      }
      setIsModalOpen(false);
      setEditingGuard(null);
    } catch (error) {
      console.error('Error saving guard:', error);
      alert('Erro ao salvar. Tente novamente.');
    }
  };

  const handleSelfSave = async (formData: any) => {
    try {
      const newId = `guard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await createUser(newId, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        cpf: formData.cpf,
        rg: formData.rg,
        age: formData.age,
        height: formData.height,
        address: formData.address,
        rank: 'Júnior',
        status: 'Inativo',
        performance: 0,
        role: 'guard',
        companyId: companyId || '',
      });
      setIsSelfModalOpen(false);
    } catch (error) {
      console.error('Error self-registering:', error);
      alert('Erro ao cadastrar. Tente novamente.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('guards.deleteConfirm') || 'Tem certeza que deseja excluir este guarda?')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error) {
      console.error('Error deleting guard:', error);
      alert('Erro ao excluir.');
    }
  };

  const openEditModal = (guard: UserData) => {
    setEditingGuard(guard);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingGuard(null);
    setIsModalOpen(true);
  };

  const openSelfModal = () => {
    setIsSelfModalOpen(true);
  };

  // Filter guards
  const filteredGuards = guards.filter(g => {
    const matchSearch = !searchTerm || 
      g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.phone?.includes(searchTerm);
    const matchStatus = statusFilter === 'all' || g.status === statusFilter;
    const matchRank = rankFilter === 'all' || g.rank === rankFilter;
    return matchSearch && matchStatus && matchRank;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-[#192c4d]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">{t('guards.title') || 'Gestão de Guardas'}</h2>
        <div className="flex gap-2">
        <button 
            onClick={() => {
              const headers = ['Nome','Email','Telefone','CPF','Status','Rank','Desempenho','Rating'];
              const rows = filteredGuards.map(g => [
                g.name || '', g.email || '', g.phone || '', g.cpf || '',
                g.status || '', g.rank || '', String(g.performance ?? 0),
                g.averageRating ? `${g.averageRating} (${g.totalRatings || 0})` : ''
              ]);
              const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
              const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `guardas_export_${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-300 transition-colors"
          >            <Download className="size-4" />
            {t('guards.export') || 'Exportar'}
          </button>
          <button 
            onClick={openSelfModal}
            className="flex items-center gap-2 px-4 py-2 bg-white text-[#192c4d] border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
          >
            {t('guards.selfRegister') || 'Cadastro do Segurança'}
          </button>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#192c4d] text-white rounded-lg text-sm font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-[#192c4d]/20"
          >
            <Plus className="size-4" />
            {t('guards.newGuard') || 'Adicionar Novo Guarda'}
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#192c4d]"
            placeholder="Pesquisar por nome, email ou telefone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-[#192c4d]"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">{t('guards.filterStatus') || 'Todos os Status'}</option>
          <option value="Ativo">{t('guards.statusActive') || 'Ativo'}</option>
          <option value="Inativo">Inativo</option>
          <option value="Em Intervalo">{t('guards.statusBreak') || 'Em Intervalo'}</option>
          <option value="Offline">{t('guards.statusOffline') || 'Offline'}</option>
        </select>
        <select 
          className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-[#192c4d]"
          value={rankFilter}
          onChange={e => setRankFilter(e.target.value)}
        >
          <option value="all">{t('guards.filterRank') || 'Patente/Rank'}</option>
          <option value="Sênior">Sênior</option>
          <option value="Pleno">Pleno</option>
          <option value="Júnior">Júnior</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm min-h-[400px] relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('guards.colName') || 'Foto/Nome'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('guards.colContact') || 'Contato'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">CPF</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">{t('guards.colStatus') || 'Status'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('guards.colPerformance') || 'Desempenho'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('guards.colActions') || 'Ações'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredGuards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="size-8 text-slate-300" />
                      <p className="font-medium">Nenhum guarda encontrado</p>
                      <p className="text-xs text-slate-400">Cadastre um novo guarda ou ajuste os filtros.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGuards.map((guard) => (
                  <tr key={guard.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {guard.photoUrl ? (
                          <Image
                            className="w-10 h-10 rounded-full bg-slate-100 object-cover"
                            src={guard.photoUrl}
                            alt={guard.name}
                            width={40}
                            height={40}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#192c4d] flex items-center justify-center text-white text-sm font-bold">
                            {guard.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-900">{guard.name}</p>
                          <p className="text-xs text-slate-500">{guard.rank || 'Sem rank'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">{guard.phone || '-'}</p>
                      <p className="text-xs text-slate-500">{guard.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{guard.cpf || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        guard.status === 'Ativo' || guard.status === 'On Duty' ? 'bg-green-100 text-green-800' : 
                        guard.status === 'Em Intervalo' ? 'bg-amber-100 text-amber-800' : 
                        guard.status === 'Inativo' ? 'bg-slate-200 text-slate-600' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          guard.status === 'Ativo' || guard.status === 'On Duty' ? 'bg-green-500' : 
                          guard.status === 'Em Intervalo' ? 'bg-amber-500' : 
                          'bg-slate-400'
                        }`}></span>
                        {guard.status || 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#192c4d] rounded-full" style={{ width: `${guard.performance ?? 0}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-slate-700">{guard.performance ?? 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {guard.averageRating ? (
                        <div className="flex items-center gap-1">
                          <Star className="size-3 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-bold">{guard.averageRating}</span>
                          <span className="text-[10px] text-slate-400">({guard.totalRatings || 0})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(guard)}
                          className="p-1.5 text-slate-400 hover:text-[#192c4d] transition-colors" 
                          title="Editar"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(guard.id!)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" 
                          title="Excluir"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <p className="text-xs text-slate-500 font-medium">
            {t('guards.showing') || 'Mostrando'} {filteredGuards.length} de {guards.length} {t('guards.results') || 'guardas registrados'}
          </p>
        </div>
      </div>

      <GuardModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingGuard(null); }}
        onSave={handleSave}
        initialData={editingGuard}
        title={editingGuard ? (t('guards.editGuard') || 'Editar Guarda') : (t('guards.addGuard') || 'Adicionar Novo Guarda')}
        mode="admin"
      />
      <GuardModal 
        isOpen={isSelfModalOpen}
        onClose={() => setIsSelfModalOpen(false)}
        onSave={handleSelfSave}
        title={t('guards.selfRegister') || "Cadastro do Segurança"}
        mode="self"
      />
    </div>
  );
}
