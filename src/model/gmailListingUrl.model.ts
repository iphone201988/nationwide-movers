import mongoose, { Schema, Document, Types } from "mongoose";


const GmailListingSchema = new Schema(
    {
        url: { type: String, required: true },
    }
);



export const GmailListing = mongoose.model("GmailListing", GmailListingSchema);
export default GmailListing;
