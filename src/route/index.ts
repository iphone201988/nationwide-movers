import { Router } from 'express';
import agentRouter from './agent.routes';
import templateRouter from './template.route';
import userRouter from './user.route';
import clientRouter from './client.routes';
import { gmailAuth, oauth2callback } from '../controller/gmailListingScrape';

const router = Router();

router.use("/", agentRouter);
router.use("/template", templateRouter);
router.use("/user", userRouter);
router.use("/client", clientRouter);
router.get("/auth", gmailAuth);
router.get("/oauth2callback", oauth2callback);

export default router;
