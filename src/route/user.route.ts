import { Router } from 'express';
import { login, register } from '../controller/user.controller';
import { validate } from '../middlewares/validate.middlewares';
import { loginSchema, registerSchema } from '../schema/user.schema';

const userRouter = Router();

userRouter.post("/register",validate(registerSchema),register);
userRouter.post("/login",validate(loginSchema),login);

export default userRouter;
