import { mapExcelToModel, MappedRealtorData } from './excelToModelMapper';

interface ExcelRow {
  [key: string]: any;
}

interface RealtorListing {
  truliaLink: string | null;
  address: string | null;
}

interface TransformedRealtor extends MappedRealtorData {
  // Additional transformation-specific fields
  notes?: string;
  category?: string;
}

// Function to determine the category from a row
function getCategoryFromRow(row: ExcelRow): string | null {
  const mainColumnValue = row['Name']?.toString() || row['Realtor Database & Daily Work']?.toString() || '';
  
  // Define the mapping of section headers to categories
  if (mainColumnValue.includes("Maria's Help")) return "Maria's Help";
  if (mainColumnValue.includes('Philadelphia Area Realtors')) return 'Philadelphia Area Realtors';
  if (mainColumnValue.includes('Opted out Do Not/TEXT LIST')) return 'Opted out Do Not/TEXT LIST';
  if (mainColumnValue.includes('Call Only or No Text Capability')) return 'Call Only or No Text Capability';
  if (mainColumnValue.includes('LinkedIn or Facebook Only')) return 'LinkedIn or Facebook Only';
  if (mainColumnValue.includes('Found Email Only')) return 'Found Email Only';
  if (mainColumnValue.includes('Realtor: Working with another Mover')) return 'Realtor: Working with another Mover';
  if (mainColumnValue.includes('Realtors Responded "No Thank You"')) return 'Realtors Responded "No Thank You"';
  if (mainColumnValue.includes('Wants Info')) return 'Wants Info';
  if (mainColumnValue.includes('Responded Favorably or "Locked In"')) return 'Responded Favorably or "Locked In"';
  if (mainColumnValue.includes('Joined Referral Program')) return 'Joined Referral Program ✨✨✨✨';
  if (mainColumnValue.includes('No Numbers Found for Realtors or Can\'t Text')) return 'No Numbers Found for Realtors or Can\'t Text';
  
  return null;
}

export function transformRowToRealtor(row: ExcelRow, currentCategory?: string): TransformedRealtor | null {
  // Skip rows that are mostly empty or are headers
  const hasData = Object.values(row).some((value: any) => 
    value && value.toString().trim().length > 0
  );
  
  if (!hasData) {
    return null; // Skip empty rows
  }

  // Get the main column value (usually contains the realtor name or section header)
  const mainColumnValue = row['Name']?.toString() || row['Realtor Database & Daily Work']?.toString() || '';
  
  // Check if this row is a section header (if so, return null but don't update category)
  const sectionHeaders = [
    'Realtor Database & Daily Work',
    'Complete Info on Realtors',
    "Maria's Help",
    'Philadelphia Area Realtors',
    'Opted out Do Not/TEXT LIST',
    'Call Only or No Text Capability',
    'LinkedIn or Facebook Only',
    'Found Email Only',
    'Realtor: Working with another Mover',
    'Realtors Responded "No Thank You"',
    'Joined Referral Program ✨✨✨✨',
    'Wants Info',
    'Responded Favorably or "Locked In"',
    'No Numbers Found for Realtors or Can\'t Text'
  ];

  // Check if this row is a section header
  if (sectionHeaders.some(header => mainColumnValue.includes(header) || mainColumnValue === header)) {
    return null;
  }

  // Skip column header rows
  const columnHeaders = [
    'Name',
    'Number Of Zillow Listings',
    'Date Added',
    'First Name',
    'Last Name',
    '***TRULIA*^*'
  ];

  if (columnHeaders.some(header => mainColumnValue === header)) {
    return null;
  }

  // Skip rows with emojis or special characters that indicate headers
  if (mainColumnValue.includes('👧') || 
      mainColumnValue.includes('🚫') || 
      mainColumnValue.includes('🙅‍♂️') ||
      mainColumnValue.includes('✨') ||
      mainColumnValue.includes('🔒') ||
      mainColumnValue.includes('📧') ||
      mainColumnValue.includes('📱') ||
      mainColumnValue.includes('💻')) {
    return null;
  }

  // Skip rows that are clearly not realtor names
  if (mainColumnValue.includes('Call Only') ||
      mainColumnValue.includes('LinkedIn or Facebook Only') ||
      mainColumnValue.includes('Found Email Only') ||
      mainColumnValue.includes('Working with another Mover') ||
      mainColumnValue.includes('Text Ready To Send') ||
      mainColumnValue.includes('Opted out') ||
      mainColumnValue.includes('Do Not') ||
      mainColumnValue.includes('No Text Capability') ||
      mainColumnValue.includes('No Numbers Found') ||
      mainColumnValue.includes('Can\'t Text')) {
    return null;
  }

  // Check if this row has essential realtor data (name in main column)
  const hasName = mainColumnValue && 
                  mainColumnValue.trim().length > 0 &&
                  !mainColumnValue.includes('👎') &&
                  !mainColumnValue.includes('👧');
  
  if (!hasName) {
    return null; // Skip rows without a name in the main column
  }

  // Additional validation: must have either phone, email, or listings to be a real realtor
  const hasPhone = row['📲Probable/Confirmed Cel for Texting📲'] && row['📲Probable/Confirmed Cel for Texting📲'].toString().trim().length > 0;
  const hasEmail = row['Email'] && row['Email'].toString().trim().length > 0;
  const hasListings = row['***TRULIA*^*'] && row['***TRULIA*^*'].toString().trim().length > 0;
  
  if (!hasPhone && !hasEmail && !hasListings) {
    return null; // Skip rows without essential contact or listing information
  }

  // Use the mapper to transform Excel data to clean model structure
  const mappedData = mapExcelToModel(row);
  
  // Add transformation-specific fields
  const transformedRealtor: TransformedRealtor = {
    ...mappedData,
    notes: `Auto Number: ${mappedData.autoNumber || 'N/A'}`,
    category: currentCategory || 'Unknown'
  };

  return transformedRealtor;
}

export default transformRowToRealtor;
