import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, ScanLine, MessageSquare, User, Radio } from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/vagas', icon: Briefcase, label: 'Vagas' },
  { path: '/checkin', icon: ScanLine, label: 'Check-in' },
  { path: '/radio', icon: Radio, label: 'PTT' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/perfil', icon: User, label: 'Perfil' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/login') return null;

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'stretch',
      zIndex: 50,
      paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
    }}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '10px 0 6px',
              transition: 'all 0.2s',
              color: isActive ? '#3b82f6' : '#64748b',
              position: 'relative',
            }}
          >
            {isActive && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 24,
                height: 3,
                borderRadius: 99,
                background: '#3b82f6',
              }} />
            )}
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 800 : 500,
              letterSpacing: isActive ? '0.02em' : 0,
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
