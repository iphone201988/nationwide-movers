import mongoose, { Schema, Document } from "mongoose";
import { role } from "../utils/enum";

export interface IClient extends Document {
    _id: mongoose.Types.ObjectId;
    firstName?: string;
    lastName?: string;
    email?: string | null;
    countryCode: string;
    phoneNumber: string;
    profileImage?: string | null;
    website?: string;
    address?: string;
    createdAt: Date;
    updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
    {
        firstName: { type: String },
        lastName: { type: String },
        email: { type: String, default: null },
        phoneNumber: { type: String, required: true },
        countryCode: { type: String, required: true },
        profileImage: { type: String, default: null },
        website: { type: String },
        address: { type: String },
    },
    {
        timestamps: true,
    }
);

const Client = mongoose.model<IClient>("Client", clientSchema);

export default Client;
