import { Request, Response } from "express";
import Client from "../model/client.model";

/**
 * Add or Update the Single Client Profile
 */
export const addUpdateClient = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, phoneNumber, countryCode, ...rest } = req.body;

    if (!phoneNumber || !countryCode) {
      return res.status(400).json({
        success: false,
        message: "countryCode and phoneNumber are required.",
      });
    }

    // Check if a client profile already exists (there should only be one)
    let client = await Client.findOne();

    if (client) {
      // Update existing profile
      client.set({
        email,
        phoneNumber,
        countryCode,
        ...rest,
      });
      await client.save();
    } else {
      // Create the single profile
      client = await Client.create({
        email,
        phoneNumber,
        countryCode,
        ...rest,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Client profile saved successfully",
      data: client,
    });
  } catch (error) {
    console.error("Error in addUpdateClient:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get the Single Client Profile
 */
export const getClientProfile = async (_req: Request, res: Response): Promise<any> => {
  try {
    // Always get the single (first) client profile
    const client = await Client.findOne();

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Client profile fetched successfully",
      data: client,
    });
  } catch (error) {
    console.error("Error in getClientProfile:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
