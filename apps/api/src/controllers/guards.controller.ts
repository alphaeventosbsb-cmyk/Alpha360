// ============================================================
// Alpha360 API — Guards Controller
// ============================================================

import { Request, Response } from 'express';
import { successResponse, errorResponse, listResponse } from '../utils/response';
import * as guardsService from '../services/guards.service';
import * as jobsService from '../services/jobs.service';

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const guards = await guardsService.listGuards(req.user!.companyId);
    res.json(listResponse(guards));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function get(req: Request, res: Response): Promise<void> {
  try {
    const guard = await guardsService.getGuard(req.params.id);
    if (!guard) {
      res.status(404).json(errorResponse('Guarda não encontrado.'));
      return;
    }
    res.json(successResponse(guard));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function suggest(req: Request, res: Response): Promise<void> {
  try {
    const { jobId } = req.body;
    if (!jobId) {
      res.status(400).json(errorResponse('jobId é obrigatório.'));
      return;
    }

    const job = await jobsService.getJob(jobId, req.user!.companyId);
    if (!job) {
      res.status(404).json(errorResponse('Escala não encontrada.'));
      return;
    }

    const guards = await guardsService.suggestGuardsForJob(job);
    res.json(listResponse(guards));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function search(req: Request, res: Response): Promise<void> {
  try {
    const { name, cpf } = req.query;
    if (!name || !cpf) {
      res.status(400).json(errorResponse('name e cpf são obrigatórios.'));
      return;
    }

    const guard = await guardsService.searchGuardByNameAndCpf(
      name as string,
      cpf as string
    );

    if (!guard) {
      res.status(404).json(errorResponse('Guarda não encontrado.'));
      return;
    }

    res.json(successResponse(guard));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function rate(req: Request, res: Response): Promise<void> {
  try {
    await guardsService.rateGuard({
      ...req.body,
      ratedBy: req.user!.uid,
      ratedByName: req.user!.name,
    });
    res.json(successResponse({ message: 'Avaliação registrada.' }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}
