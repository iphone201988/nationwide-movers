import { Router } from 'express';
import { login, register } from '../controller/user.controller';

const userRouter = Router();

userRouter.post("/register",register);
userRouter.post("/login",login);

export default userRouter;
