// ============================================================
// Alpha360 API — Auth Middleware
// Valida JWT do Firebase Auth e injeta dados do usuário no req
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { adminAuth, adminDb } from '../lib/firebase-admin';
import { errorResponse } from '../utils/response';

// Extender o tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        companyId: string;
        role: string;
        email: string;
        name: string;
      };
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(
        errorResponse('Token de autenticação não fornecido. Envie: Authorization: Bearer <token>')
      );
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    // 2. Validar o token com Firebase Auth
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error: any) {
      res.status(401).json(
        errorResponse('Token inválido ou expirado. Faça login novamente.')
      );
      return;
    }

    const uid = decodedToken.uid;

    // 3. Buscar dados do usuário no Firestore
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      res.status(401).json(
        errorResponse('Usuário não encontrado no sistema.')
      );
      return;
    }

    const userData = userDoc.data()!;

    // 4. Injetar dados do usuário na request
    req.user = {
      uid,
      companyId: userData.companyId || '',
      role: userData.role || 'user',
      email: userData.email || decodedToken.email || '',
      name: userData.name || '',
    };

    next();
  } catch (error: any) {
    console.error('[AuthMiddleware] Erro:', error.message);
    res.status(500).json(
      errorResponse('Erro interno na autenticação.')
    );
  }
}

/**
 * Middleware que exige companyId no usuário.
 * Aplicar DEPOIS do authMiddleware.
 */
export async function requireCompany(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user?.companyId) {
    // Admins podem não ter companyId fixo — eles podem ter acesso global
    if (req.user?.role === 'admin') {
      next();
      return;
    }
    res.status(403).json(
      errorResponse('Usuário não está vinculado a nenhuma empresa.')
    );
    return;
  }
  next();
}
