import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.get('/me', authController.getMe);
router.post('/register', authController.register);

export default router;
