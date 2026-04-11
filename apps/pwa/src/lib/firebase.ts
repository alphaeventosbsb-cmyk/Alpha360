import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD6H-B0CuXW6HAZpEJULgRNNe2gEQwzCk8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'alpha360-d08b1.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'alpha360-d08b1',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'alpha360-d08b1.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '321632412981',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:321632412981:web:32daa571534764dfabd87c',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-CKY6D5BJFJ',
};

import { getStorage } from 'firebase/storage';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
