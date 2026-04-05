import type {Metadata, Viewport} from 'next';
import './globals.css';
import { inter, jetbrainsMono } from '@/lib/fonts';
import { AuthProvider } from '@/hooks/use-auth';
import { LanguageProvider } from '@/components/language-provider';
import { ServiceWorkerRegistration } from '@/components/sw-register';

export const metadata: Metadata = {
  title: 'Alpha360 - Gestão de Segurança',
  description: 'Sistema de gestão de segurança privada com GPS, alertas SOS e controle operacional em tempo real.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Alpha360',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
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
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Alpha360" />
      </head>
      <body suppressHydrationWarning className="font-sans antialiased">
        <ServiceWorkerRegistration />
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
