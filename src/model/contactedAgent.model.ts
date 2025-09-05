import mongoose, { Schema } from "mongoose";

const contactedAgentSchema = new Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent"
    },
    contactedAt: {
      type: Date,
      default: Date.now
    },
  },
  {
    timestamps: true,
  }
);

const ContactedAgent = mongoose.model("ContactedAgent", contactedAgentSchema);

export default ContactedAgent;
