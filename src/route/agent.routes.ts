import { Router } from 'express';
import {
  getAgentDetails,
  getAllContactedAgent,
  getAllProperty,
  getPropertyDetail,
  givefeedback,
  home,
  newAgents,
  newProperty,
  sendSMS,
  uploadAndAnalyzeExcel,
} from '../controller/agent.controller';
import { validate } from '../middlewares/validate.middlewares';
import { givefeedbackSchema } from '../schema/user.schema';

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

agentRouter.post("/give-feedback",validate(givefeedbackSchema),givefeedback);

export default agentRouter;
