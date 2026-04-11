// ============================================================
// Alpha360 API — Payments Controller
// ============================================================

import { Request, Response } from 'express';
import { successResponse, errorResponse, listResponse } from '../utils/response';
import * as paymentsService from '../services/payments.service';

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const filters: any = {};
    if (req.query.guardId) filters.guardId = req.query.guardId;
    filters.companyId = req.user!.companyId;

    const payments = await paymentsService.listPayments(filters);
    res.json(listResponse(payments));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const id = await paymentsService.createPayment(req.body);
    res.status(201).json(successResponse({ id }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function process(req: Request, res: Response): Promise<void> {
  try {
    await paymentsService.processPayment(req.params.id);
    res.json(successResponse({ message: 'Pagamento processado.' }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}
