import { Router } from 'express';
import agentRouter from './agent.routes';
import templateRouter from './template.route';
import userRouter from './user.route';
import clientRouter from './client.routes';

const router = Router();

router.use("/", agentRouter);
router.use("/template", templateRouter);
router.use("/user", userRouter);
router.use("/client", clientRouter);

export default router;
