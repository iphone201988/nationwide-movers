import Joi from "joi";

export const registerSchema = {
    body: Joi.object({
        fullName: Joi.string()
            .min(3)
            .max(50)
            .required()
            .messages({
                "string.base": "Full name should be a type of text",
                "string.empty": "Full name cannot be empty",
                "string.min": "Full name should have at least 3 characters",
                "string.max": "Full name should not exceed 50 characters",
                "any.required": "Full name is required",
            }),

        email: Joi.string()
            .email()
            .required()
            .messages({
                "string.email": "Please enter a valid email address",
                "string.empty": "Email cannot be empty",
                "any.required": "Email is required",
            }),

        phoneNumber: Joi.string()
            .required()
            .messages({
                "string.empty": "Phone number cannot be empty",
                "any.required": "Phone number is required",
            }),

        password: Joi.string()
            .min(6)
            .max(20)
            .required()
            .messages({
                "string.min": "Password must be at least 6 characters",
                "string.max": "Password cannot exceed 20 characters",
                "string.empty": "Password cannot be empty",
                "any.required": "Password is required",
            }),
    }),
};


export const loginSchema = {
    body: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                "string.email": "Please enter a valid email address",
                "string.empty": "Email cannot be empty",
                "any.required": "Email is required",
            }),

        password: Joi.string()
            .min(6)
            .max(20)
            .required()
            .messages({
                "string.min": "Password must be at least 6 characters",
                "string.max": "Password cannot exceed 20 characters",
                "string.empty": "Password cannot be empty",
                "any.required": "Password is required",
            }),
    }),
};