import { Router } from "express";
import {
  addMeeting,
  agentAdd,
  agentUpdate,
  emailAgents,
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
  sendBulkSMS,
  sendSMS,
  uploadAndAnalyzeExcel,
} from "../controller/agent.controller";
import { validate } from "../middlewares/validate.middlewares";
import {
  addMeetingSchema,
  getMeetingSchema,
  givefeedbackSchema,
  updateMeetingSchema,
} from "../schema/app.schema";
import upload from "../middlewares/multer.middleware";

const agentRouter = Router();

agentRouter.post("/upload-excel", uploadAndAnalyzeExcel);

agentRouter.get("/home", home);
agentRouter.get("/new-agents", newAgents);

agentRouter.get("/agent-detail/:id", getAgentDetails);

agentRouter.get("/property/all", getAllProperty);
agentRouter.get("/property/new-property", newProperty);

agentRouter.get("/property/:id", getPropertyDetail);
agentRouter.post("/send-sms", sendSMS);
agentRouter.post("/sms/bulk", sendBulkSMS);
agentRouter.get("/get-contacted-agents", getAllContactedAgent);

agentRouter.post("/give-feedback", validate(givefeedbackSchema), givefeedback);

agentRouter.post("/meeting", validate(addMeetingSchema), addMeeting);
agentRouter.put(
  "/meeting/complete",
  validate(updateMeetingSchema),
  markMeetingCompleted
);
agentRouter.get("/meeting/all", validate(getMeetingSchema), getAllMeetings);
agentRouter.put(
  "/agent/update/:id",
  upload.fields([
    {
      name: "letter",
      maxCount: 1,
    },
    {
      name: "discountCard",
      maxCount: 1,
    },
    {
      name: "brochure",
      maxCount: 1,
    },
    {
      name: "otherFile",
      maxCount: 1,
    },
    {
      name: "profileImage",
      maxCount: 1,
    },
  ]),
  agentUpdate
);

agentRouter.post(
  "/agent/add",
  upload.fields([
    {
      name: "letter",
      maxCount: 1,
    },
    {
      name: "discountCard",
      maxCount: 1,
    },
    {
      name: "brochure",
      maxCount: 1,
    },
    {
      name: "otherFile",
      maxCount: 1,
    },
  ]),
  agentAdd
);
agentRouter.post("/agent/email", emailAgents);

export default agentRouter;
