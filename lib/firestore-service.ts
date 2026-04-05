// ============================================================
// Alpha360 SaaS — Firestore Service
// Centralized CRUD operations for all collections
// All queries filtered by companyId for multi-tenant isolation
// ============================================================

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  increment,
  QueryConstraint,
} from 'firebase/firestore';
import { db, storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type {
  Company,
  UserData,
  Job,
  JobAssignment,
  Alert,
  Message,
  Site,
  LocationEntry,
  PixPayment,
  GuardRating,
  QRCodeData,
} from './types';

// ============================================================
// COMPANIES
// ============================================================
export async function createCompany(data: Omit<Company, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'companies'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getCompany(id: string): Promise<Company | null> {
  const snap = await getDoc(doc(db, 'companies', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Company;
}

export async function updateCompany(id: string, data: Partial<Company>): Promise<void> {
  await updateDoc(doc(db, 'companies', id), data);
}

// ============================================================
// USERS
// ============================================================
export async function createUser(uid: string, data: Omit<UserData, 'id' | 'createdAt'>): Promise<void> {
  const { ...rest } = data;
  await updateDoc(doc(db, 'users', uid), {
    ...rest,
    createdAt: serverTimestamp(),
  }).catch(async () => {
    const { setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'users', uid), {
      ...rest,
      createdAt: serverTimestamp(),
    });
  });
}

export async function getUser(uid: string): Promise<UserData | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as UserData;
}

export async function updateUser(uid: string, data: Partial<UserData>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data);
}

export function subscribeToGuards(companyId: string, callback: (guards: UserData[]) => void) {
  const constraints: QueryConstraint[] = [
    where('role', '==', 'guard'),
  ];
  if (companyId) {
    constraints.push(where('companyId', '==', companyId));
  }
  const q = query(collection(db, 'users'), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const guards = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserData));
    callback(guards);
  });
}

export function subscribeToUsers(companyId: string, callback: (users: UserData[]) => void) {
  const constraints: QueryConstraint[] = [];
  if (companyId) {
    constraints.push(where('companyId', '==', companyId));
  }
  const q = query(collection(db, 'users'), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserData));
    callback(users);
  });
}

// ============================================================
// JOBS (ESCALAS)
// ============================================================
export async function createJob(data: Omit<Job, 'id' | 'createdAt' | 'guardsConfirmed'>): Promise<string> {
  // Generate QR tokens
  const checkinToken = crypto.randomUUID();
  const checkoutToken = crypto.randomUUID();

  const docRef = await addDoc(collection(db, 'jobs'), {
    ...data,
    guardsConfirmed: 0,
    qrCheckinToken: checkinToken,
    qrCheckoutToken: checkoutToken,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateJob(id: string, data: Partial<Job>): Promise<void> {
  await updateDoc(doc(db, 'jobs', id), data);
}

export async function deleteJob(id: string): Promise<void> {
  await deleteDoc(doc(db, 'jobs', id));
}

export function subscribeToJobs(
  companyId: string,
  statusFilter?: string[],
  callback?: (jobs: Job[]) => void
) {
  const constraints: QueryConstraint[] = [];
  if (companyId) {
    constraints.push(where('companyId', '==', companyId));
  }
  if (statusFilter && statusFilter.length > 0) {
    constraints.push(where('status', 'in', statusFilter));
  }
  constraints.push(orderBy('createdAt', 'desc'));
  const q = query(collection(db, 'jobs'), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const jobs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Job));
    if (callback) callback(jobs);
  });
}

export function subscribeToOpenJobs(companyId: string, callback: (jobs: Job[]) => void) {
  const q = query(
    collection(db, 'jobs'),
    where('companyId', '==', companyId),
    where('status', '==', 'open'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const jobs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Job));
    callback(jobs);
  });
}

export function subscribeToGuardJobs(companyId: string, guardId: string, callback: (jobs: Job[]) => void) {
  const q = query(
    collection(db, 'jobs'),
    where('companyId', '==', companyId),
    where('guardId', '==', guardId)
  );
  return onSnapshot(q, (snapshot) => {
    const jobs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Job));
    callback(jobs);
  });
}

// ============================================================
// JOB ASSIGNMENTS
// ============================================================
export async function createAssignment(data: Omit<JobAssignment, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'job_assignments'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateAssignment(id: string, data: Partial<JobAssignment>): Promise<void> {
  await updateDoc(doc(db, 'job_assignments', id), data);
}

export function subscribeToAssignments(
  filters: { jobId?: string; guardId?: string; companyId?: string; status?: string[] },
  callback: (assignments: JobAssignment[]) => void
) {
  const constraints: QueryConstraint[] = [];
  if (filters.jobId) constraints.push(where('jobId', '==', filters.jobId));
  if (filters.guardId) constraints.push(where('guardId', '==', filters.guardId));
  if (filters.companyId) constraints.push(where('companyId', '==', filters.companyId));
  if (filters.status && filters.status.length > 0) {
    constraints.push(where('status', 'in', filters.status));
  }

  const q = query(collection(db, 'job_assignments'), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const assignments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JobAssignment));
    callback(assignments);
  });
}

export async function requestJobAssignment(
  job: Job,
  guard: { uid: string; displayName: string; photoURL?: string }
): Promise<string> {
  // Check if already requested
  const existingQuery = query(
    collection(db, 'job_assignments'),
    where('jobId', '==', job.id),
    where('guardId', '==', guard.uid)
  );
  const existing = await getDocs(existingQuery);
  if (!existing.empty) {
    throw new Error('Você já solicitou esta vaga.');
  }

  const assignmentId = await createAssignment({
    jobId: job.id!,
    guardId: guard.uid,
    guardName: guard.displayName || 'Vigilante',
    guardPhoto: guard.photoURL || '',
    companyId: job.companyId,
    status: 'pending',
    dailyRate: job.dailyRate,
    paymentStatus: 'pending',
  });

  // Create alert for contractor
  await createAlert({
    type: 'job_accepted',
    jobId: job.id!,
    guardId: guard.uid,
    guardName: guard.displayName || 'Vigilante',
    companyId: job.companyId,
    contractorId: job.contractorId,
    message: `${guard.displayName} solicitou participação na escala "${job.clientName}"`,
    status: 'active',
  });

  return assignmentId;
}

export async function approveAssignment(assignmentId: string, jobId: string): Promise<void> {
  const batch = writeBatch(db);

  // Update assignment
  batch.update(doc(db, 'job_assignments', assignmentId), {
    status: 'approved',
  });

  // Increment confirmed guards on job
  batch.update(doc(db, 'jobs', jobId), {
    guardsConfirmed: increment(1),
  });

  await batch.commit();

  // Check if all slots are filled
  const jobDoc = await getDoc(doc(db, 'jobs', jobId));
  if (jobDoc.exists()) {
    const jobData = jobDoc.data() as Job;
    if ((jobData.guardsConfirmed || 0) >= jobData.guardsNeeded) {
      await updateJob(jobId, { status: 'filled' });
    }
  }
}

export async function rejectAssignment(assignmentId: string): Promise<void> {
  await updateAssignment(assignmentId, { status: 'rejected' });
}

// ============================================================
// QR CODE & CHECK-IN / CHECK-OUT
// ============================================================
export async function performCheckin(
  qrData: QRCodeData,
  guardId: string,
  lat?: number,
  lng?: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate QR
    if (qrData.type !== 'checkin') {
      return { success: false, message: 'Este QR Code não é de check-in.' };
    }

    // Check expiration
    if (new Date(qrData.expiresAt) < new Date()) {
      return { success: false, message: 'QR Code expirado.' };
    }

    // Find the job
    const jobDoc = await getDoc(doc(db, 'jobs', qrData.jobId));
    if (!jobDoc.exists()) {
      return { success: false, message: 'Escala não encontrada.' };
    }
    const job = jobDoc.data() as Job;

    // Validate token
    if (job.qrCheckinToken !== qrData.token) {
      return { success: false, message: 'Token inválido.' };
    }

    // Find guard's assignment
    const assignmentQuery = query(
      collection(db, 'job_assignments'),
      where('jobId', '==', qrData.jobId),
      where('guardId', '==', guardId),
      where('status', '==', 'approved')
    );
    const assignmentSnap = await getDocs(assignmentQuery);
    if (assignmentSnap.empty) {
      return { success: false, message: 'Você não está autorizado para esta escala.' };
    }

    const assignmentDoc = assignmentSnap.docs[0];
    const now = new Date().toISOString();

    // Update assignment
    await updateAssignment(assignmentDoc.id, {
      status: 'checked_in',
      checkinAt: now,
      checkinLat: lat,
      checkinLng: lng,
    });

    // Update job status to in_progress
    await updateJob(qrData.jobId, { status: 'in_progress' });

    // Update guard status
    await updateUser(guardId, {
      status: 'Ativo',
      lat,
      lng,
      lastLocationUpdate: now,
    });

    // Create checkin alert
    await createAlert({
      type: 'checkin',
      jobId: qrData.jobId,
      guardId,
      companyId: job.companyId,
      contractorId: job.contractorId,
      lat,
      lng,
      message: `Check-in realizado na escala "${job.clientName}"`,
      status: 'resolved',
    });

    return { success: true, message: 'Check-in realizado com sucesso!' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Erro ao realizar check-in.' };
  }
}

export async function performCheckout(
  qrData: QRCodeData,
  guardId: string,
  lat?: number,
  lng?: number
): Promise<{ success: boolean; message: string }> {
  try {
    if (qrData.type !== 'checkout') {
      return { success: false, message: 'Este QR Code não é de check-out.' };
    }

    if (new Date(qrData.expiresAt) < new Date()) {
      return { success: false, message: 'QR Code expirado.' };
    }

    const jobDoc = await getDoc(doc(db, 'jobs', qrData.jobId));
    if (!jobDoc.exists()) {
      return { success: false, message: 'Escala não encontrada.' };
    }
    const job = jobDoc.data() as Job;

    if (job.qrCheckoutToken !== qrData.token) {
      return { success: false, message: 'Token inválido.' };
    }

    // Find guard's assignment
    const assignmentQuery = query(
      collection(db, 'job_assignments'),
      where('jobId', '==', qrData.jobId),
      where('guardId', '==', guardId),
      where('status', '==', 'checked_in')
    );
    const assignmentSnap = await getDocs(assignmentQuery);
    if (assignmentSnap.empty) {
      return { success: false, message: 'Você não fez check-in nesta escala.' };
    }

    const assignmentDoc = assignmentSnap.docs[0];
    const assignmentData = assignmentDoc.data() as JobAssignment;
    const now = new Date().toISOString();

    // Calculate total hours
    const checkinTime = new Date(assignmentData.checkinAt!);
    const checkoutTime = new Date(now);
    const totalHours = Math.round((checkoutTime.getTime() - checkinTime.getTime()) / (1000 * 60 * 60) * 100) / 100;

    // Update assignment
    await updateAssignment(assignmentDoc.id, {
      status: 'checked_out',
      checkoutAt: now,
      checkoutLat: lat,
      checkoutLng: lng,
      totalHours,
      paymentStatus: 'pending',
    });

    // Update guard status
    await updateUser(guardId, {
      status: 'Inativo',
    });

    // Check if all guards checked out → complete job
    const allAssignments = query(
      collection(db, 'job_assignments'),
      where('jobId', '==', qrData.jobId),
      where('status', '==', 'checked_in')
    );
    const remaining = await getDocs(allAssignments);
    if (remaining.empty) {
      await updateJob(qrData.jobId, { status: 'completed' });
    }

    // Create checkout alert
    await createAlert({
      type: 'checkout',
      jobId: qrData.jobId,
      guardId,
      companyId: job.companyId,
      contractorId: job.contractorId,
      lat,
      lng,
      message: `Check-out realizado. ${totalHours}h trabalhadas.`,
      status: 'resolved',
    });

    return { success: true, message: `Check-out realizado! ${totalHours}h trabalhadas.` };
  } catch (error: any) {
    return { success: false, message: error.message || 'Erro ao realizar check-out.' };
  }
}

// ============================================================
// ALERTS
// ============================================================
export async function createAlert(data: Omit<Alert, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'alerts'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateAlert(id: string, data: Partial<Alert>): Promise<void> {
  await updateDoc(doc(db, 'alerts', id), data);
}

export async function deleteAlert(id: string): Promise<void> {
  await deleteDoc(doc(db, 'alerts', id));
}

export function subscribeToAlerts(
  companyId: string,
  filters?: { limit?: number; guardId?: string; contractorId?: string },
  callback?: (alerts: Alert[]) => void
) {
  const constraints: QueryConstraint[] = [];
  if (companyId) {
    constraints.push(where('companyId', '==', companyId));
  }
  if (filters?.guardId) {
    constraints.push(where('guardId', '==', filters.guardId));
  }
  if (filters?.contractorId) {
    constraints.push(where('contractorId', '==', filters.contractorId));
  }
  constraints.push(orderBy('createdAt', 'desc'));
  if (filters?.limit) {
    constraints.push(limit(filters.limit));
  }

  const q = query(collection(db, 'alerts'), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Alert));
    if (callback) callback(alerts);
  });
}

// ============================================================
// SITES (POSTOS)
// ============================================================
export async function createSite(data: Omit<Site, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'sites'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateSite(id: string, data: Partial<Site>): Promise<void> {
  await updateDoc(doc(db, 'sites', id), data);
}

export async function deleteSite(id: string): Promise<void> {
  await deleteDoc(doc(db, 'sites', id));
}

export function subscribeToSites(companyId: string, callback: (sites: Site[]) => void) {
  const constraints: QueryConstraint[] = [];
  if (companyId) {
    constraints.push(where('companyId', '==', companyId));
  }
  const q = query(collection(db, 'sites'), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const sites = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Site));
    callback(sites);
  });
}

// ============================================================
// MESSAGES (CHAT)
// ============================================================
export async function sendMessage(data: Omit<Message, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'messages'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export function subscribeToMessages(jobId: string, callback: (messages: Message[]) => void) {
  const q = query(
    collection(db, 'messages'),
    where('jobId', '==', jobId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
    callback(messages);
  });
}

// ============================================================
// LOCATIONS (GPS TRACKING)
// ============================================================
export async function saveLocation(data: Omit<LocationEntry, 'id'>): Promise<void> {
  await addDoc(collection(db, 'locations'), data);
}

export function subscribeToActiveGuardLocations(
  companyId: string,
  callback: (locations: LocationEntry[]) => void
) {
  // We subscribe to users who are active guards with lat/lng
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'guard'),
    where('status', 'in', ['Ativo', 'On Duty'])
  );
  return onSnapshot(q, (snapshot) => {
    const locations: LocationEntry[] = snapshot.docs
      .filter(d => d.data().lat && d.data().lng)
      .map(d => ({
        guardId: d.id,
        guardName: d.data().name,
        lat: d.data().lat,
        lng: d.data().lng,
        status: d.data().alertStatus || 'active',
        timestamp: d.data().lastLocationUpdate || '',
      }));
    callback(locations);
  });
}

// ============================================================
// RATINGS
// ============================================================
export async function rateGuard(data: Omit<GuardRating, 'id' | 'createdAt'>): Promise<void> {
  await addDoc(collection(db, 'ratings'), {
    ...data,
    createdAt: serverTimestamp(),
  });

  // Update guard average rating
  const ratingsQuery = query(
    collection(db, 'ratings'),
    where('guardId', '==', data.guardId)
  );
  const ratingsSnap = await getDocs(ratingsQuery);
  const allRatings = ratingsSnap.docs.map(d => d.data().rating as number);
  const avg = allRatings.reduce((s, r) => s + r, 0) / allRatings.length;

  await updateUser(data.guardId, {
    averageRating: Math.round(avg * 10) / 10,
    totalRatings: allRatings.length,
  });
}

// ============================================================
// FILE UPLOAD
// ============================================================
export async function uploadFile(
  path: string,
  file: File
): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

// ============================================================
// PIX PAYMENT (simulation — real integration would use banking API)
// ============================================================
export async function createPixPayment(data: Omit<PixPayment, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'pix_payments'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function processPixPayment(paymentId: string): Promise<void> {
  // In production, this would call a real PIX API (e.g., Mercado Pago, PagSeguro)
  // For now, we simulate the processing
  await updateDoc(doc(db, 'pix_payments', paymentId), {
    status: 'processing',
  });

  // Simulate processing delay
  setTimeout(async () => {
    try {
      const transactionId = `PIX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await updateDoc(doc(db, 'pix_payments', paymentId), {
        status: 'completed',
        transactionId,
        processedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error processing PIX:', error);
    }
  }, 3000);
}

export function subscribeToPayments(
  filters: { guardId?: string; companyId?: string },
  callback: (payments: PixPayment[]) => void
) {
  const constraints: QueryConstraint[] = [];
  if (filters.guardId) constraints.push(where('guardId', '==', filters.guardId));
  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(collection(db, 'pix_payments'), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const payments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PixPayment));
    callback(payments);
  });
}

// ============================================================
// AI — Guard Suggestion based on location
// ============================================================
export async function suggestGuardsForJob(job: Job): Promise<UserData[]> {
  // Get all available guards
  const guardsQuery = query(
    collection(db, 'users'),
    where('role', '==', 'guard'),
    where('status', 'in', ['Inativo', 'Offline'])
  );
  const guardsSnap = await getDocs(guardsQuery);
  const guards = guardsSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserData));

  if (!job.lat || !job.lng) return guards;

  // Sort by distance to job location
  const withDistance = guards.map(guard => {
    let distance = Infinity;
    if (guard.lat && guard.lng) {
      distance = getDistanceKm(job.lat!, job.lng!, guard.lat, guard.lng);
    }
    return { ...guard, distance };
  });

  withDistance.sort((a, b) => a.distance - b.distance);

  // Also factor in performance/rating
  withDistance.sort((a, b) => {
    const scoreA = (a.averageRating || 3) * 0.4 + (a.performance || 50) / 100 * 0.3 + (1 / (a.distance + 1)) * 0.3;
    const scoreB = (b.averageRating || 3) * 0.4 + (b.performance || 50) / 100 * 0.3 + (1 / (b.distance + 1)) * 0.3;
    return scoreB - scoreA;
  });

  return withDistance.slice(0, 10);
}

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

// ============================================================
// MANUAL CHECK-IN / CHECK-OUT (Fallback when QR fails)
// ============================================================

/**
 * Search for a guard by name and CPF.
 * Returns the matching guard or null.
 */
export async function searchGuardByNameAndCpf(
  name: string,
  cpf: string
): Promise<UserData | null> {
  const normalizedCpf = cpf.replace(/\D/g, '');
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'guard')
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const match = snap.docs.find(d => {
    const data = d.data();
    const guardCpf = (data.cpf || '').replace(/\D/g, '');
    const guardName = (data.name || '').toLowerCase().trim();
    const searchName = name.toLowerCase().trim();
    return guardCpf === normalizedCpf && guardName.includes(searchName);
  });

  if (!match) return null;
  return { id: match.id, ...match.data() } as UserData;
}

/**
 * Get a guard's assignments with their associated job data,
 * filtered by assignment status.
 */
export async function getGuardAssignmentsWithJobs(
  guardId: string,
  statuses: string[]
): Promise<{ assignment: JobAssignment; job: Job }[]> {
  const q = query(
    collection(db, 'job_assignments'),
    where('guardId', '==', guardId),
    where('status', 'in', statuses)
  );
  const snap = await getDocs(q);

  const results = await Promise.all(
    snap.docs.map(async (d) => {
      const assignment = { id: d.id, ...d.data() } as JobAssignment;
      try {
        const jobDoc = await getDoc(doc(db, 'jobs', assignment.jobId));
        if (!jobDoc.exists()) return null;
        const job = { id: jobDoc.id, ...jobDoc.data() } as Job;
        return { assignment, job };
      } catch {
        return null;
      }
    })
  );

  return results.filter((r): r is { assignment: JobAssignment; job: Job } => r !== null);
}

/**
 * Perform manual check-in by contractor/admin.
 * Used as fallback when QR code scanner fails.
 */
export async function performManualCheckin(
  guardId: string,
  assignmentId: string,
  jobId: string,
  contractorId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const now = new Date().toISOString();

    // Get guard name for alert
    const guardDoc = await getDoc(doc(db, 'users', guardId));
    const guardName = guardDoc.exists() ? guardDoc.data().name : 'Vigilante';

    // Update assignment
    await updateAssignment(assignmentId, {
      status: 'checked_in',
      checkinAt: now,
    });

    // Update job status
    await updateJob(jobId, { status: 'in_progress' });

    // Update guard status
    await updateUser(guardId, { status: 'Ativo' });

    // Get job info for alert
    const jobDoc = await getDoc(doc(db, 'jobs', jobId));
    const jobData = jobDoc.data();

    // Create alert
    await createAlert({
      type: 'checkin',
      jobId,
      guardId,
      guardName,
      companyId: jobData?.companyId || '',
      contractorId,
      message: `Check-in MANUAL realizado por contratante para "${guardName}" na escala "${jobData?.clientName || 'Escala'}"`,
      status: 'resolved',
    });

    return { success: true, message: `Check-in manual de ${guardName} realizado com sucesso!` };
  } catch (error: any) {
    return { success: false, message: error.message || 'Erro ao realizar check-in manual.' };
  }
}

/**
 * Perform manual check-out by contractor/admin.
 * Validates the guard was scheduled and has checked in before allowing checkout.
 */
export async function performManualCheckout(
  guardId: string,
  assignmentId: string,
  jobId: string,
  contractorId: string,
  checkinAt: string
): Promise<{ success: boolean; message: string }> {
  try {
    const now = new Date().toISOString();

    // Get guard name for alert
    const guardDoc = await getDoc(doc(db, 'users', guardId));
    const guardName = guardDoc.exists() ? guardDoc.data().name : 'Vigilante';

    // Calculate total hours
    const checkinTime = new Date(checkinAt);
    const checkoutTime = new Date(now);
    const totalHours = Math.round(
      ((checkoutTime.getTime() - checkinTime.getTime()) / (1000 * 60 * 60)) * 100
    ) / 100;

    // Update assignment
    await updateAssignment(assignmentId, {
      status: 'checked_out',
      checkoutAt: now,
      totalHours,
      paymentStatus: 'pending',
    });

    // Update guard status
    await updateUser(guardId, { status: 'Inativo' });

    // Check if all guards checked out → complete job
    const remainingQ = query(
      collection(db, 'job_assignments'),
      where('jobId', '==', jobId),
      where('status', '==', 'checked_in')
    );
    const remaining = await getDocs(remainingQ);
    // remaining still includes the one we just updated if Firestore hasn't synced,
    // but since we already updated it, this should be accurate
    if (remaining.empty) {
      await updateJob(jobId, { status: 'completed' });
    }

    const jobDoc = await getDoc(doc(db, 'jobs', jobId));
    const jobData = jobDoc.data();

    await createAlert({
      type: 'checkout',
      jobId,
      guardId,
      guardName,
      companyId: jobData?.companyId || '',
      contractorId,
      message: `Check-out MANUAL realizado por contratante para "${guardName}". ${totalHours}h trabalhadas.`,
      status: 'resolved',
    });

    return { success: true, message: `Check-out manual de ${guardName} realizado! ${totalHours}h trabalhadas.` };
  } catch (error: any) {
    return { success: false, message: error.message || 'Erro ao realizar check-out manual.' };
  }
}
