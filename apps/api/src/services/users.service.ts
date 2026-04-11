// ============================================================
// Alpha360 API — Users Service
// CRUD de usuários, filtrado por companyId
// ============================================================

import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { UserData } from '@alpha360/shared';

const COLLECTION = 'users';

function serializeUser(doc: FirebaseFirestore.DocumentSnapshot): UserData {
  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || '',
  } as UserData;
}

export async function listUsers(companyId: string): Promise<UserData[]> {
  let query: FirebaseFirestore.Query = adminDb.collection(COLLECTION);

  if (companyId) {
    query = query.where('companyId', '==', companyId);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(serializeUser);
}

export async function getUser(uid: string): Promise<UserData | null> {
  const doc = await adminDb.collection(COLLECTION).doc(uid).get();
  if (!doc.exists) return null;
  return serializeUser(doc);
}

export async function updateUser(uid: string, data: Partial<UserData>): Promise<boolean> {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );
  if (Object.keys(cleanData).length === 0) return false;

  // Remove campos que não devem ser atualizados diretamente
  delete (cleanData as any).id;
  delete (cleanData as any).createdAt;

  // Use set com merge: true para evitar erros NOT_FOUND caso o documento ainda não exista perfeitamente criado.
  await adminDb.collection(COLLECTION).doc(uid).set(cleanData, { merge: true });
  return true;
}

export async function createUser(uid: string, data: Omit<UserData, 'id' | 'createdAt'>): Promise<void> {
  await adminDb.collection(COLLECTION).doc(uid).set({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  });
}
