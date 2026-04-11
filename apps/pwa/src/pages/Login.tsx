import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Shield, Loader2, Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Email ou senha incorretos.');
      } else if (err.code === 'auth/user-not-found') {
        setError('Usuário não encontrado.');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #192c4d 100%)',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 40,
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
          marginBottom: 16,
        }}>
          <Shield size={36} color="white" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
          Alpha360
        </h1>
        <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, marginTop: 4 }}>
          App do Vigilante
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} style={{
        width: '100%',
        maxWidth: 380,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        {/* Email */}
        <div style={{ position: 'relative' }}>
          <Mail size={18} style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            color: '#64748b',
          }} />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '16px 16px 16px 48px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              color: 'white',
              fontSize: 15,
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Password */}
        <div style={{ position: 'relative' }}>
          <Lock size={18} style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            color: '#64748b',
          }} />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '16px 48px 16px 48px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              color: 'white',
              fontSize: 15,
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
              color: '#64748b', padding: 0,
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Error */}
        {error && (
          <p style={{
            fontSize: 13,
            color: '#ef4444',
            background: 'rgba(239,68,68,0.1)',
            padding: '10px 14px',
            borderRadius: 10,
            fontWeight: 600,
            textAlign: 'center',
          }}>
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            background: loading ? '#1e40af' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white',
            border: 'none',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            marginTop: 8,
          }}
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : 'Entrar'}
        </button>
      </form>

      <p style={{
        fontSize: 11,
        color: '#475569',
        marginTop: 40,
        textAlign: 'center',
      }}>
        Alpha360 © {new Date().getFullYear()} · Todos os direitos reservados
      </p>
    </div>
  );
}
