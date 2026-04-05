import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
// We use getReactNativePersistence to ensure login persists across app restarts
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = initializeFirestore(app, {});

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);
