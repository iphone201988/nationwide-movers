import { Router } from 'express';
import agentRouter from './agent.routes';
import templateRouter from './template.route';

const router = Router();

router.use("/", agentRouter);
router.use("/template", templateRouter);

export default router;
