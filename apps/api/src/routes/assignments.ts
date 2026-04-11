import { Router } from 'express';
import * as assignmentsController from '../controllers/assignments.controller';

const router = Router();

router.get('/', assignmentsController.list);
router.get('/guard', assignmentsController.guardAssignments);
router.post('/', assignmentsController.create);
router.post('/request', assignmentsController.requestJob);
router.post('/invite', assignmentsController.inviteGuard);
router.put('/:id', assignmentsController.update);
router.post('/:id/approve', assignmentsController.approve);
router.post('/:id/reject', assignmentsController.reject);

export default router;
