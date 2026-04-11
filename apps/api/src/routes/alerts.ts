import { Router } from 'express';
import * as alertsController from '../controllers/alerts.controller';

const router = Router();

router.get('/', alertsController.list);
router.post('/', alertsController.create);
router.put('/:id', alertsController.update);
router.delete('/:id', alertsController.remove);

export default router;
