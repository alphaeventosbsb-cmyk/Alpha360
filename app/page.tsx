'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, User, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'guard', // default role for new signups
    acceptTerms: false
  });

  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!isLogin && !formData.acceptTerms) {
        setError('Você precisa aceitar os Termos de Uso e Política de Privacidade para continuar.');
        setLoading(false);
        return;
      }

      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const userRole = userCredential.user.email === 'alphaeventos.bsb@gmail.com' ? 'admin' : formData.role;
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          name: formData.name || userCredential.user.email?.split('@')[0],
          role: userRole,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists, if not create profile
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const userRole = result.user.email === 'alphaeventos.bsb@gmail.com' ? 'admin' : formData.role;
        await setDoc(userRef, {
          email: result.user.email,
          name: result.user.displayName || result.user.email?.split('@')[0],
          role: userRole,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao fazer login com Google.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <Loader2 className="size-8 text-[#192c4d] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-[#192c4d] p-8 text-center text-white">
            <div className="size-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="size-8" />
            </div>
            <h1 className="text-2xl font-bold">Alpha360</h1>
            <p className="text-slate-400 text-sm mt-1">Sistema de Gestão de Segurança</p>
          </div>

          <div className="p-8">
            <div className="flex bg-slate-100 p-1 rounded-lg mb-8">
              <button 
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${isLogin ? 'bg-white text-[#192c4d] shadow-sm' : 'text-slate-500'}`}
              >
                Entrar
              </button>
              <button 
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${!isLogin ? 'bg-white text-[#192c4d] shadow-sm' : 'text-slate-500'}`}
              >
                Criar Conta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, role: 'guard'})}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${formData.role === 'guard' ? 'bg-[#192c4d] text-white border-[#192c4d]' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Sou Vigilante
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, role: 'client'})}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${formData.role === 'client' ? 'bg-[#192c4d] text-white border-[#192c4d]' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Sou Contratante
                    </button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nome</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <input 
                        required
                        type="text"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#192c4d] outline-none transition-all"
                        placeholder="Seu nome completo"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input 
                    required
                    type="email"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#192c4d] outline-none transition-all"
                    placeholder="exemplo@email.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input 
                    required
                    type="password"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#192c4d] outline-none transition-all"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="flex items-start gap-2 pt-2">
                  <input 
                    required
                    type="checkbox" 
                    id="terms" 
                    className="mt-0.5 rounded border-slate-300 text-[#192c4d] focus:ring-[#192c4d]"
                    checked={formData.acceptTerms}
                    onChange={e => setFormData({...formData, acceptTerms: e.target.checked})}
                  />
                  <label htmlFor="terms" className="text-xs text-slate-500 leading-tight">
                    Eu li e aceito os <Link href="/termos-de-uso" target="_blank" className="font-bold text-[#192c4d] hover:underline">Termos de Uso</Link> e a <Link href="/privacidade" target="_blank" className="font-bold text-[#192c4d] hover:underline">Política de Privacidade</Link>.
                  </label>
                </div>
              )}

              {error && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs font-bold text-red-500 text-center"
                >
                  {error}
                </motion.p>
              )}
              <button 
                disabled={loading}
                type="submit"
                className="w-full bg-[#192c4d] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-lg shadow-[#192c4d]/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="size-5 animate-spin" /> : (
                  <>
                    {isLogin ? 'Entrar no Sistema' : 'Criar minha conta'}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-400">Ou continue com</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 transition-colors"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center">
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mb-3">
                <Link href="/termos-de-uso" className="hover:text-[#192c4d] transition-colors">Termos de Uso</Link>
                <Link href="/privacidade" className="hover:text-[#192c4d] transition-colors">Política de Privacidade</Link>
                <Link href="/licenca-ou-direitos" className="hover:text-[#192c4d] transition-colors">Licenciamento</Link>
              </div>
              <p className="text-xs text-slate-400 text-center">
                Acesso restrito a pessoal autorizado. <br/>
                © 2026 Alpha360
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
