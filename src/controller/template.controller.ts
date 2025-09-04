import { Request, Response } from "express";
import Template from "../model/template.model";

export const addTemplate = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).userId;
        const { title, body } = req.body;
        if (!title || !body) {
            return res.status(400).json({
                success: false,
                message: "Title and body are required",
            });
        }
        const template = await Template.create({ title, body, userId });
        res.status(201).json({
            success: true,
            message: "Template added successfully",
            data: template,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const updateTemplate = async (req: Request, res: Response): Promise<any> => {
    try {
        const templateId = req.params.id;
        const { title, body } = req.body;
        const template = await Template.findById(templateId);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: "template not found"
            })
        }
        if (title) template.title = title;
        if (body) template.body = body;
        await template.save();
        res.status(200).json({
            success: true,
            message: "Template updated successfully",
            data: template,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

export const deleteTemplate = async (req: Request, res: Response): Promise<any> => {
    try {
        const templateId = req.params.id;
        const template = await Template.findById(templateId);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: "template not found"
            });
        }
        await Template.findByIdAndDelete(templateId);
        return res.status(200).json({
            success: true,
            message: "Template deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

export const getAllTemplate = async (req: Request, res: Response): Promise<any> => {
    try {
        const { search, page = 1, limit = 10 } = req.query as any;
        const filter: any = {};

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { body: { $regex: search, $options: "i" } }
            ];
        }

        const templates = await Template.find(filter)
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await Template.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: templates,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            total,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getTemplateById = async (req: Request, res: Response): Promise<any> => {
    try {
        const templateId = req.params.id;
        const template = await Template.findById(templateId);
        if (!template) {
            return res.status(404).json({
                success: true,
                message: "template not found"
            })
        }
        return res.status(200).json({
            success: true,
            data: template,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
