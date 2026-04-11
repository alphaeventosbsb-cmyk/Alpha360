'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Shield, 
  LayoutDashboard, 
  Briefcase,
  Map as MapIcon, 
  BadgeCheck, 
  UserCheck,
  FileText, 
  Calendar, 
  Radio, 
  Receipt,
  LogOut,
  DollarSign,
  QrCode,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ScanLine,
  ChevronLeft,
  Menu,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useLanguage } from '@/components/language-provider';

export function Sidebar() {
  const pathname = usePathname();
  const { user, userData } = useAuth();
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);

  const role = userData?.role || 'admin';

  const adminItems = [
    { icon: LayoutDashboard, label: t('sidebar.dashboard'), href: '/dashboard' },
    { icon: Briefcase, label: t('sidebar.clients') || 'Clientes', href: '/dashboard/clientes' },
    { icon: MapIcon, label: t('sidebar.locations') || 'Postos', href: '/dashboard/postos' },
    { icon: BadgeCheck, label: t('sidebar.guards') || 'Guardas', href: '/dashboard/guardas' },
    { icon: Calendar, label: t('sidebar.schedules') || 'Escalas', href: '/dashboard/escala' },
    { icon: CheckCircle2, label: 'Aprovações', href: '/dashboard/aprovacoes' },
    { icon: QrCode, label: 'QR Codes', href: '/dashboard/qrcodes' },
    { icon: UserPlus, label: 'Check-in Manual', href: '/dashboard/checkin-manual' },
    { icon: MapIcon, label: 'Mapa ao Vivo', href: '/dashboard/mapa' },
    { icon: MessageSquare, label: 'Chat', href: '/dashboard/chat' },
    { icon: AlertTriangle, label: 'Alertas', href: '/dashboard/alertas' },
    { icon: Radio, label: 'Central de Despacho', href: '/dashboard/despacho' },
    { icon: Receipt, label: t('sidebar.billing') || 'Faturamento', href: '/dashboard/faturamento' },
    { icon: FileText, label: t('sidebar.reports') || 'Relatórios', href: '/dashboard/relatorios' },
    { icon: UserCheck, label: t('sidebar.users') || 'Usuários', href: '/dashboard/usuarios' },
  ];

  const clientItems = [
    { icon: LayoutDashboard, label: t('sidebar.dashboard'), href: '/dashboard' },
    { icon: BadgeCheck, label: 'Seguranças', href: '/dashboard/guardas' },
    { icon: Briefcase, label: 'Minhas Escalas', href: '/dashboard/escala' },
    { icon: CheckCircle2, label: 'Aprovações', href: '/dashboard/aprovacoes' },
    { icon: QrCode, label: 'QR Codes', href: '/dashboard/qrcodes' },
    { icon: UserPlus, label: 'Check-in Manual', href: '/dashboard/checkin-manual' },
    { icon: MapIcon, label: 'Mapa ao Vivo', href: '/dashboard/mapa' },
    { icon: MessageSquare, label: 'Chat', href: '/dashboard/chat' },
    { icon: AlertTriangle, label: 'Alertas', href: '/dashboard/alertas' },
    { icon: Receipt, label: 'Financeiro', href: '/dashboard/faturamento' },
    { icon: FileText, label: 'Relatórios', href: '/dashboard/relatorios' },
    { icon: Briefcase, label: 'Config. Escalas', href: '/dashboard/minhas-escalas' },
  ];

  const guardItems = [
    { icon: LayoutDashboard, label: t('sidebar.dashboard'), href: '/dashboard' },
    { icon: Briefcase, label: 'Vagas Disponíveis', href: '/dashboard/vagas' },
    { icon: ScanLine, label: 'Check-in / Check-out', href: '/dashboard/checkin' },
    { icon: MapIcon, label: 'Mapa', href: '/dashboard/mapa' },
    { icon: AlertTriangle, label: 'Ações / SOS', href: '/dashboard/acoes' },
    { icon: MessageSquare, label: 'Chat', href: '/dashboard/chat' },
    { icon: Calendar, label: 'Meu Histórico', href: '/dashboard/historico' },
    { icon: DollarSign, label: 'Meus Ganhos', href: '/dashboard/faturamento' },
    { icon: UserCheck, label: 'Meu Perfil', href: '/dashboard/perfil' },
  ];

  let menuItems = adminItems;
  if (role === 'client') menuItems = clientItems;
  if (role === 'guard') menuItems = guardItems;

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <aside className={cn(
      "bg-[#192c4d] text-white flex flex-col shrink-0 border-r border-white/10 h-screen sticky top-0 transition-all duration-300",
      collapsed ? "w-[72px]" : "w-64"
    )}>
      <div className={cn("p-4 flex items-center gap-3", collapsed && "justify-center")}>
        <div className="size-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
          <Shield className="text-white size-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <h1 className="text-lg font-bold leading-tight">Alpha360</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              {role === 'admin' ? 'Admin' : role === 'client' ? 'Contratante' : 'Vigilante'}
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn("p-1.5 hover:bg-white/10 rounded-lg transition-colors ml-auto", collapsed && "ml-0")}
        >
          {collapsed ? <Menu className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-2 flex flex-col gap-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                isActive 
                  ? "bg-white/15 text-white shadow-sm" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
                collapsed && "justify-center px-2"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-full" />
              )}
              <item.icon className={cn("size-[18px] shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
              {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn("p-3 mt-auto border-t border-white/10 space-y-1", collapsed && "px-2")}>
        <button 
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="size-[18px] shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="size-9 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
              {(userData?.name || user?.displayName || 'U').substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold truncate">{user?.displayName || userData?.name || 'Usuário'}</span>
              <span className="text-[10px] text-slate-400 truncate">{user?.email}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
