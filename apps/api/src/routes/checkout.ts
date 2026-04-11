import { Router } from 'express';
import * as assignmentsController from '../controllers/assignments.controller';

const router = Router();

router.post('/', assignmentsController.checkout);

export default router;
