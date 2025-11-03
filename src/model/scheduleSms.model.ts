import mongoose, { Document, Schema } from "mongoose";

export interface IScheduleSms extends Document {
  agentId: mongoose.Types.ObjectId;       // Agent who scheduled the SMS
  message: string;                        // SMS content
  totalCount: number;                     // Number of SMS messages to send
  randomDelay: boolean;                   // Whether to randomize delay
  minDelay: number;                       // Minimum delay (in seconds)
  maxDelay: number;                       // Maximum delay (in seconds)
  whenToSend: Date;                       // Scheduled date & time for sending
  status: "pending" | "in-progress" | "completed" | "failed"; // Job status
  createdAt?: Date;
  updatedAt?: Date;
}

const ScheduleSmsSchema = new Schema<IScheduleSms>(
  {
    agentId: {
      type: Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    totalCount: {
      type: Number,
      required: true,
      min: 1,
    },
    randomDelay: {
      type: Boolean,
      default: false,
    },
    minDelay: {
      type: Number,
      default: 0, // in seconds
    },
    maxDelay: {
      type: Number,
      default: 0, // in seconds
    },
    whenToSend: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

export const ScheduleSms = mongoose.model<IScheduleSms>(
  "ScheduleSms",
  ScheduleSmsSchema
);

