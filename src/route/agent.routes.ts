import { Router } from 'express';
import {
  getAgentDetails,
  getAllContactedAgent,
  getAllProperty,
  getPropertyDetail,
  home,
  newAgents,
  newProperty,
  sendSMS,
  uploadAndAnalyzeExcel,
} from '../controller/agent.controller';

const agentRouter = Router();

agentRouter.post('/upload-excel', uploadAndAnalyzeExcel);

agentRouter.get("/home",home);
agentRouter.get("/new-agents",newAgents);

agentRouter.get("/agent-detail/:id",getAgentDetails);

agentRouter.get("/property/all",getAllProperty);
agentRouter.get("/property/new-property",newProperty);

agentRouter.get("/property/:id",getPropertyDetail);
agentRouter.post("/send-sms",sendSMS);
agentRouter.get("/get-contacted-agents",getAllContactedAgent);

export default agentRouter;
