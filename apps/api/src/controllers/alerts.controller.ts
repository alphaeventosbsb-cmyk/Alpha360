// ============================================================
// Alpha360 API — Alerts Controller
// ============================================================

import { Request, Response } from 'express';
import { successResponse, errorResponse, listResponse } from '../utils/response';
import * as alertsService from '../services/alerts.service';

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const filters: any = {};
    if (req.query.guardId) filters.guardId = req.query.guardId;
    if (req.query.contractorId) filters.contractorId = req.query.contractorId;
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string);

    const alerts = await alertsService.listAlerts(req.user!.companyId, filters);
    res.json(listResponse(alerts));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const data = { ...req.body, companyId: req.user!.companyId };
    const id = await alertsService.createAlert(data);
    res.status(201).json(successResponse({ id }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const success = await alertsService.updateAlert(
      req.params.id,
      req.user!.companyId,
      req.body
    );
    if (!success) {
      res.status(404).json(errorResponse('Alerta não encontrado.'));
      return;
    }
    res.json(successResponse({ id: req.params.id }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const success = await alertsService.deleteAlert(
      req.params.id,
      req.user!.companyId
    );
    if (!success) {
      res.status(404).json(errorResponse('Alerta não encontrado.'));
      return;
    }
    res.json(successResponse({ id: req.params.id }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}
