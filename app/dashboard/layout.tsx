'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <Loader2 className="size-8 text-[#192c4d] animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#f6f7f8]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
