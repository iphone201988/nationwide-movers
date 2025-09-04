import mongoose, { Schema, Document } from 'mongoose';

export interface IRealtorListing {
  truliaLink?: string;
  address?: string;
}

export interface IRealtor extends Document {
  // Core realtor information
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  webPage?: string;
  
  // Professional details
  zillowProfile?: string;
  facebookProfile?: string;
  linkedInProfile?: string;
  brokerInfo?: string;
  coAgentInfo?: string;
  
  // Business information
  zillowListingsCount?: string;
  dateAdded?: Date;
  autoNumber?: number;
  
  // Contact and communication
  otherPhoneNotes?: string;
  otherMailingAddress?: string;
  
  // Marketing and promotions
  discountCode?: string;
  discountExpiry?: string;
  letterDiscountCardSent?: string;
  postcardSent?: string;
  
  // Digital materials
  digitalCardQrBrochure?: string;
  emailDigitalCardBrochure?: string;
  connectedOrFriendedMessage?: string;
  
  // Referral system
  referralAgentStatus?: string;
  referralAgentCode?: string;
  
  // Property listings (multiple)
  listings: IRealtorListing[];
  
  // Legacy fields for backward compatibility
  name?: string;
  numberOfZillowListings?: number;
  probableCellForTexting?: string;
  zillow?: string;
  facebook?: string;
  linkedIn?: string;
  brokerAndAddress?: string;
  discountExpires?: Date;
  
  // Additional fields
  category?: string;
  rawData?: any;
  createdAt: Date;
  updatedAt: Date;
}

const realtorSchema = new Schema<IRealtor>({
  // Core realtor information
  fullName: { type: String, trim: true, index: true },
  firstName: { type: String, trim: true, index: true },
  lastName: { type: String, trim: true, index: true },
  email: { type: String, trim: true, lowercase: true, index: true },
  phoneNumber: { type: String, trim: true, index: true },
  webPage: { type: String, trim: true },
  
  // Professional details
  zillowProfile: { type: String, trim: true },
  facebookProfile: { type: String, trim: true },
  linkedInProfile: { type: String, trim: true },
  brokerInfo: { type: String, trim: true },
  coAgentInfo: { type: String, trim: true },
  
  // Business information
  zillowListingsCount: { type: String, trim: true },
  dateAdded: { type: Date, index: true },
  autoNumber: { type: Number },
  
  // Contact and communication
  otherPhoneNotes: { type: String, trim: true },
  otherMailingAddress: { type: String, trim: true },
  
  // Marketing and promotions
  discountCode: { type: String, trim: true },
  discountExpiry: { type: String, trim: true },
  letterDiscountCardSent: { type: String, trim: true },
  postcardSent: { type: String, trim: true },
  
  // Digital materials
  digitalCardQrBrochure: { type: String, trim: true },
  emailDigitalCardBrochure: { type: String, trim: true },
  connectedOrFriendedMessage: { type: String, trim: true },
  
  // Referral system
  referralAgentStatus: { type: String, trim: true, index: true },
  referralAgentCode: { type: String, trim: true },
  
  // Property listings
  listings: [{
    truliaLink: { type: String, trim: true },
    address: { type: String, trim: true }
  }],
  
  // Legacy fields for backward compatibility
  name: { type: String, trim: true, index: true },
  numberOfZillowListings: { type: Number, min: 0, default: 0 },
  probableCellForTexting: { type: String, trim: true },
  zillow: { type: String, trim: true },
  facebook: { type: String, trim: true },
  linkedIn: { type: String, trim: true },
  brokerAndAddress: { type: String, trim: true },
  discountExpires: { type: Date },
  
  // Additional fields
  category: { type: String, trim: true },
  rawData: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});


export const Realtor = mongoose.model<IRealtor>('Realtor', realtorSchema);
export default Realtor;
