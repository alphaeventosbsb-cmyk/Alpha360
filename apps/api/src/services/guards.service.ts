// ============================================================
// Alpha360 API — Guards Service
// Listagem e sugestão de guardas
// ============================================================

import { adminDb } from '../lib/firebase-admin';
import type { UserData, Job } from '@alpha360/shared';

const COLLECTION = 'users';

function serializeUser(doc: FirebaseFirestore.DocumentSnapshot): UserData {
  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || '',
  } as UserData;
}

export async function listGuards(companyId: string): Promise<UserData[]> {
  const query = adminDb.collection(COLLECTION)
    .where('role', '==', 'guard');

  const snapshot = await query.get();
  // Filtrar por empresa (guard pode ter companyId vazio se for independente)
  return snapshot.docs.map(serializeUser);
}

export async function getGuard(guardId: string): Promise<UserData | null> {
  const doc = await adminDb.collection(COLLECTION).doc(guardId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  if (data.role !== 'guard') return null;
  return serializeUser(doc);
}

/**
 * Busca guarda por nome e CPF (para check-in manual)
 */
export async function searchGuardByNameAndCpf(
  name: string,
  cpf: string
): Promise<UserData | null> {
  const normalizedCpf = cpf.replace(/\D/g, '');
  const snapshot = await adminDb.collection(COLLECTION)
    .where('role', '==', 'guard')
    .get();

  const match = snapshot.docs.find(d => {
    const data = d.data();
    const guardCpf = (data.cpf || '').replace(/\D/g, '');
    const guardName = (data.name || '').toLowerCase().trim();
    const searchName = name.toLowerCase().trim();
    return guardCpf === normalizedCpf && guardName.includes(searchName);
  });

  if (!match) return null;
  return serializeUser(match);
}

/**
 * Sugere guardas para uma escala baseado em distância e rating
 */
export async function suggestGuardsForJob(job: Job): Promise<UserData[]> {
  const snapshot = await adminDb.collection(COLLECTION)
    .where('role', '==', 'guard')
    .where('status', 'in', ['Inativo', 'Offline'])
    .get();

  const guards = snapshot.docs.map(serializeUser);

  if (!job.lat || !job.lng) return guards;

  const withDistance = guards.map(guard => {
    let distance = Infinity;
    if (guard.lat && guard.lng) {
      distance = getDistanceKm(job.lat!, job.lng!, guard.lat, guard.lng);
    }
    return { ...guard, distance };
  });

  // Ordenar por score (rating + performance + proximidade)
  withDistance.sort((a, b) => {
    const scoreA = (a.averageRating || 3) * 0.4 +
      (a.performance || 50) / 100 * 0.3 +
      (1 / ((a as any).distance + 1)) * 0.3;
    const scoreB = (b.averageRating || 3) * 0.4 +
      (b.performance || 50) / 100 * 0.3 +
      (1 / ((b as any).distance + 1)) * 0.3;
    return scoreB - scoreA;
  });

  return withDistance.slice(0, 10);
}

/**
 * Avalia um guarda
 */
export async function rateGuard(data: {
  guardId: string;
  jobId: string;
  assignmentId: string;
  ratedBy: string;
  ratedByName: string;
  rating: number;
  comment?: string;
}): Promise<void> {
  const { FieldValue } = require('firebase-admin/firestore');

  await adminDb.collection('ratings').add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Atualizar média do guarda
  const ratingsSnap = await adminDb.collection('ratings')
    .where('guardId', '==', data.guardId)
    .get();

  const allRatings = ratingsSnap.docs.map(d => d.data().rating as number);
  const avg = allRatings.reduce((s, r) => s + r, 0) / allRatings.length;

  await adminDb.collection(COLLECTION).doc(data.guardId).update({
    averageRating: Math.round(avg * 10) / 10,
    totalRatings: allRatings.length,
  });
}

// Helper
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
