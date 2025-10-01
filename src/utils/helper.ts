import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { Request } from "express";

export const hashedPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

export const generateToken = (
  payload: string | object | Buffer,
  expiresIn: jwt.SignOptions["expiresIn"] = "7d"
): string => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
  });
};

export const getFiles = (req: Request, fileNames: Array<string>) => {
  // Multiple files uploaded
  const files: any = {};
  console.log("req.files::::", req.files);
  fileNames.forEach((fileKey: string) => {
    if (req.files && req.files[fileKey]) {
      files[fileKey] = req.files[fileKey].map((file: any) => {
        console.log("file:::", file);
        return process.env.BACKEND_URL + "/uploads/" + file.filename;
      });
    }
  });
  if (Object.keys(files).length) return files;

  return null;
};
