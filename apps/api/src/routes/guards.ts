import { Router } from 'express';
import * as guardsController from '../controllers/guards.controller';

const router = Router();

router.get('/', guardsController.list);
router.get('/search', guardsController.search);
router.get('/:id', guardsController.get);
router.post('/suggest', guardsController.suggest);
router.post('/rate', guardsController.rate);

export default router;
