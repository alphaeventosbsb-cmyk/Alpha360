// ============================================================
// Alpha360 API — Assignments Controller
// ============================================================

import { Request, Response } from 'express';
import { successResponse, errorResponse, listResponse } from '../utils/response';
import * as assignmentsService from '../services/assignments.service';
import * as jobsService from '../services/jobs.service';

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const filters: any = { companyId: req.user!.companyId };
    if (req.query.jobId) filters.jobId = req.query.jobId;
    if (req.query.guardId) filters.guardId = req.query.guardId;
    if (req.query.status) filters.status = (req.query.status as string).split(',');

    const assignments = await assignmentsService.listAssignments(filters);
    res.json(listResponse(assignments));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const data = { ...req.body, companyId: req.user!.companyId };
    const id = await assignmentsService.createAssignment(data);
    res.status(201).json(successResponse({ id }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const success = await assignmentsService.updateAssignment(
      req.params.id,
      req.user!.companyId,
      req.body
    );
    if (!success) {
      res.status(404).json(errorResponse('Atribuição não encontrada.'));
      return;
    }
    res.json(successResponse({ id: req.params.id }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function approve(req: Request, res: Response): Promise<void> {
  try {
    const { assignmentRole } = req.body;
    const success = await assignmentsService.approveAssignment(
      req.params.id,
      req.user!.companyId,
      assignmentRole
    );
    if (!success) {
      res.status(404).json(errorResponse('Atribuição não encontrada.'));
      return;
    }
    res.json(successResponse({ message: 'Atribuição aprovada.' }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function reject(req: Request, res: Response): Promise<void> {
  try {
    const success = await assignmentsService.rejectAssignment(
      req.params.id,
      req.user!.companyId
    );
    if (!success) {
      res.status(404).json(errorResponse('Atribuição não encontrada.'));
      return;
    }
    res.json(successResponse({ message: 'Atribuição rejeitada.' }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function requestJob(req: Request, res: Response): Promise<void> {
  try {
    const { jobId } = req.body;
    // Vigilante pode solicitar vagas de qualquer empresa (Marketplace)
    const companyIdForJob = req.user!.role === 'vigilante' ? 'all' : req.user!.companyId;
    const job = await jobsService.getJob(jobId, companyIdForJob);
    if (!job) {
      res.status(404).json(errorResponse('Escala não encontrada.'));
      return;
    }

    const id = await assignmentsService.requestAssignment(job, {
      uid: req.user!.uid,
      displayName: req.user!.name,
    });
    res.status(201).json(successResponse({ id }));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}

export async function inviteGuard(req: Request, res: Response): Promise<void> {
  try {
    const { jobId, guardId, guardName, guardPhoto } = req.body;
    const job = await jobsService.getJob(jobId, req.user!.companyId);
    if (!job) {
      res.status(404).json(errorResponse('Escala não encontrada.'));
      return;
    }

    const id = await assignmentsService.inviteGuardToJob(job, {
      uid: guardId,
      displayName: guardName,
      photoURL: guardPhoto,
    });
    res.status(201).json(successResponse({ id }));
  } catch (error: any) {
    res.status(400).json(errorResponse(error.message));
  }
}

export async function checkin(req: Request, res: Response): Promise<void> {
  try {
    const { qrData, lat, lng, manual, assignmentId, jobId } = req.body;

    if (manual) {
      // Check-in manual
      const result = await assignmentsService.performManualCheckin(
        req.user!.uid,
        assignmentId,
        jobId,
        req.user!.uid
      );
      if (!result.success) {
        res.status(400).json(errorResponse(result.message));
        return;
      }
      res.json(successResponse(result));
    } else {
      // Check-in via QR
      const result = await assignmentsService.performCheckin(
        qrData,
        req.user!.uid,
        lat,
        lng
      );
      if (!result.success) {
        res.status(400).json(errorResponse(result.message));
        return;
      }
      res.json(successResponse(result));
    }
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function checkout(req: Request, res: Response): Promise<void> {
  try {
    const { qrData, lat, lng, manual, assignmentId, jobId, checkinAt } = req.body;

    if (manual) {
      const result = await assignmentsService.performManualCheckout(
        req.user!.uid,
        assignmentId,
        jobId,
        req.user!.uid,
        checkinAt
      );
      if (!result.success) {
        res.status(400).json(errorResponse(result.message));
        return;
      }
      res.json(successResponse(result));
    } else {
      const result = await assignmentsService.performCheckout(
        qrData,
        req.user!.uid,
        lat,
        lng
      );
      if (!result.success) {
        res.status(400).json(errorResponse(result.message));
        return;
      }
      res.json(successResponse(result));
    }
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function guardAssignments(req: Request, res: Response): Promise<void> {
  try {
    const guardId = req.query.guardId as string || req.user!.uid;
    const statuses = req.query.status
      ? (req.query.status as string).split(',')
      : ['approved', 'checked_in', 'checked_out'];

    const results = await assignmentsService.getGuardAssignmentsWithJobs(guardId, statuses);
    res.json(listResponse(results));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}
