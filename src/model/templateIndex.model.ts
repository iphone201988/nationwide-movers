import mongoose, { Schema, Document, Types } from "mongoose";


const TemplateIndexSchema = new Schema(
    {   
        templateIds: { type: [Schema.Types.ObjectId], ref: "Template" },
    }
);
TemplateIndexSchema.index({ templateIds: 1,});



export const TemplateIndex = mongoose.model("TemplateIndex", TemplateIndexSchema);
export default TemplateIndex;
