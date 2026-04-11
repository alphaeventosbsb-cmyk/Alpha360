// ============================================================
// Alpha360 API — Messages Controller & Routes
// ============================================================

import { Router, Request, Response } from 'express';
import { adminDb as db } from '../lib/firebase-admin';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

// List messages for a specific job
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.query;
    if (!jobId) {
      res.status(400).json(errorResponse('jobId is required', 400));
      return;
    }

    const messagesSnapshot = await db.collection('messages')
      .where('companyId', '==', req.user!.companyId)
      .where('jobId', '==', jobId)
      .get();

    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    res.json(successResponse(messages));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// Create a message
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, senderId, senderName, text, senderRole, imageUrl } = req.body;
    
    if (!jobId || !text) {
      res.status(400).json(errorResponse('jobId and text are required', 400));
      return;
    }

    const docRef = await db.collection('messages').add({
      companyId: req.user!.companyId,
      jobId,
      senderId: senderId || req.user!.uid,
      senderName: senderName || 'Desconhecido',
      senderRole: senderRole || 'admin',
      text,
      imageUrl: imageUrl || null,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(successResponse({ id: docRef.id }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

export default router;
