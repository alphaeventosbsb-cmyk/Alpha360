import { Router } from 'express';
import * as sitesController from '../controllers/sites.controller';

const router = Router();

router.get('/', sitesController.list);
router.get('/:id', sitesController.get);
router.post('/', sitesController.create);
router.put('/:id', sitesController.update);
router.delete('/:id', sitesController.remove);

export default router;
