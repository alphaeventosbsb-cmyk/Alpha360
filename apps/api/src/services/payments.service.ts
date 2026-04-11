// ============================================================
// Alpha360 API — Payments Service
// Pagamentos PIX (simulação)
// ============================================================

import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { PixPayment } from '@alpha360/shared';

const COLLECTION = 'pix_payments';

function serializePayment(doc: FirebaseFirestore.DocumentSnapshot): PixPayment {
  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || '',
  } as PixPayment;
}

export async function listPayments(
  filters: { guardId?: string; companyId?: string }
): Promise<PixPayment[]> {
  let query: FirebaseFirestore.Query = adminDb.collection(COLLECTION);

  const snapshot = await query.get();
  let payments = snapshot.docs.map(serializePayment);

  // Filter locally
  if (filters.guardId) {
    payments = payments.filter(p => p.guardId === filters.guardId);
  }

  // Sort locally
  payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return payments;
}

export async function createPayment(
  data: Omit<PixPayment, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await adminDb.collection(COLLECTION).add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

export async function processPayment(paymentId: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(paymentId).update({
    status: 'processing',
  });

  // Simular processamento PIX (em produção, chamar API bancária real)
  const transactionId = `PIX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await adminDb.collection(COLLECTION).doc(paymentId).update({
    status: 'completed',
    transactionId,
    processedAt: new Date().toISOString(),
  });
}
