// ============================================================
// Alpha360 API — Sites Service
// CRUD de postos, filtrado por companyId
// ============================================================

import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Site } from '@alpha360/shared';

const COLLECTION = 'sites';

function serializeSite(doc: FirebaseFirestore.DocumentSnapshot): Site {
  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || '',
  } as Site;
}

export async function listSites(companyId: string): Promise<Site[]> {
  let query: FirebaseFirestore.Query = adminDb.collection(COLLECTION);

  if (companyId) {
    query = query.where('companyId', '==', companyId);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(serializeSite);
}

export async function getSite(id: string, companyId: string): Promise<Site | null> {
  const doc = await adminDb.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  if (doc.data()!.companyId !== companyId) return null;
  return serializeSite(doc);
}

export async function createSite(data: Omit<Site, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await adminDb.collection(COLLECTION).add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

export async function updateSite(
  id: string,
  companyId: string,
  data: Partial<Site>
): Promise<boolean> {
  const existing = await getSite(id, companyId);
  if (!existing) return false;

  const { id: _, createdAt: __, ...updateData } = data as any;
  await adminDb.collection(COLLECTION).doc(id).update(updateData);
  return true;
}

export async function deleteSite(id: string, companyId: string): Promise<boolean> {
  const existing = await getSite(id, companyId);
  if (!existing) return false;

  await adminDb.collection(COLLECTION).doc(id).delete();
  return true;
}
