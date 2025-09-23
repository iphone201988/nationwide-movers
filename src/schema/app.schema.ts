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
        deviceToken: Joi.string().required().messages({
            "string.empty": "Device token cannot be empty",
            "any.required": "Device token is required",
        }),
        deviceType: Joi.number().valid(1, 2).required().messages({
            "any.only": "Device type must be either 1 (iOS) or 2 (Android)",
            "any.required": "Device type is required",
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
        deviceToken: Joi.string().required().messages({
            "string.empty": "Device token cannot be empty",
            "any.required": "Device token is required",
        }),
        deviceType: Joi.number().valid(1, 2).required().messages({
            "any.only": "Device type must be either 1 (iOS) or 2 (Android)",
            "any.required": "Device type is required",
        }),
    }),
};

export const feedbackEnum = {
    "RA Joined": 1,
    "No Response": 2,
    "Text Failed": 3,
    "Do Not Text": 4,
    "Other Response": 5,
    "Wrong/No Phone #": 6,
    "Positive Response": 7,
    "CSV File": 8,
} as const;

export const givefeedbackSchema = {
    body: Joi.object({
        feedback: Joi.number()
            .valid(...Object.values(feedbackEnum))
            .required()
            .messages({
                "any.only": `Feedback must be one of: ${Object.values(feedbackEnum).join(", ")}`,
                "any.required": "Feedback is required",
                "number.base": "Feedback must be a number",
            }),
        agentId: Joi.string()
            .trim()
            .required()
            .messages({
                "string.empty": "Agent ID cannot be empty",
                "any.required": "Agent ID is required",
            }),
    }),
};


export const addMeetingSchema = {
    body: Joi.object({
        agentId: Joi.string().required().messages({
            "string.empty": "Agent ID cannot be empty",
            "any.required": "Agent ID is required",
        }),
        meetingDate: Joi.date().required().messages({
            "date.base": "Meeting date must be a valid date",
            "any.required": "Meeting date is required",
        }),
        meetingTime: Joi.string().required().messages({
            "string.empty": "Meeting time cannot be empty",
            "any.required": "Meeting time is required",
        }),
    }),
}

export const updateMeetingSchema = {
    body: Joi.object({
        meetingId: Joi.string().required().messages({
            "string.empty": "Meeting ID cannot be empty",
            "any.required": "Meeting ID is required",
        }),
    }),
}

export const getMeetingSchema = {
    query: Joi.object({
        limit: Joi.number().optional().messages({
            "number.base": "Limit must be a number",
            "any.required": "Limit is required",
        }),
        page: Joi.number().optional().messages({
            "number.base": "Page must be a number",
            "any.required": "Page is required",
        }),
    }),
}
