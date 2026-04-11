import { Router } from 'express';
import * as assignmentsController from '../controllers/assignments.controller';

const router = Router();

router.post('/', assignmentsController.checkin);

export default router;
