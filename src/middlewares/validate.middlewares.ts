import { Response, NextFunction, Request } from "express";
import { ValidationError } from "../utils/error";
import Joi from "joi";

export const validate = (schema: Record<string, Joi.Schema>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
  Object.entries(schema).map(([key, joiSchema]) => {
        console.log(req[key as keyof Request]);
      const { error } = joiSchema.validate(req[key as keyof Request], { abortEarly: true, allowUnknown: false, });
      if (error) {
        return next(new ValidationError(error.message.replace(/"/g, "")));
      }
    });
    next();
  };
};
