// ============================================================
// Alpha360 API — Firebase Admin SDK Initialization
// ============================================================

import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Tentar carregar service account key de várias fontes
let credential: admin.credential.Credential;

const keyPath = path.resolve(__dirname, '../../serviceAccountKey.json');
if (fs.existsSync(keyPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
  credential = admin.credential.cert(serviceAccount);
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  credential = admin.credential.applicationDefault();
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Para Cloud Run — service account como variável de ambiente
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  credential = admin.credential.cert(serviceAccount);
} else {
  console.error(
    '⚠️  Nenhuma credencial Firebase encontrada!\n' +
    '   Opções:\n' +
    '   1. Coloque serviceAccountKey.json em apps/api/\n' +
    '   2. Defina GOOGLE_APPLICATION_CREDENTIALS\n' +
    '   3. Defina FIREBASE_SERVICE_ACCOUNT (JSON string)\n'
  );
  // Tenta Application Default Credentials como fallback
  credential = admin.credential.applicationDefault();
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential,
    projectId: 'alpha360-d08b1',
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
export default admin;
