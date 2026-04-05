'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Worker not supported');
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        console.log('[PWA] Service Worker registered:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour

      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    };

    // Register after page load
    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
      return () => window.removeEventListener('load', registerSW);
    }
  }, []);

  return null;
}

/**
 * Request permission and subscribe to push notifications.
 * Call this from a user-triggered action (e.g., button click).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('[Push] Notifications not supported');
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('[Push] Permission denied');
    return false;
  }

  console.log('[Push] Permission granted');
  return true;
}

/**
 * Send a local notification (for SOS alerts from Firestore listeners).
 * This works even without a push server.
 */
export function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Use service worker to show notification (works in background)
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'alpha360-sos',
          requireInteraction: true,
          ...options,
        } as NotificationOptions);
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        ...options,
      });
    }
  } catch (error) {
    console.error('[Push] Error sending notification:', error);
  }
}
