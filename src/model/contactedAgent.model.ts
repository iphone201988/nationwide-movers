import mongoose, { Schema } from "mongoose";

const contactedAgentSchema = new Schema({
    agentId: {
        type: mongoose.Types.ObjectId,
        ref: "Agent"
    },
    
}, {
    timestamps: true
})