import mongoose, { Schema, Document, Types } from "mongoose";


const GmailListingSchema = new Schema(
    {   messageId: { type: String, required: true,},
        url: { type: String, required: true },
        isScraped: { type: Boolean, default: false  },
    },{ timestamps: true }
);
GmailListingSchema.index({ messageId: 1 });



export const GmailListing = mongoose.model("GmailListing", GmailListingSchema);
export default GmailListing;
