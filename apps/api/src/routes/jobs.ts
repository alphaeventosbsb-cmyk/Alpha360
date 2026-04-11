import { Router } from 'express';
import * as jobsController from '../controllers/jobs.controller';

const router = Router();

router.get('/', jobsController.list);
router.get('/:id', jobsController.get);
router.post('/', jobsController.create);
router.put('/:id', jobsController.update);
router.delete('/:id', jobsController.remove);

export default router;
