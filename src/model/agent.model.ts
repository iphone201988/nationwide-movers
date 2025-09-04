import mongoose, { Schema, Document } from 'mongoose';

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
}

const agentSchema = new Schema<IAgent>(
    {
        fullName: { type: String },
        email: { type: String, default: null },
        phoneNumber: { type: String },
        profileImage: { type: String, default: null },
        address: { type: String, default: null },
        brokerage: { type: String, default: null },
        image:{ type: String, default: null}
    },
    {
        timestamps: true
    }
);

export const Agent = mongoose.model<IAgent>('Agent', agentSchema);
export default Agent;
