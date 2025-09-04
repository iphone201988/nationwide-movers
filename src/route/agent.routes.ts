import { Router } from 'express';
import {
  getAgentDetails,
  getAllProperty,
  getPropertyDetail,
  home,
  uploadAndAnalyzeExcel,
} from '../controller/agent.controller';

const agentRouter = Router();

agentRouter.post('/upload-excel', uploadAndAnalyzeExcel);
agentRouter.get("/home",home);
agentRouter.get("/agent-detail/:id",getAgentDetails);
agentRouter.get("/property/all",getAllProperty);
agentRouter.get("/property/:id",getPropertyDetail);

export default agentRouter;
