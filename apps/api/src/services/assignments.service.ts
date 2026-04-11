// ============================================================
// Alpha360 API — Assignments Service
// Check-in, check-out, aprovação, convite — multi-tenant
// ============================================================

import { adminDb } from '../lib/firebase-admin';
import { FieldValue, FieldPath } from 'firebase-admin/firestore';
import type { JobAssignment, Job, QRCodeData } from '@alpha360/shared';

const COLLECTION = 'job_assignments';

function serializeAssignment(doc: FirebaseFirestore.DocumentSnapshot): JobAssignment {
  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || '',
  } as JobAssignment;
}

export async function listAssignments(
  filters: { jobId?: string; guardId?: string; companyId?: string; status?: string[] }
): Promise<JobAssignment[]> {
  // TEMP FIX: Fetch all collection to avoid composite index and IN queries bugs
  let query: FirebaseFirestore.Query = adminDb.collection(COLLECTION);

  if (filters.companyId) {
    query = query.where('companyId', '==', filters.companyId);
  }

  const snapshot = await query.get();
  let assignments = snapshot.docs.map(serializeAssignment);

  // Filter locally
  if (filters.jobId) {
    assignments = assignments.filter(a => a.jobId === filters.jobId);
  }
  if (filters.guardId) {
    assignments = assignments.filter(a => a.guardId === filters.guardId);
  }
  if (filters.status && filters.status.length > 0) {
    assignments = assignments.filter(a => filters.status!.includes(a.status));
  }

  // Sort by createdAt descending locally
  assignments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return assignments;
}

export async function getAssignment(id: string, companyId: string): Promise<JobAssignment | null> {
  const doc = await adminDb.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  if (data.companyId !== companyId) return null;
  return serializeAssignment(doc);
}

export async function createAssignment(
  data: Omit<JobAssignment, 'id' | 'createdAt'>
): Promise<string> {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );
  const docRef = await adminDb.collection(COLLECTION).add({
    ...cleanData,
    createdAt: FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

export async function updateAssignment(
  id: string,
  companyId: string,
  data: Partial<JobAssignment>
): Promise<boolean> {
  const existing = await getAssignment(id, companyId);
  if (!existing) return false;

  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );
  delete (cleanData as any).id;
  delete (cleanData as any).createdAt;

  await adminDb.collection(COLLECTION).doc(id).update(cleanData);
  return true;
}

/**
 * Guarda solicita participar de uma escala
 */
export async function requestAssignment(
  job: Job,
  guard: { uid: string; displayName: string; photoURL?: string }
): Promise<string> {
  // Verificar se já solicitou
  const existingSnap = await adminDb.collection(COLLECTION)
    .where('jobId', '==', job.id)
    .where('guardId', '==', guard.uid)
    .get();

  if (!existingSnap.empty) {
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

  // Criar alerta para contratante
  await adminDb.collection('alerts').add({
    type: 'job_accepted',
    jobId: job.id!,
    guardId: guard.uid,
    guardName: guard.displayName || 'Vigilante',
    companyId: job.companyId,
    contractorId: job.contractorId,
    message: `${guard.displayName} solicitou participação na escala "${job.clientName}"`,
    status: 'active',
    createdAt: FieldValue.serverTimestamp(),
  });

  return assignmentId;
}

/**
 * Contratante convida guarda para uma escala
 */
export async function inviteGuardToJob(
  job: Job,
  guard: { uid: string; displayName: string; photoURL?: string }
): Promise<string> {
  const existingSnap = await adminDb.collection(COLLECTION)
    .where('jobId', '==', job.id)
    .where('guardId', '==', guard.uid)
    .get();

  if (!existingSnap.empty) {
    throw new Error('Este segurança já possui um vínculo com esta escala.');
  }

  return createAssignment({
    jobId: job.id!,
    guardId: guard.uid,
    guardName: guard.displayName || 'Vigilante',
    guardPhoto: guard.photoURL || '',
    companyId: job.companyId,
    status: 'pending_guard_approval',
    dailyRate: job.dailyRate,
    paymentStatus: 'pending',
  });
}

/**
 * Aprovar um assignment (preencher vaga)
 */
export async function approveAssignment(
  assignmentId: string,
  companyId: string,
  assignmentRole: string = 'Segurança'
): Promise<boolean> {
  const assignment = await getAssignment(assignmentId, companyId);
  if (!assignment) return false;

  const batch = adminDb.batch();

  // Atualizar assignment
  batch.update(adminDb.collection(COLLECTION).doc(assignmentId), {
    status: 'approved',
    assignmentRole,
  });

  // Incrementar guardas confirmados no job
  batch.update(adminDb.collection('jobs').doc(assignment.jobId), {
    guardsConfirmed: FieldValue.increment(1),
  });

  await batch.commit();

  // Verificar se todas as vagas foram preenchidas
  const jobDoc = await adminDb.collection('jobs').doc(assignment.jobId).get();
  if (jobDoc.exists) {
    const jobData = jobDoc.data()!;
    if ((jobData.guardsConfirmed || 0) >= jobData.guardsNeeded) {
      await adminDb.collection('jobs').doc(assignment.jobId).update({
        status: 'filled',
      });
    }
  }

  return true;
}

/**
 * Rejeitar um assignment
 */
export async function rejectAssignment(
  assignmentId: string,
  companyId: string
): Promise<boolean> {
  return updateAssignment(assignmentId, companyId, { status: 'rejected' });
}

/**
 * Realizar check-in via QR Code
 */
export async function performCheckin(
  qrData: QRCodeData,
  guardId: string,
  lat?: number,
  lng?: number
): Promise<{ success: boolean; message: string }> {
  try {
    if (qrData.type !== 'checkin') {
      return { success: false, message: 'Este QR Code não é de check-in.' };
    }

    if (new Date(qrData.expiresAt) < new Date()) {
      return { success: false, message: 'QR Code expirado.' };
    }

    const jobDoc = await adminDb.collection('jobs').doc(qrData.jobId).get();
    if (!jobDoc.exists) {
      return { success: false, message: 'Escala não encontrada.' };
    }
    const job = jobDoc.data()!;

    if (job.qrCheckinToken !== qrData.token) {
      return { success: false, message: 'Token inválido.' };
    }

    // Buscar assignment do guarda
    const assignmentSnap = await adminDb.collection(COLLECTION)
      .where('jobId', '==', qrData.jobId)
      .where('guardId', '==', guardId)
      .where('status', '==', 'approved')
      .get();

    if (assignmentSnap.empty) {
      return { success: false, message: 'Você não está autorizado para esta escala.' };
    }

    const assignmentDoc = assignmentSnap.docs[0];
    const now = new Date().toISOString();

    // Atualizar assignment
    await adminDb.collection(COLLECTION).doc(assignmentDoc.id).update({
      status: 'checked_in',
      checkinAt: now,
      checkinLat: lat,
      checkinLng: lng,
    });

    // Atualizar status do job
    await adminDb.collection('jobs').doc(qrData.jobId).update({
      status: 'in_progress',
    });

    // Atualizar status do guarda
    await adminDb.collection('users').doc(guardId).update({
      status: 'Ativo',
      lat,
      lng,
      lastLocationUpdate: now,
    });

    // Criar alerta de check-in
    await adminDb.collection('alerts').add({
      type: 'checkin',
      jobId: qrData.jobId,
      guardId,
      companyId: job.companyId,
      contractorId: job.contractorId,
      lat,
      lng,
      message: `Check-in realizado na escala "${job.clientName}"`,
      status: 'resolved',
      createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true, message: 'Check-in realizado com sucesso!' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Erro ao realizar check-in.' };
  }
}

/**
 * Realizar check-out via QR Code
 */
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

    const jobDoc = await adminDb.collection('jobs').doc(qrData.jobId).get();
    if (!jobDoc.exists) {
      return { success: false, message: 'Escala não encontrada.' };
    }
    const job = jobDoc.data()!;

    if (job.qrCheckoutToken !== qrData.token) {
      return { success: false, message: 'Token inválido.' };
    }

    const assignmentSnap = await adminDb.collection(COLLECTION)
      .where('jobId', '==', qrData.jobId)
      .where('guardId', '==', guardId)
      .where('status', '==', 'checked_in')
      .get();

    if (assignmentSnap.empty) {
      return { success: false, message: 'Você não fez check-in nesta escala.' };
    }

    const assignmentDoc = assignmentSnap.docs[0];
    const assignmentData = assignmentDoc.data();
    const now = new Date().toISOString();

    // Calcular horas trabalhadas
    const checkinTime = new Date(assignmentData.checkinAt);
    const checkoutTime = new Date(now);
    const totalHours = Math.round(
      ((checkoutTime.getTime() - checkinTime.getTime()) / (1000 * 60 * 60)) * 100
    ) / 100;

    await adminDb.collection(COLLECTION).doc(assignmentDoc.id).update({
      status: 'checked_out',
      checkoutAt: now,
      checkoutLat: lat,
      checkoutLng: lng,
      totalHours,
      paymentStatus: 'pending',
    });

    await adminDb.collection('users').doc(guardId).update({
      status: 'Inativo',
    });

    // Verificar se todos os guardas fizeram checkout
    const remainingSnap = await adminDb.collection(COLLECTION)
      .where('jobId', '==', qrData.jobId)
      .where('status', '==', 'checked_in')
      .get();

    if (remainingSnap.empty) {
      await adminDb.collection('jobs').doc(qrData.jobId).update({
        status: 'completed',
      });
    }

    await adminDb.collection('alerts').add({
      type: 'checkout',
      jobId: qrData.jobId,
      guardId,
      companyId: job.companyId,
      contractorId: job.contractorId,
      lat,
      lng,
      message: `Check-out realizado. ${totalHours}h trabalhadas.`,
      status: 'resolved',
      createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true, message: `Check-out realizado! ${totalHours}h trabalhadas.` };
  } catch (error: any) {
    return { success: false, message: error.message || 'Erro ao realizar check-out.' };
  }
}

/**
 * Check-in manual (fallback quando QR falha)
 */
export async function performManualCheckin(
  guardId: string,
  assignmentId: string,
  jobId: string,
  contractorId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const now = new Date().toISOString();

    const guardDoc = await adminDb.collection('users').doc(guardId).get();
    const guardName = guardDoc.exists ? guardDoc.data()!.name : 'Vigilante';

    await adminDb.collection(COLLECTION).doc(assignmentId).update({
      status: 'checked_in',
      checkinAt: now,
    });

    await adminDb.collection('jobs').doc(jobId).update({ status: 'in_progress' });
    await adminDb.collection('users').doc(guardId).update({ status: 'Ativo' });

    const jobDoc = await adminDb.collection('jobs').doc(jobId).get();
    const jobData = jobDoc.data();

    await adminDb.collection('alerts').add({
      type: 'checkin',
      jobId,
      guardId,
      guardName,
      companyId: jobData?.companyId || '',
      contractorId,
      message: `Check-in MANUAL realizado por contratante para "${guardName}" na escala "${jobData?.clientName || 'Escala'}"`,
      status: 'resolved',
      createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true, message: `Check-in manual de ${guardName} realizado com sucesso!` };
  } catch (error: any) {
    return { success: false, message: error.message || 'Erro ao realizar check-in manual.' };
  }
}

/**
 * Check-out manual
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

    const guardDoc = await adminDb.collection('users').doc(guardId).get();
    const guardName = guardDoc.exists ? guardDoc.data()!.name : 'Vigilante';

    const checkinTime = new Date(checkinAt);
    const checkoutTime = new Date(now);
    const totalHours = Math.round(
      ((checkoutTime.getTime() - checkinTime.getTime()) / (1000 * 60 * 60)) * 100
    ) / 100;

    await adminDb.collection(COLLECTION).doc(assignmentId).update({
      status: 'checked_out',
      checkoutAt: now,
      totalHours,
      paymentStatus: 'pending',
    });

    await adminDb.collection('users').doc(guardId).update({ status: 'Inativo' });

    const remainingSnap = await adminDb.collection(COLLECTION)
      .where('jobId', '==', jobId)
      .where('status', '==', 'checked_in')
      .get();

    if (remainingSnap.empty) {
      await adminDb.collection('jobs').doc(jobId).update({ status: 'completed' });
    }

    const jobDoc = await adminDb.collection('jobs').doc(jobId).get();
    const jobData = jobDoc.data();

    await adminDb.collection('alerts').add({
      type: 'checkout',
      jobId,
      guardId,
      guardName,
      companyId: jobData?.companyId || '',
      contractorId,
      message: `Check-out MANUAL por contratante para "${guardName}". ${totalHours}h trabalhadas.`,
      status: 'resolved',
      createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true, message: `Check-out manual de ${guardName} realizado! ${totalHours}h trabalhadas.` };
  } catch (error: any) {
    return { success: false, message: error.message || 'Erro ao realizar check-out manual.' };
  }
}

/**
 * Buscar assignments de um guarda com dados do job
 */
export async function getGuardAssignmentsWithJobs(
  guardId: string,
  statuses: string[]
): Promise<{ assignment: JobAssignment; job: Job }[]> {
  // TEMP FIX for local testing
  const snap = await adminDb.collection(COLLECTION)
    .where('guardId', '==', guardId)
    .get();

  const filteredDocs = snap.docs.filter(doc => statuses.includes(doc.data().status));

  const results = await Promise.all(
    filteredDocs.map(async (d) => {
      const assignment = serializeAssignment(d);
      try {
        const jobDoc = await adminDb.collection('jobs').doc(assignment.jobId).get();
        if (!jobDoc.exists) return null;
        const jobData = jobDoc.data()!;
        const job = {
          id: jobDoc.id,
          ...jobData,
          createdAt: jobData.createdAt?.toDate?.()?.toISOString?.() || jobData.createdAt || '',
        } as Job;
        return { assignment, job };
      } catch {
        return null;
      }
    })
  );

  return results.filter((r): r is { assignment: JobAssignment; job: Job } => r !== null);
}
