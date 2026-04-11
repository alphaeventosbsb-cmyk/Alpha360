'use client';

import React, { useEffect, useState } from 'react';
import { 
  Mail, 
  Shield, 
  Trash2, 
  Loader2,
  UserCheck,
  Search
} from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';
import type { UserData } from '@/lib/types';

export default function UsersPage() {
  const { t } = useLanguage();
  const { user, userData, companyId } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsers = async () => {
    if (!user) return;
    try {
      const data = await api.listUsers();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    const interval = setInterval(loadUsers, 15000);
    return () => clearInterval(interval);
  }, [user, companyId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('users.deleteConfirm') || 'Tem certeza que deseja excluir este usuário?')) return;
    try {
      await api.updateUser(id, { status: 'Inativo' } as any);
      loadUsers();
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('Erro ao desativar usuário.');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'client': return 'bg-blue-100 text-blue-800';
      case 'guard': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'client': return 'Contratante';
      case 'guard': return 'Vigilante';
      default: return role;
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true;
    return u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           u.email?.toLowerCase().includes(searchTerm.toLowerCase());
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('users.title') || 'Gestão de Usuários'}</h2>
          <p className="text-slate-500 text-sm">{t('users.subtitle') || 'Gerencie as contas que têm acesso ao sistema.'}</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
        <input 
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#192c4d]"
          placeholder="Pesquisar por nome ou email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative min-h-[300px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('users.colUser') || 'Usuário'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('users.colEmail') || 'Email'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('users.colRole') || 'Função'}</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('users.colActions') || 'Ações'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <p className="font-medium">Nenhum usuário encontrado</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.photoUrl ? (
                          <img src={u.photoUrl} alt={u.name} className="size-10 rounded-full object-cover" />
                        ) : (
                          <div className="size-10 rounded-full bg-[#192c4d]/10 flex items-center justify-center">
                            <UserCheck className="size-5 text-[#192c4d]" />
                          </div>
                        )}
                        <span className="text-sm font-bold text-slate-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="size-4 text-slate-400" />
                        {u.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getRoleBadge(u.role)}`}>
                        <Shield className="size-3 mr-1" />
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.id !== user?.uid && (
                        <button 
                          onClick={() => handleDelete(u.id!)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                          title={t('users.deleteUser') || "Excluir Usuário"}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500 font-medium">
            Mostrando {filteredUsers.length} de {users.length} usuários
          </p>
        </div>
      </div>
    </div>
  );
}
