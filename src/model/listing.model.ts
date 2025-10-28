import mongoose, { Schema, Document, Types } from "mongoose";

export interface IListing extends Document {
    title: string;
    price: string;
    address: string;

    beds?: { value: string; image?: string };
    baths?: { value: string; image?: string };
    floor?: { value: string; image?: string };

    description?: string;

    homeHighlights?: {
        key: string;
        value: string;
        image?: string;
    }[];

    features?: {
        section: string;
        icon?: string;
        items: {
            label: string;
            values: string[];
        }[];
    }[];

    communityDescription?: string;

    officeDetails?: {
        title?: string;
        address: string[];
    };

    agentId: Types.ObjectId;

    images?: string[];

    createdAt: Date;
    updatedAt: Date;
    isView: boolean;
}

const listingSchema = new Schema<IListing>(
    {
        title: { type: String },
        price: { type: String },
        address: { type: String },

        beds: {
            value: { type: String },
            image: { type: String },
        },
        baths: {
            value: { type: String },
            image: { type: String },
        },
        floor: {
            value: { type: String },
            image: { type: String },
        },

        description: { type: String },

        homeHighlights: [
            {
                key: { type: String },
                value: { type: String },
                image: { type: String },
            },
        ],

        features: [
            {
                section: { type: String },
                icon: { type: String },
                items: [
                    {
                        label: { type: String },
                        values: [{ type: String }],
                    },
                ],
            },
        ],

        communityDescription: { type: String },

        officeDetails: {
            title: { type: String },
            address: [{ type: String }],
        },

        agentId: {
            type: Schema.Types.ObjectId,
            ref: "Agent"
        },

        images: [{ type: String }],
        isView: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);

export const Listing = mongoose.model<IListing>("Listing", listingSchema);
export default Listing;
