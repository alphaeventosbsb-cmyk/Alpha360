'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Briefcase,
  ScanLine,
  Map as MapIcon,
  AlertTriangle,
  MessageSquare,
  Calendar,
  DollarSign,
  UserCheck,
  CheckCircle2,
  QrCode,
  UserPlus,
  Receipt,
  FileText,
} from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { userData } = useAuth();
  const role = userData?.role || 'admin';

  const guardTabs = [
    { icon: LayoutDashboard, label: 'Início', href: '/dashboard' },
    { icon: Briefcase, label: 'Vagas', href: '/dashboard/vagas' },
    { icon: ScanLine, label: 'Check-in', href: '/dashboard/checkin' },
    { icon: MessageSquare, label: 'Chat', href: '/dashboard/chat' },
    { icon: AlertTriangle, label: 'Ações (SOS)', href: '/dashboard/acoes' },
  ];

  const clientTabs = [
    { icon: LayoutDashboard, label: 'Início', href: '/dashboard' },
    { icon: Briefcase, label: 'Escalas', href: '/dashboard/escala' },
    { icon: CheckCircle2, label: 'Aprovações', href: '/dashboard/aprovacoes' },
    { icon: MapIcon, label: 'Mapa', href: '/dashboard/mapa' },
    { icon: MessageSquare, label: 'Chat', href: '/dashboard/chat' },
  ];

  const adminTabs = [
    { icon: LayoutDashboard, label: 'Início', href: '/dashboard' },
    { icon: Calendar, label: 'Escalas', href: '/dashboard/escala' },
    { icon: MapIcon, label: 'Mapa', href: '/dashboard/mapa' },
    { icon: AlertTriangle, label: 'Alertas', href: '/dashboard/alertas' },
    { icon: MessageSquare, label: 'Chat', href: '/dashboard/chat' },
  ];

  let tabs = adminTabs;
  if (role === 'client') tabs = clientTabs;
  if (role === 'guard') tabs = guardTabs;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors",
                isActive ? "text-[#192c4d]" : "text-slate-400"
              )}
            >
              <tab.icon className={cn("size-5", isActive && (tab.href === '/dashboard/acoes' ? 'text-red-500' : 'text-[#192c4d]'))} />
              <span className={cn(
                "text-[10px] font-medium",
                isActive ? (tab.href === '/dashboard/acoes' ? 'text-red-600 font-bold' : 'text-[#192c4d] font-bold') : "text-slate-400"
              )}>
                {tab.label}
              </span>
              {isActive && (
                <div className={cn("absolute top-0 w-8 h-0.5 rounded-b-full", tab.href === '/dashboard/acoes' ? 'bg-red-500' : 'bg-[#192c4d]')} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
