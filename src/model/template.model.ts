import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITemplate extends Document {
  title?: string;
  body?: string;
  userId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const templateSchema = new Schema<ITemplate>(
  {
    title: { type: String },
    body: { type: String },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Template = mongoose.model<ITemplate>("Template", templateSchema);
export default Template;
