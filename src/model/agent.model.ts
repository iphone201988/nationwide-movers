import mongoose, { Schema, Document } from 'mongoose';
import { feedbackEnum } from '../utils/enum';

export interface IAgent extends Document {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    profileImage?: string;
    address?: string;

    brokerage?: string;
    image?: string;

    createdAt: Date;
    updatedAt: Date;
    feedback?:number;
}

const agentSchema = new Schema<IAgent>(
    {
        fullName: { type: String },
        email: { type: String, default: null },
        phoneNumber: { type: String },
        profileImage: { type: String, default: null },
        address: { type: String, default: null },
        brokerage: { type: String, default: null },
        image: { type: String, default: null },
        feedback:{
            type:Number,
            enum:[feedbackEnum['Negative Feedback'],feedbackEnum['Neutral Feedback'],feedbackEnum['Positive Feedback']],
        }
    },
    {
        timestamps: true
    }
);

export const Agent = mongoose.model<IAgent>('Agent', agentSchema);
export default Agent;
