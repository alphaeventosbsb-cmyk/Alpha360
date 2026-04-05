'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  Search, 
  Plus, 
  MapPin, 
  Users, 
  Pencil, 
  Filter,
  Activity,
  Trash2,
  Loader2,
  Building2
} from 'lucide-react';
import { SiteModal } from '@/components/SiteModal';
import { useLanguage } from '@/components/language-provider';
import { useAuth } from '@/hooks/use-auth';
import { subscribeToSites, createSite, updateSite, deleteSite } from '@/lib/firestore-service';
import type { Site } from '@/lib/types';

export default function SitesPage() {
  const { t } = useLanguage();
  const { user, companyId } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToSites(companyId || '', (data) => {
      setSites(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user, companyId]);

  const handleSave = async (formData: any) => {
    try {
      if (editingSite && editingSite.id) {
        await updateSite(editingSite.id, {
          name: formData.name,
          address: formData.address,
          client: formData.client,
          guardsAssigned: formData.guardsAssigned || 0,
          status: formData.status,
          lastAudit: formData.lastAudit,
          lat: formData.lat || undefined,
          lng: formData.lng || undefined,
          geofenceRadius: formData.geofenceRadius || 200,
        });
      } else {
        await createSite({
          name: formData.name,
          address: formData.address,
          client: formData.client,
          guardsAssigned: formData.guardsAssigned || 0,
          status: formData.status || 'Ativo',
          lastAudit: formData.lastAudit || new Date().toLocaleDateString('pt-BR'),
          companyId: companyId || '',
          lat: formData.lat || undefined,
          lng: formData.lng || undefined,
          geofenceRadius: formData.geofenceRadius || 200,
        });
      }
      setIsModalOpen(false);
      setEditingSite(null);
    } catch (error) {
      console.error('Error saving site:', error);
      alert('Erro ao salvar posto. Tente novamente.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('sites.deleteConfirm') || 'Tem certeza que deseja excluir este posto?')) return;
    try {
      await deleteSite(id);
    } catch (error) {
      console.error('Error deleting site:', error);
      alert('Erro ao excluir posto.');
    }
  };

  const openEditModal = (site: Site) => {
    setEditingSite(site);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingSite(null);
    setIsModalOpen(true);
  };

  const filteredSites = sites.filter(s => {
    const matchSearch = !searchTerm ||
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.client?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeSites = sites.filter(s => s.status === 'Ativo').length;
  const pendingSites = sites.filter(s => s.status !== 'Ativo').length;
  const totalGuards = sites.reduce((acc, s) => acc + (s.guardsAssigned || 0), 0);

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
        <h2 className="text-2xl font-bold tracking-tight">{t('sites.title') || 'Gestão de Postos'}</h2>
        <button 
          onClick={openAddModal}
          className="bg-[#192c4d] hover:bg-[#192c4d]/90 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm shadow-[#192c4d]/20"
        >
          <Plus className="size-4" /> {t('sites.newSite') || 'Novo Posto'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#192c4d] outline-none" 
            placeholder={t('sites.search') || "Pesquisar por nome, endereço ou cliente..."} 
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium cursor-pointer hover:bg-slate-50 outline-none focus:ring-2 focus:ring-[#192c4d]"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">{t('sites.all') || 'Todos'}</option>
            <option value="Ativo">Ativo</option>
            <option value="Manutenção">Manutenção</option>
            <option value="Inativo">Inativo</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative min-h-[300px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('sites.colName') || 'Nome do Posto'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('sites.colAddress') || 'Endereço'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('sites.colGuards') || 'Vigilantes'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('sites.colClient') || 'Cliente'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">{t('sites.colStatus') || 'Status'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('sites.colActions') || 'Ações'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="size-8 text-slate-300" />
                      <p className="font-medium">Nenhum posto encontrado</p>
                      <p className="text-xs text-slate-400">Cadastre um novo posto para começar.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSites.map((site) => (
                  <tr key={site.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded bg-[#192c4d]/10 flex items-center justify-center">
                          <Building2 className="size-5 text-[#192c4d]" />
                        </div>
                        <div className="font-semibold text-sm">{site.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-500">{site.address}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {site.guardsAssigned || 0}
                        </div>
                        <span className="text-xs text-slate-400 italic">
                          {(site.guardsAssigned || 0) === 0 ? 'Sem guardas' : `${site.guardsAssigned} vigilante(s)`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{site.client || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        site.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 
                        site.status === 'Manutenção' ? 'bg-amber-100 text-amber-700' : 
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {site.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(site)}
                          className="p-1.5 text-slate-400 hover:text-[#192c4d] transition-colors"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(site.id!)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
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
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            {t('sites.showing') || 'Mostrando'} <span className="text-slate-900">{filteredSites.length}</span> de {sites.length} {t('sites.results') || 'resultados'}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MapPin className="size-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('sites.activeSites') || 'Postos Ativos'}</p>
            <h4 className="text-xl font-black">{activeSites}</h4>
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <Activity className="size-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('sites.pendingSites') || 'Pendentes'}</p>
            <h4 className="text-xl font-black">{pendingSites}</h4>
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-full bg-[#192c4d]/10 text-[#192c4d] flex items-center justify-center">
            <Users className="size-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('sites.totalCoverage') || 'Cobertura Total'}</p>
            <h4 className="text-xl font-black">{totalGuards} {t('sites.guardsLabel') || 'Vigilantes'}</h4>
          </div>
        </div>
      </div>

      <SiteModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingSite(null); }}
        onSave={handleSave}
        initialData={editingSite}
        title={editingSite ? (t('sites.editSite') || 'Editar Posto') : (t('sites.addSite') || 'Adicionar Novo Posto')}
      />
    </div>
  );
}
