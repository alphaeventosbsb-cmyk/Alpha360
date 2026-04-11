import { Router } from 'express';
import * as usersController from '../controllers/users.controller';

const router = Router();

router.get('/', usersController.list);
router.get('/:id', usersController.get);
router.put('/:id', usersController.update);
router.post('/:id/reset-profile', usersController.resetProfile);

export default router;
