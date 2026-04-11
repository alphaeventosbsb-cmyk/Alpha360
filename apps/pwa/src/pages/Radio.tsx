import React from 'react';
import { Shield } from 'lucide-react';
import { ZelloRadio } from '../components/ZelloRadio';

export default function RadioPage() {
  return (
    <div style={{ padding: '20px 16px 200px', maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#020617' }}>
      <div className="safe-top" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8, color: '#f8fafc' }}>
          <Shield size={22} color="#f59e0b" /> Rádio Tático PTT
        </h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
          Comunicação de voz em tempo real.
        </p>
      </div>

      <ZelloRadio />
    </div>
  );
}
