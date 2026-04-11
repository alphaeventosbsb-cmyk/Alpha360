// ============================================================
// Alpha360 API — Jobs Controller
// ============================================================

import { Request, Response } from 'express';
import { successResponse, errorResponse, listResponse } from '../utils/response';
import * as jobsService from '../services/jobs.service';

export async function list(req: Request, res: Response): Promise<void> {
  try {
    // Vigilante vê TUDO (Marketplace Global). Contratante/Admin vê apenas sua empresa.
    const companyId = req.user!.role === 'vigilante' ? 'all' : req.user!.companyId;
    const statusFilter = req.query.status
      ? (req.query.status as string).split(',')
      : undefined;

    const jobs = await jobsService.listJobs(companyId, statusFilter);
    res.json(listResponse(jobs));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function get(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.role === 'vigilante' ? 'all' : req.user!.companyId;
    const job = await jobsService.getJob(req.params.id, companyId);
    if (!job) {
      res.status(404).json(errorResponse('Escala não encontrada.'));
      return;
    }
    res.json(successResponse(job));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const data = {
      ...req.body,
      companyId: req.user!.companyId,
      contractorId: req.user!.uid,
    };
    const id = await jobsService.createJob(data);
    res.status(201).json(successResponse({ id }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const success = await jobsService.updateJob(
      req.params.id,
      req.user!.companyId,
      req.body
    );
    if (!success) {
      res.status(404).json(errorResponse('Escala não encontrada ou não pertence à sua empresa.'));
      return;
    }
    res.json(successResponse({ id: req.params.id }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const success = await jobsService.deleteJob(req.params.id, req.user!.companyId);
    if (!success) {
      res.status(404).json(errorResponse('Escala não encontrada ou não pertence à sua empresa.'));
      return;
    }
    res.json(successResponse({ id: req.params.id }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}
