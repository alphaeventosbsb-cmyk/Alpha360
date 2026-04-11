// ============================================================
// Alpha360 API — Sites Controller
// ============================================================

import { Request, Response } from 'express';
import { successResponse, errorResponse, listResponse } from '../utils/response';
import * as sitesService from '../services/sites.service';

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const sites = await sitesService.listSites(req.user!.companyId);
    res.json(listResponse(sites));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function get(req: Request, res: Response): Promise<void> {
  try {
    const site = await sitesService.getSite(req.params.id, req.user!.companyId);
    if (!site) {
      res.status(404).json(errorResponse('Posto não encontrado.'));
      return;
    }
    res.json(successResponse(site));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const data = { ...req.body, companyId: req.user!.companyId };
    const id = await sitesService.createSite(data);
    res.status(201).json(successResponse({ id }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const success = await sitesService.updateSite(
      req.params.id,
      req.user!.companyId,
      req.body
    );
    if (!success) {
      res.status(404).json(errorResponse('Posto não encontrado.'));
      return;
    }
    res.json(successResponse({ id: req.params.id }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const success = await sitesService.deleteSite(req.params.id, req.user!.companyId);
    if (!success) {
      res.status(404).json(errorResponse('Posto não encontrado.'));
      return;
    }
    res.json(successResponse({ id: req.params.id }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}
