// ============================================================
// Alpha360 API — Users Controller
// ============================================================

import { Request, Response } from 'express';
import { successResponse, errorResponse, listResponse } from '../utils/response';
import * as usersService from '../services/users.service';

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const users = await usersService.listUsers(req.user!.companyId);
    res.json(listResponse(users));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function get(req: Request, res: Response): Promise<void> {
  try {
    const user = await usersService.getUser(req.params.id);
    if (!user) {
      res.status(404).json(errorResponse('Usuário não encontrado.'));
      return;
    }
    // Verificar se pertence à mesma empresa (exceto admin)
    if (req.user!.role !== 'admin' && user.companyId !== req.user!.companyId) {
      res.status(403).json(errorResponse('Acesso negado.'));
      return;
    }
    res.json(successResponse(user));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    // Só pode atualizar a si mesmo ou se for admin
    if (req.params.id !== req.user!.uid && req.user!.role !== 'admin') {
      res.status(403).json(errorResponse('Você só pode editar seu próprio perfil.'));
      return;
    }

    const currentUser = await usersService.getUser(req.params.id);
    if (currentUser?.profileCompleted && req.user!.role !== 'admin') {
      res.status(403).json(errorResponse('O perfil já foi preenchido e não pode ser editado. Use a função de resetar.'));
      return;
    }

    // Ao salvar, tranca o perfil
    const dataToSave = { ...req.body, profileCompleted: true };

    const success = await usersService.updateUser(req.params.id, dataToSave);
    if (!success) {
      res.status(404).json(errorResponse('Usuário não encontrado ou dados inválidos.'));
      return;
    }
    res.json(successResponse({ id: req.params.id }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}

export async function resetProfile(req: Request, res: Response): Promise<void> {
  try {
    if (req.params.id !== req.user!.uid && req.user!.role !== 'admin') {
      res.status(403).json(errorResponse('Você só pode resetar seu próprio perfil.'));
      return;
    }
    
    // Apaga os dados do formulário e destranca
    const resetData = {
      profileCompleted: false,
      birthDate: null,
      birthPlace: null,
      gender: null,
      fatherName: null,
      motherName: null,
      addressComplete: null,
      cep: null,
      rg: null,
      rgIssuer: null,
      rgIssueDate: null,
      cpf: null,
      pis: null,
      pisIssueDate: null,
      ctps: null,
      ctpsSeries: null,
      ctpsIssueDate: null,
      voterTitle: null,
      voterZone: null,
      voterSection: null,
      militaryCertificate: null,
      susCard: null,
      inssBenefits: null,
      govBenefits: null,
      weight: null,
      height: null,
      courseRegistry: null,
      photoUrl: null,
      courseCertificateUrl: null,
      addressProofUrl: null,
      resumeUrl: null,
      criminalRecordUrl: null
    };

    const success = await usersService.updateUser(req.params.id, resetData);
    if (!success) {
      res.status(404).json(errorResponse('Usuário não encontrado.'));
      return;
    }
    res.json(successResponse({ message: 'Perfil resetado com sucesso.' }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
}
