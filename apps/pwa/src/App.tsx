import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/pages/Login';
import HomePage from '@/pages/Home';
import VagasPage from '@/pages/Vagas';
import CheckinPage from '@/pages/Checkin';
import SOSPage from '@/pages/SOS';
import ChatPage from '@/pages/Chat';
import PerfilPage from '@/pages/Perfil';
import RadioPage from '@/pages/Radio';
import BottomNav from '@/components/BottomNav';
import { Loader2 } from 'lucide-react';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/vagas" element={<PrivateRoute><VagasPage /></PrivateRoute>} />
        <Route path="/checkin" element={<PrivateRoute><CheckinPage /></PrivateRoute>} />
        <Route path="/sos" element={<PrivateRoute><SOSPage /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/radio" element={<PrivateRoute><RadioPage /></PrivateRoute>} />
        <Route path="/perfil" element={<PrivateRoute><PerfilPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {user && <BottomNav />}
    </>
  );
}
