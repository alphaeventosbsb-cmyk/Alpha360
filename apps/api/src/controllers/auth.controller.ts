// ============================================================
// Alpha360 API — Auth Controller
// ============================================================

import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import * as usersService from '../services/users.service';
import { adminDb } from '../lib/firebase-admin';

/**
 * GET /api/auth/me — Retorna dados do usuário logado
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const user = await usersService.getUser(req.user!.uid);
    if (!user) {
      res.status(404).json(errorResponse('Usuário não encontrado.'));
      return;
    }
    res.json(successResponse(user));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

/**
 * POST /api/auth/register — Cria perfil do usuário no Firestore
 * Chamado após createUserWithEmailAndPassword ou Google Sign-In
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email;
    const { name } = req.body;

    // Check if user already exists
    const existing = await usersService.getUser(uid);
    if (existing) {
      res.json(successResponse(existing));
      return;
    }

    // Create new user profile
    const isAdmin = email === 'alphaeventos.bsb@gmail.com';
    const userData = {
      email,
      name: name || email?.split('@')[0] || '',
      role: isAdmin ? 'admin' : 'user',
      onboardingComplete: isAdmin,
      status: 'Inativo',
      performance: 100,
      rank: 'Júnior',
      createdAt: new Date().toISOString(),
    };

    await adminDb.collection('users').doc(uid).set(userData);

    res.json(successResponse({ id: uid, ...userData }));
  } catch (error: any) {
    console.error('[Auth] Register error:', error.message);
    res.status(500).json(errorResponse('Erro ao criar perfil.'));
  }
}
