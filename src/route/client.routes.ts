import { Router } from 'express';
import { validate } from '../middlewares/validate.middlewares';
import { addUpdateClient, getClientProfile } from '../controller/client.controller';

const clientRouter = Router();

clientRouter.post("/add-update",addUpdateClient);
clientRouter.get("/",getClientProfile);

export default clientRouter;
