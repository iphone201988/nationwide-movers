import mongoose, { Schema, Document, ObjectId } from "mongoose";
import { role } from "../utils/enum";

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId
    fullName: string;
    email?: string | null;
    countryCode: string;
    phoneNumber: string;
    password: string;
    profileImage?: string | null;
    role: number;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        fullName: { type: String },
        email: { type: String, default: null },
        password: { type: String },
        phoneNumber: { type: String },
        countryCode: { type: String },
        profileImage: { type: String, default: null },
        role: {
            type: Number,
            enum: [role.USER, role.ADMIN],
            default: role.USER
        }
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
