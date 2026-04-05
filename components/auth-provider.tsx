'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/firebase';
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

  const refreshUserData = async () => {
    if (!user) return;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const data = { id: user.uid, ...userDoc.data() } as UserData;
      setUserData(data);
      setCompanyId(data.companyId || null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Subscribe to user data in real-time for live status updates
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = { id: firebaseUser.uid, ...userSnap.data() } as UserData;
            setUserData(data);
            setCompanyId(data.companyId || null);
          } else {
            // Determine role: admin for specific email, otherwise default
            const isAdmin = firebaseUser.email === 'alphaeventos.bsb@gmail.com';
            const newUserData: UserData = {
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
              role: isAdmin ? 'admin' : 'guard',
              photoUrl: firebaseUser.photoURL || '',
              status: 'Inativo',
              performance: 100,
              rank: 'Júnior',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newUserData);
            setUserData({ id: firebaseUser.uid, ...newUserData });
            setCompanyId(null);
          }

          // Real-time listener for user data changes (status, location, etc.)
          const unsubUser = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = { id: firebaseUser.uid, ...snapshot.data() } as UserData;
              setUserData(data);
              setCompanyId(data.companyId || null);
            }
          });

          // Store cleanup function
          (window as any).__unsubUserData = unsubUser;
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
        setCompanyId(null);
        // Cleanup user data listener
        if ((window as any).__unsubUserData) {
          (window as any).__unsubUserData();
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if ((window as any).__unsubUserData) {
        (window as any).__unsubUserData();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, companyId, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}
