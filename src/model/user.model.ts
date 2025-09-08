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
    deviceType: number; //'1 => IOS ', '2 => Android'
    deviceToken?: string;
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
        },
        deviceType:{
            type: Number,
            enum: [1,2],//'1 => IOS ', '2 => Android'
            default: 1
        },
        deviceToken: { type: String 
        }
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
