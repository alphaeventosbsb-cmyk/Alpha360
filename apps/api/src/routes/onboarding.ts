// ============================================================
// Alpha360 API — Onboarding Routes
// Handles initial user profile setup and company creation
// ============================================================

import { Router, Request, Response } from 'express';
import { adminDb } from '../lib/firebase-admin';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

/**
 * POST /api/onboarding/guard
 * Complete guard registration (onboarding step 2)
 */
router.post('/guard', async (req: Request, res: Response) => {
  try {
    const uid = req.user!.uid;
    const {
      name, phone, cpf, rg, age, height,
      address, neighborhood, city, uf,
      pixKey, pixKeyType,
    } = req.body;

    if (!name || !phone || !cpf) {
      res.status(400).json(errorResponse('Nome, telefone e CPF são obrigatórios.'));
      return;
    }

    const userRef = adminDb.collection('users').doc(uid);
    await userRef.update({
      name,
      role: 'guard',
      phone,
      cpf,
      rg: rg || '',
      age: age || '',
      height: height || '',
      address: address || '',
      neighborhood: neighborhood || '',
      city: city || '',
      uf: uf || '',
      pixKey: pixKey || '',
      pixKeyType: pixKeyType || 'cpf',
      status: 'Inativo',
      rank: 'Júnior',
      performance: 100,
      onboardingComplete: true,
    });

    res.json(successResponse({ uid, role: 'guard' }));
  } catch (error: any) {
    console.error('[Onboarding] Guard error:', error.message);
    res.status(500).json(errorResponse('Erro ao completar cadastro de vigilante.'));
  }
});

/**
 * POST /api/onboarding/client
 * Complete client registration — creates company + updates user
 */
router.post('/client', async (req: Request, res: Response) => {
  try {
    const uid = req.user!.uid;
    const { companyName, cnpj, phone } = req.body;

    if (!companyName || !cnpj || !phone) {
      res.status(400).json(errorResponse('Nome da empresa, CNPJ e telefone são obrigatórios.'));
      return;
    }

    // Create company document
    const companyRef = await adminDb.collection('companies').add({
      name: companyName,
      cnpj: cnpj.replace(/\D/g, ''),
      phone,
      ownerId: uid,
      plan: 'free',
      createdAt: new Date().toISOString(),
    });

    // Update user profile
    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const existingName = userSnap.exists ? userSnap.data()?.name : '';

    await userRef.update({
      name: existingName || companyName,
      role: 'client',
      phone,
      companyId: companyRef.id,
      companyName,
      cnpj: cnpj.replace(/\D/g, ''),
      onboardingComplete: true,
    });

    res.json(successResponse({ uid, role: 'client', companyId: companyRef.id }));
  } catch (error: any) {
    console.error('[Onboarding] Client error:', error.message);
    res.status(500).json(errorResponse('Erro ao completar cadastro de contratante.'));
  }
});

export default router;
