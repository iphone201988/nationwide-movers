import { Router } from 'express';
import { addTemplate, deleteTemplate, getAllTemplate, getTemplateById, templatePositionMove, updateTemplate } from '../controller/template.controller';

const templateRouter = Router();

templateRouter.post("/",addTemplate);
templateRouter.put("/move-position",templatePositionMove);
templateRouter.put("/:id",updateTemplate);
templateRouter.delete("/:id",deleteTemplate);
templateRouter.get("/",getAllTemplate);
templateRouter.get("/:id",getTemplateById);

export default templateRouter;
