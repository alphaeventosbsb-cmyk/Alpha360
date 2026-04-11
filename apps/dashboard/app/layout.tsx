import type {Metadata, Viewport} from 'next';
import './globals.css';
import { inter, jetbrainsMono } from '@/lib/fonts';
import { AuthProvider } from '@/hooks/use-auth';
import { LanguageProvider } from '@/components/language-provider';

export const metadata: Metadata = {
  title: 'Alpha360 - Gestão de Segurança',
  description: 'Sistema de gestão de segurança privada com GPS, alertas SOS e controle operacional em tempo real.',
  icons: {
    icon: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#192c4d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased">
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
