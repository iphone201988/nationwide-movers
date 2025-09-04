/**
 * Excel to Model Field Mapper
 * Maps Excel column headers to clean, professional model field names
 */

export interface ExcelRow {
  [key: string]: any;
}

export interface MappedRealtorData {
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
  listings: Array<{
    truliaLink?: string;
    address?: string;
  }>;
  
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
}

/**
 * Maps Excel data to clean model fields
 */
export function mapExcelToModel(excelRow: ExcelRow): MappedRealtorData {
  const mapped: MappedRealtorData = {
    listings: []
  };

  // Core realtor information
  mapped.fullName = excelRow['Name'] || null;
  mapped.firstName = excelRow['First Name'] || null;
  mapped.lastName = excelRow['Last Name'] || null;
  mapped.email = excelRow['Email'] || null;
  mapped.phoneNumber = excelRow['📲Probable/Confirmed Cel for Texting📲']?.toString() || null;
  mapped.webPage = excelRow['Web Page'] || null;
  
  // Professional details
  mapped.zillowProfile = excelRow['Zillow'] || null;
  mapped.facebookProfile = excelRow['**Facebook**'] || null;
  mapped.linkedInProfile = excelRow['**LinkedIn**'] || null;
  mapped.brokerInfo = excelRow['Broker & Address'] || null;
  mapped.coAgentInfo = excelRow['Co Agent Info'] || null;
  
  // Business information
  mapped.zillowListingsCount = excelRow['Number Of Zillow Listings'] || null;
  mapped.dateAdded = parseDate(excelRow['Date Added']);
  mapped.autoNumber = excelRow['Auto Number'] || null;
  
  // Contact and communication
  mapped.otherPhoneNotes = excelRow['Other Phone + Notes'] || null;
  mapped.otherMailingAddress = excelRow['**Other Mailing Address**'] || null;
  
  // Marketing and promotions
  mapped.discountCode = excelRow['*Discount Code'] || null;
  mapped.discountExpiry = excelRow['*Discount Expires'] || null;
  mapped.letterDiscountCardSent = excelRow['*Ltr. Disc.Card Sent'] || null;
  mapped.postcardSent = excelRow['Postcard Sent'] || null;
  
  // Digital materials
  mapped.digitalCardQrBrochure = excelRow['Digital Card, QR Code & Brochure'] || null;
  mapped.emailDigitalCardBrochure = excelRow['Email Digital Card & Brochure'] || null;
  mapped.connectedOrFriendedMessage = excelRow['Connected or Friended/Message'] || null;
  
  // Referral system
  mapped.referralAgentStatus = excelRow['Referral Agent Status'] || null;
  mapped.referralAgentCode = excelRow['Ref. Agent Code'] || null;
  
  // Property listings - collect all Trulia links and addresses
  const listings = [];
  
  // First listing
  if (excelRow['***TRULIA*^*'] || excelRow['**Paste+Address**']) {
    listings.push({
      truliaLink: excelRow['***TRULIA*^*'] || null,
      address: excelRow['**Paste+Address**'] || null
    });
  }
  
  // Additional listings (2nd through 6th)
  for (let i = 2; i <= 6; i++) {
    let truliaKey: string;
    let addressKey: string;
    
    if (i === 5) {
      truliaKey = '5th Trulia Link';
      addressKey = '5th Address';
    } else if (i === 6) {
      truliaKey = '6th Trulia Listing';
      addressKey = '6th Address';
    } else {
      truliaKey = `${i}nd Trulia Link`;
      addressKey = `${i}nd Listing Address`;
    }
    
    if (excelRow[truliaKey] || excelRow[addressKey]) {
      listings.push({
        truliaLink: excelRow[truliaKey] || null,
        address: excelRow[addressKey] || null
      });
    }
  }
  
  mapped.listings = listings;
  
  // Legacy fields for backward compatibility
  mapped.name = mapped.fullName;
  mapped.numberOfZillowListings = mapped.zillowListingsCount ? parseInt(mapped.zillowListingsCount) || 0 : 0;
  mapped.probableCellForTexting = mapped.phoneNumber;
  mapped.zillow = mapped.zillowProfile;
  mapped.facebook = mapped.facebookProfile;
  mapped.linkedIn = mapped.linkedInProfile;
  mapped.brokerAndAddress = mapped.brokerInfo;
  mapped.discountExpires = mapped.discountExpiry ? new Date(mapped.discountExpiry) : null;
  
  // Additional fields
  mapped.rawData = excelRow;
  
  return mapped;
}

/**
 * Parse date from various formats
 */
function parseDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  
  try {
    if (typeof dateValue === 'number') {
      // Excel date serial number
      return new Date((dateValue - 25569) * 86400 * 1000);
    } else if (typeof dateValue === 'string') {
      // Try to parse as ISO string or other formats
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } else if (dateValue instanceof Date) {
      return dateValue;
    }
  } catch (error) {
    console.warn('Failed to parse date:', dateValue, error);
  }
  
  return null;
}

/**
 * Get field mapping for reference
 */
export function getFieldMapping(): Record<string, string> {
  return {
    'Name': 'fullName',
    'First Name': 'firstName',
    'Last Name': 'lastName',
    'Email': 'email',
    '📲Probable/Confirmed Cel for Texting📲': 'phoneNumber',
    'Web Page': 'webPage',
    'Zillow': 'zillowProfile',
    '**Facebook**': 'facebookProfile',
    '**LinkedIn**': 'linkedInProfile',
    'Broker & Address': 'brokerInfo',
    'Co Agent Info': 'coAgentInfo',
    'Number Of Zillow Listings': 'zillowListingsCount',
    'Date Added': 'dateAdded',
    'Auto Number': 'autoNumber',
    'Other Phone + Notes': 'otherPhoneNotes',
    '**Other Mailing Address**': 'otherMailingAddress',
    '*Discount Code': 'discountCode',
    '*Discount Expires': 'discountExpiry',
    '*Ltr. Disc.Card Sent': 'letterDiscountCardSent',
    'Postcard Sent': 'postcardSent',
    'Digital Card, QR Code & Brochure': 'digitalCardQrBrochure',
    'Email Digital Card & Brochure': 'emailDigitalCardBrochure',
    'Connected or Friended/Message': 'connectedOrFriendedMessage',
    'Referral Agent Status': 'referralAgentStatus',
    'Ref. Agent Code': 'referralAgentCode',
    '***TRULIA*^*': 'listings[0].truliaLink',
    '**Paste+Address**': 'listings[0].address'
  };
}

export default mapExcelToModel;
