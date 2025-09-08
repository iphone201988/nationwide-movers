import { Router } from 'express';
import {
  addMeeting,
  getAgentDetails,
  getAllContactedAgent,
  getAllMeetings,
  getAllProperty,
  getPropertyDetail,
  givefeedback,
  home,
  markMeetingCompleted,
  newAgents,
  newProperty,
  sendSMS,
  uploadAndAnalyzeExcel,
} from '../controller/agent.controller';
import { validate } from '../middlewares/validate.middlewares';
import { addMeetingSchema, getMeetingSchema, givefeedbackSchema, updateMeetingSchema } from '../schema/app.schema';

const agentRouter = Router();

agentRouter.post('/upload-excel', uploadAndAnalyzeExcel);

agentRouter.get("/home", home);
agentRouter.get("/new-agents", newAgents);

agentRouter.get("/agent-detail/:id", getAgentDetails);

agentRouter.get("/property/all", getAllProperty);
agentRouter.get("/property/new-property", newProperty);

agentRouter.get("/property/:id", getPropertyDetail);
agentRouter.post("/send-sms", sendSMS);
agentRouter.get("/get-contacted-agents", getAllContactedAgent);

agentRouter.post("/give-feedback", validate(givefeedbackSchema), givefeedback);


agentRouter.post("/meeting", validate(addMeetingSchema), addMeeting);
agentRouter.put("/meeting/complete", validate(updateMeetingSchema), markMeetingCompleted);
agentRouter.get("/meeting/all", validate(getMeetingSchema), getAllMeetings);

export default agentRouter;