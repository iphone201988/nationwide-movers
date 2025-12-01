import { Request, Response } from "express";
import Template from "../model/template.model";
import TemplateIndex from "../model/templateIndex.model";
import mongoose from "mongoose";

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
        await TemplateIndex.updateOne({}, { $push: { templateIds: template._id } }, { upsert: true });
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
        await TemplateIndex.updateOne({}, { $pull: { templateIds: template._id } });
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
                { "templates.title": { $regex: search, $options: "i" } },
                { "templates.body": { $regex: search, $options: "i" } }
            ];
        }

        const templates = await TemplateIndex.aggregate([
            {
                $lookup: {
                    from: "templates",
                    localField: "templateIds",
                    foreignField: "_id",
                    as: "templates"
                }
            },
            { $unwind: "$templates" },
            { $match:  filter  },
            { $replaceRoot: { newRoot: "$templates" } },
            { $skip: (Number(page) - 1) * Number(limit) },
            { $limit: Number(limit) }
        ]);

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
// Templates to be able to move from 1 position to another. Example dragging a template from last to first positions on the list
export const templatePositionMove = async (req: Request, res: Response): Promise<any> => {
    try {
        const { templateId, newPosition } = req.body;
        const index = await TemplateIndex.findOne({});
        if (!index) throw new Error("Template index not found");
        const currentPos = index.templateIds.findIndex(id => id.toString() === templateId);
        if (currentPos === -1) throw new Error("Template not found in index");
        index.templateIds.splice(currentPos, 1);
        index.templateIds.splice(newPosition, 0, new mongoose.Types.ObjectId(templateId));
        await index.save();
        return res.status(200).json({
            success: true,
            message: "Template position updated successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

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
async function addTemplateIdsInUers() {
    const allTemplates = await Template.find({}, { _id: 1, userId: 1 });

    const index: any = await TemplateIndex.findOne({});
    const templateIds: any = allTemplates.map(t => t._id);
    if (!index) {
        await TemplateIndex.create({ templateIds });
    } else {
        await TemplateIndex.updateOne({ _id: index._id }, { $addToSet: { templateIds: { $each: templateIds } } });
    }

    console.log("Template IDs added to users successfully");

}
// addTemplateIdsInUers();
