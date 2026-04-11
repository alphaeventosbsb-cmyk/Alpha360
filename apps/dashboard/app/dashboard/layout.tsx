'use client';

import React, { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { RadioComm } from '@/components/RadioComm';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/');
      } else if (userData && !userData.onboardingComplete) {
        router.replace('/onboarding');
      }
    }
  }, [user, userData, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <Loader2 className="size-8 text-[#192c4d] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f6f7f8] relative">
      {/* Sidebar hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-4 md:p-8 pb-24 md:pb-8"
        >
          {children}
        </motion.div>
      </main>
      {/* Bottom navigation on mobile */}
      <MobileBottomNav />
      {/* Radio Communication Widget */}
      <RadioComm />
    </div>
  );
}
