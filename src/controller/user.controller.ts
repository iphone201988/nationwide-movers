import { Request, Response } from "express";
import User from "../model/user.model";
import { comparePassword, generateToken, hashedPassword } from "../utils/helper";

export const register = async (req: Request, res: Response): Promise<any> => {
    try {
        const { fullName, email, phoneNumber, password ,deviceType,deviceToken } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "user already exists with this email",
            });
        }

        const hashPassword =await hashedPassword(password);

        const newUser = await User.create({
            fullName,
            email,
            phoneNumber,
            password: hashPassword,
            deviceType,
            deviceToken
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                phoneNumber: newUser.phoneNumber,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
};


export const login = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password ,  deviceType, deviceToken} = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }
        
        user.deviceType = deviceType;
        user.deviceToken = deviceToken;
        await user.save();

        const token = generateToken({ _id: user._id, email: user.email, role: user.role });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
};