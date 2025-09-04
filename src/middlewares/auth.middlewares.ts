import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User, { IUser } from "../model/user.model";
import mongoose from "mongoose";

declare module "express-serve-static-core" {
    interface Request {
        user: IUser;
        userId: mongoose.Types.ObjectId;
    }
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

        if (!decoded || !decoded.id) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const user = await User.findById(decoded._id);
        if (!user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        req.user = user;
        req.userId = user._id;

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Token verification failed",
        });
    }
};

export default authMiddleware;
