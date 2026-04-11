// ============================================================
// Alpha360 API — Jobs Service
// CRUD de escalas, sempre filtrado por companyId
// ============================================================

import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Job } from '@alpha360/shared';

const COLLECTION = 'jobs';

export async function listJobs(companyId?: string, statusFilter?: string[]): Promise<Job[]> {
  // TEMP FIX: Fetch only by companyId to avoid composite index requirements
  let query: FirebaseFirestore.Query = adminDb.collection(COLLECTION);

  if (companyId && companyId !== 'all') {
    query = query.where('companyId', '==', companyId);
  }

  const snapshot = await query.get();
  let jobs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString?.() || doc.data().createdAt || '',
  })) as Job[];

  // Filter horizontally locally
  if (statusFilter && statusFilter.length > 0) {
    jobs = jobs.filter(job => statusFilter.includes(job.status));
  }

  // Sort locally
  jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return jobs;
}

export async function getJob(jobId: string, companyId?: string): Promise<Job | null> {
  const doc = await adminDb.collection(COLLECTION).doc(jobId).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  // Verificar que pertence à empresa (se companyId for específico)
  if (companyId && companyId !== 'all' && data.companyId !== companyId) return null;

  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || '',
  } as Job;
}

export async function createJob(data: Omit<Job, 'id' | 'createdAt' | 'guardsConfirmed'>): Promise<string> {
  const checkinToken = require('crypto').randomUUID();
  const checkoutToken = require('crypto').randomUUID();

  const docRef = await adminDb.collection(COLLECTION).add({
    ...data,
    guardsConfirmed: 0,
    qrCheckinToken: checkinToken,
    qrCheckoutToken: checkoutToken,
    createdAt: FieldValue.serverTimestamp(),
  });

  return docRef.id;
}

export async function updateJob(jobId: string, companyId: string, data: Partial<Job>): Promise<boolean> {
  // Verificar propriedade
  const existing = await getJob(jobId, companyId);
  if (!existing) return false;

  const { id, createdAt, ...updateData } = data as any;
  await adminDb.collection(COLLECTION).doc(jobId).update(updateData);
  return true;
}

export async function deleteJob(jobId: string, companyId: string): Promise<boolean> {
  const existing = await getJob(jobId, companyId);
  if (!existing) return false;

  await adminDb.collection(COLLECTION).doc(jobId).delete();
  return true;
}

/**
 * Lista escalas abertas (para marketplace de guardas)
 */
export async function listOpenJobs(companyId: string): Promise<Job[]> {
  return listJobs(companyId, ['open']);
}
