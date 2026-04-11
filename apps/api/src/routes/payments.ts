import { Router } from 'express';
import * as paymentsController from '../controllers/payments.controller';

const router = Router();

router.get('/', paymentsController.list);
router.post('/', paymentsController.create);
router.post('/:id/process', paymentsController.process);

export default router;
