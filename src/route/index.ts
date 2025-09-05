import { Router } from 'express';
import agentRouter from './agent.routes';
import templateRouter from './template.route';
import userRouter from './user.route';

const router = Router();

router.use("/", agentRouter);
router.use("/template", templateRouter);
router.use("/user", userRouter);

export default router;
