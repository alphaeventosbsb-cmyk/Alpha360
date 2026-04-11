'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';
import { api } from '@/services/api';
import type { UserData } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  companyId: string | null;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  companyId: null,
  refreshUserData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUserData = useCallback(async (firebaseUser: User) => {
    try {
      const data = await api.getMe();
      if (data) {
        const merged = { id: firebaseUser.uid, ...data } as UserData;
        setUserData(merged);
        setCompanyId(merged.companyId || null);
      }
    } catch (error: any) {
      // If user doesn't exist in API yet (first login), create via onboarding
      console.error('Error fetching user data via API:', error.message);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (user) {
      await fetchUserData(user);
    }
  }, [user, fetchUserData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchUserData(firebaseUser);

        // Poll for user data changes every 10 seconds (replaces onSnapshot)
        pollingRef.current = setInterval(() => {
          fetchUserData(firebaseUser);
        }, 10000);
      } else {
        setUserData(null);
        setCompanyId(null);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchUserData]);

  return (
    <AuthContext.Provider value={{ user, userData, loading, companyId, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}
