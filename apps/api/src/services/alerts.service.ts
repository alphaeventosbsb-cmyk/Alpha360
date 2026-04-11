// ============================================================
// Alpha360 API — Alerts Service
// CRUD de alertas, filtrado por companyId
// ============================================================

import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Alert } from '@alpha360/shared';

const COLLECTION = 'alerts';

function serializeAlert(doc: FirebaseFirestore.DocumentSnapshot): Alert {
  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || '',
  } as Alert;
}

export async function listAlerts(
  companyId: string,
  filters?: { guardId?: string; contractorId?: string; limit?: number }
): Promise<Alert[]> {
  // TEMP FIX: Fetch only by companyId to avoid composite index requirements
  let query: FirebaseFirestore.Query = adminDb.collection(COLLECTION);

  if (companyId) {
    query = query.where('companyId', '==', companyId);
  }

  const snapshot = await query.get();
  let alerts = snapshot.docs.map(serializeAlert);

  // Filter locally
  if (filters?.guardId) {
    alerts = alerts.filter(a => a.guardId === filters.guardId);
  }
  if (filters?.contractorId) {
    alerts = alerts.filter(a => a.contractorId === filters.contractorId);
  }

  // Sort locally
  alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (filters?.limit) {
    alerts = alerts.slice(0, filters.limit);
  }

  return alerts;
}

export async function createAlert(
  data: Omit<Alert, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await adminDb.collection(COLLECTION).add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

export async function updateAlert(
  id: string,
  companyId: string,
  data: Partial<Alert>
): Promise<boolean> {
  const doc = await adminDb.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return false;

  const alertData = doc.data()!;
  if (alertData.companyId !== companyId) return false;

  const { id: _, createdAt: __, ...updateData } = data as any;
  await adminDb.collection(COLLECTION).doc(id).update(updateData);
  return true;
}

export async function deleteAlert(id: string, companyId: string): Promise<boolean> {
  const doc = await adminDb.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return false;
  if (doc.data()!.companyId !== companyId) return false;

  await adminDb.collection(COLLECTION).doc(id).delete();
  return true;
}
