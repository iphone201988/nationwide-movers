import mongoose, { Schema, Document } from "mongoose";
import { feedbackEnum } from "../utils/enum";

export interface IAgent extends Document {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
  profileImage?: string;
  address?: string;
  smsAddress?: string;
  link?: string;
  comment?: string;

  brokerage?: string;
  image?: string;
  timeZone?: string;
  lat?: Number;
  lng?: Number;

  zillow: string;
  linkedIn: string;
  facebook: string;
  webLink: string;
  listingLink: string;
  other: string;

  createdAt: Date;
  updatedAt: Date;
  feedback?: number;

  letter: string;
  discountCard: string;
  brochure: string;
  otherFile: string;
  numberOfListings: number;
  raState: string;
  closestCity: string;
  discountCodeCoupon: string;
  raMailingAddress: string;
  referredBy: string;
  isView?: boolean;
  homeowner: string;
  listingInfo?: number;
  additionalInfo?: number;
  discountCardPdf?: string;
}

const agentSchema = new Schema<IAgent>(
  {
    fullName: { type: String },
    email: { type: String, default: null },
    phoneNumber: { type: String },
    countryCode: { type: String },
    profileImage: { type: String, default: null },
    address: { type: String, default: null },
    smsAddress: { type: String, default: null },
    brokerage: { type: String, default: null },
    image: { type: String, default: null },
    feedback: {
      type: Number,
      enum: [
        feedbackEnum["CSV file"],
        feedbackEnum["Do Not Text"],
        feedbackEnum["No Response"],
        feedbackEnum["Other Response"],
        feedbackEnum["Positive Response"],
        feedbackEnum["RA Joined"],
        feedbackEnum["Text failed"],
        feedbackEnum["Wrong/no phone #"],
        feedbackEnum["Ready to be text"],
        feedbackEnum["Empty Listing"],
        feedbackEnum["Misc."],
        feedbackEnum["Already Texted"],
        feedbackEnum["Pending"],
      ]
    },
    listingInfo: {
      type: Number,
    },
    additionalInfo: {
      type: Number,
    },
    link: {
      type: String,
    },
    timeZone: {
      type: String,
    },
    lat: {
      type: Number,
    },
    lng: {
      type: Number,
    },
    comment: {
      type: String,
      default: null,
    },
    zillow: {
      type: String,
      default: null,
    },
    linkedIn: {
      type: String,
      default: null,
    },
    facebook: {
      type: String,
      default: null,
    },
    webLink: {
      type: String,
      default: null,
    },
    listingLink: {
      type: String,
      default: null,
    },
    other: {
      type: String,
      default: null,
    },
    letter: {
      type: String,
      default: null,
    },
    discountCard: {
      type: String,
      default: null,
    },
    brochure: {
      type: String,
      default: null,
    },
    otherFile: {
      type: String,
      default: null,
    },

    numberOfListings: {
      type: Number,
      default: null,
    },
    raState: {
      type: String,
      default: null,
    },
    closestCity: {
      type: String,
      default: null,
    },

    discountCodeCoupon: {
      type: String,
      default: null,
    },
    raMailingAddress: {
      type: String,
      default: null,
    },
    referredBy: {
      type: String,
      default: null,
    },
    isView: {
      type: Boolean,
      default: false
    },
    homeowner:{
      type: String,
    },
    discountCardPdf: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);
agentSchema.index({createdAt: -1});
agentSchema.index({ phoneNumber: 1 });
agentSchema.index({ email: 1 });
agentSchema.index({ fullName: 1 });



export const Agent = mongoose.model<IAgent>("Agent", agentSchema);
export default Agent;
