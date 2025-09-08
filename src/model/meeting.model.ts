import mongoose, { Schema } from "mongoose";

const meetingSchema = new Schema(
    {
        agentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agent"
        },
        meetingDate: {
            type: Date
        },
        meetingTime: {
            type: String
        },
        isCompleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Meeting = mongoose.model("Meeting", meetingSchema);

export default Meeting;
