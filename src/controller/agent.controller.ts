import { Request, Response } from "express";
import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";
import { Realtor } from "../model/realtor.model";
import multer from "multer";
import transformRowToRealtor from "../utils/transformRealtor";
import Agent from "../model/agent.model";
import moment from "moment";
import Listing from "../model/listing.model";
import twilio from "twilio";
import "dotenv/config";
import ContactedAgent from "../model/contactedAgent.model";
import Meeting from "../model/meeting.model";
import momentTimeZone from "moment-timezone";
import * as brevo from "@getbrevo/brevo";
import { createStaticEmailTemplate } from "../utils/html.template";
import "dotenv/config";
import { getFiles } from "../utils/helper";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

interface ExcelRow {
  [key: string]: any;
}

interface ExcelData {
  sheetNames: string[];
  data: {
    [sheetName: string]: ExcelRow[];
  };
}

// Extend Request interface to include file property
interface MulterRequest extends Request {
  file?: any;
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".xlsx", ".xls"];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files (.xlsx, .xls) are allowed"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function readExcelFile(filePath: string): Promise<ExcelData> {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileExtension = path.extname(filePath).toLowerCase();
    if (fileExtension !== ".xlsx" && fileExtension !== ".xls") {
      throw new Error(
        `Invalid file type. Expected .xlsx or .xls, got: ${fileExtension}`
      );
    }

    const workbook = XLSX.readFile(filePath, {
      cellDates: true,
      cellNF: false,
      cellText: false,
      cellHTML: false,
    });

    const sheetNames = workbook.SheetNames;

    const data: { [sheetName: string]: ExcelRow[] } = {};

    sheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];

      const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");

      // Find the best header row by looking for rows with multiple meaningful column headers
      let headerRowIndex = 0;
      let foundHeaders = false;

      for (let row = 0; row <= Math.min(range.e.r, 20); row++) {
        // Check first 20 rows
        const rowData: any = {};
        let columnCount = 0;

        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];

          if (
            cell &&
            cell.v !== undefined &&
            cell.v !== null &&
            cell.v.toString().trim() !== ""
          ) {
            rowData[XLSX.utils.encode_col(col)] = cell.v;
            columnCount++;
          }
        }

        // Look for rows with multiple meaningful column headers
        if (columnCount > 1) {
          // Check if this row looks like column headers (not section titles)
          const values = Object.values(rowData);
          const hasTypicalHeaders = values.some(
            (val: any) =>
              val.toString().toLowerCase().includes("name") ||
              val.toString().toLowerCase().includes("date") ||
              val.toString().toLowerCase().includes("phone") ||
              val.toString().toLowerCase().includes("zillow") ||
              val.toString().toLowerCase().includes("listing") ||
              val.toString().toLowerCase().includes("trulia") ||
              val.toString().toLowerCase().includes("address") ||
              val.toString().toLowerCase().includes("email")
          );

          if (hasTypicalHeaders) {
            headerRowIndex = row;
            foundHeaders = true;
            console.log(`Found headers at row ${row}:`, values);
            break;
          }
        }
      }

      // Additional check: if we found headers, make sure the next row is not also headers
      if (foundHeaders) {
        // Check if the next row also looks like headers
        const nextRowData: any = {};
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({
            r: headerRowIndex + 1,
            c: col,
          });
          const cell = worksheet[cellAddress];
          if (cell && cell.v !== undefined && cell.v !== null) {
            nextRowData[XLSX.utils.encode_col(col)] = cell.v;
          }
        }

        // If next row also looks like headers, skip it
        const nextRowValues = Object.values(nextRowData);
        const nextRowIsAlsoHeaders = nextRowValues.some(
          (val: any) =>
            val.toString().toLowerCase().includes("name") ||
            val.toString().toLowerCase().includes("date") ||
            val.toString().toLowerCase().includes("phone") ||
            val.toString().toLowerCase().includes("zillow") ||
            val.toString().toLowerCase().includes("listing") ||
            val.toString().toLowerCase().includes("trulia") ||
            val.toString().toLowerCase().includes("address") ||
            val.toString().toLowerCase().includes("email")
        );

        if (nextRowIsAlsoHeaders) {
          headerRowIndex = headerRowIndex + 1;
          console.log(
            `Skipping duplicate header row, moving to row ${headerRowIndex}`
          );
        }
      }

      if (!foundHeaders) {
        headerRowIndex = 0; // Fallback to first row
        console.log("No headers found, using first row as fallback");
      }

      // Extract headers from the identified header row
      const headers: string[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({
          r: headerRowIndex,
          c: col,
        });
        const cell = worksheet[cellAddress];

        if (cell && cell.v !== undefined && cell.v !== null) {
          headers[col] = cell.v.toString().trim();
        } else {
          headers[col] = `Column_${XLSX.utils.encode_col(col)}`;
        }
      }

      // Convert sheet to JSON starting from the row after headers
      let mappedData: any[] = [];

      try {
        // Approach 1: Use numeric headers and map them
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Use numeric headers (0, 1, 2, etc.)
          range: headerRowIndex + 1, // Start from row after headers
          defval: null,
        });

        // Map the numeric headers to actual column names
        mappedData = jsonData.map((row: any) => {
          const mappedRow: any = {};
          Object.keys(row).forEach((numericKey) => {
            const columnIndex = parseInt(numericKey);
            if (columnIndex >= 0 && columnIndex < headers.length) {
              const columnName = headers[columnIndex];
              if (columnName) {
                mappedRow[columnName] = row[numericKey];
              }
            }
          });
          return mappedRow;
        });

        console.log("✅ Used numeric header approach");
      } catch (error) {
        console.log("⚠️ Numeric header approach failed, trying fallback...");

        // Approach 2: Fallback - use sheet_to_json without header option
        try {
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            range: headerRowIndex + 1,
            defval: null,
          });

          // If this approach gives us the right structure, use it
          if (jsonData.length > 0) {
            const firstRow = jsonData[0];
            const hasValidStructure = Object.keys(firstRow).some(
              (key) =>
                key !== firstRow[key] && typeof firstRow[key] !== "object"
            );

            if (hasValidStructure) {
              mappedData = jsonData;
              console.log("✅ Used fallback approach");
            } else {
              throw new Error("Fallback approach also has invalid structure");
            }
          }
        } catch (fallbackError) {
          console.error("❌ Both approaches failed:", fallbackError);
          throw new Error("Unable to parse Excel data with any method");
        }
      }

      // Debug: Log the first few rows to understand the structure
      if (mappedData.length > 0) {
        console.log("Debug - Headers:", headers);
        console.log(
          "Debug - First row structure:",
          JSON.stringify(mappedData[0], null, 2)
        );

        // Validate that keys and values are not identical
        const firstRow = mappedData[0];
        const hasIdenticalKeysValues = Object.keys(firstRow).some(
          (key) => firstRow[key] === key
        );
        if (hasIdenticalKeysValues) {
          console.warn(
            "WARNING: Some keys and values are identical. This may indicate a data structure issue."
          );
        }
      }

      // Pre-filter: Remove rows where most keys equal values (likely header rows)
      const preFilteredData = mappedData.filter((row: any) => {
        const totalKeys = Object.keys(row).length;
        const identicalKeyValuePairs = Object.keys(row).filter((key) => {
          const value = row[key];
          return (
            value !== null &&
            value !== undefined &&
            key === value.toString().trim()
          );
        }).length;

        // If more than 50% of keys equal values, this is likely a header row
        const isHeaderRow = identicalKeyValuePairs / totalKeys > 0.5;

        if (isHeaderRow) {
          console.log(
            `Pre-filtering out header row with ${identicalKeyValuePairs}/${totalKeys} identical key-value pairs`
          );
          return false;
        }

        return true;
      });

      console.log(
        `Pre-filtered from ${mappedData.length} to ${preFilteredData.length} rows`
      );
      console.log(
        `Removed ${mappedData.length - preFilteredData.length
        } header rows in pre-filter`
      );

      // Clean up the data by removing rows that are completely empty or section headers
      const cleanedData = preFilteredData.filter((row: any) => {
        // Check if row has meaningful data (not just section headers)
        const hasData = Object.values(row).some(
          (value) =>
            value !== null &&
            value !== undefined &&
            value.toString().trim() !== ""
        );

        if (!hasData) return false;

        // Check if this row is not a section header (has data in multiple columns)
        const nonEmptyColumns = Object.values(row).filter(
          (value) =>
            value !== null &&
            value !== undefined &&
            value.toString().trim() !== ""
        );

        // Skip rows where keys equal values (header rows that got processed as data)
        const hasIdenticalKeysValues = Object.keys(row).some((key) => {
          const value = row[key];
          return (
            value !== null &&
            value !== undefined &&
            key === value.toString().trim()
          );
        });

        if (hasIdenticalKeysValues) {
          console.log(
            "Skipping row with identical keys/values:",
            Object.keys(row).filter((key) => key === row[key])
          );
          return false;
        }

        return nonEmptyColumns.length > 1; // Must have data in multiple columns
      });

      // Final validation: ensure no rows with identical keys and values remain
      const finalData = cleanedData.filter((row: any) => {
        const hasIdenticalKeysValues = Object.keys(row).some((key) => {
          const value = row[key];
          return (
            value !== null &&
            value !== undefined &&
            key === value.toString().trim()
          );
        });

        if (hasIdenticalKeysValues) {
          console.log("Final filter: Removing row with identical keys/values");
          return false;
        }

        // Additional check: look for the specific header pattern you're seeing
        const specificHeaderPatterns = [
          "Name",
          "Number Of Zillow Listings",
          "Date Added",
          "First Name",
          "Last Name",
          "***TRULIA*^*",
          "**Paste+Address**",
          "📲Probable/Confirmed Cel for Texting📲",
          "Other Phone + Notes",
          "Auto Number",
          "Zillow",
          "**Facebook**",
          "**LinkedIn**",
          "Email",
          "Web Page",
          "**Other Mailing Address**",
          "Broker & Address",
          "Co Agent Info",
          "*Discount Code",
          "*Discount Expires",
          "*Ltr. Disc.Card Sent",
          "Postcard Sent",
          "2nd Trulia Link",
          "2nd Listing Address",
          "3rd Trulia Link",
          "3rd Listing Address",
          "4th Trulia Link",
          "4th Listing Address",
          "5th Trulia Link",
          "5th Address",
          "6th Trulia Listing",
          "6th Address",
          "Referral Agent Status",
          "Ref. Agent Code",
          "Digital Card, QR Code & Brochure",
          "Email Digital Card & Brochure",
          "Connected or Friended/Message",
        ];

        const matchesHeaderPattern = specificHeaderPatterns.every((pattern) => {
          return Object.values(row).some(
            (value) =>
              value !== null &&
              value !== undefined &&
              value.toString().trim() === pattern
          );
        });

        if (matchesHeaderPattern) {
          console.log(
            "Final filter: Removing row that matches exact header pattern"
          );
          return false;
        }

        return true;
      });

      console.log(`Final data: ${finalData.length} rows after all filtering`);

      // Log a sample of the final data to verify structure
      if (finalData.length > 0) {
        console.log(
          "Sample final row structure:",
          JSON.stringify(finalData[0], null, 2)
        );
      }

      data[sheetName] = finalData;
    });

    return {
      sheetNames,
      data,
    };
  } catch (error) {
    throw new Error(
      `Error reading Excel file: ${error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function readExcelSheet(
  filePath: string,
  sheetName: string
): Promise<ExcelRow[]> {
  try {
    const excelData = await readExcelFile(filePath);

    if (!excelData.data[sheetName]) {
      throw new Error(
        `Sheet '${sheetName}' not found. Available sheets: ${excelData.sheetNames.join(
          ", "
        )}`
      );
    }

    return excelData.data[sheetName];
  } catch (error) {
    throw new Error(
      `Error reading sheet '${sheetName}': ${error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function getExcelInfo(
  filePath: string
): Promise<{ sheetNames: string[]; totalSheets: number }> {
  try {
    const excelData = await readExcelFile(filePath);

    return {
      sheetNames: excelData.sheetNames,
      totalSheets: excelData.sheetNames.length,
    };
  } catch (error) {
    throw new Error(
      `Error getting Excel info: ${error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function uploadAndAnalyzeExcel(
  req: MulterRequest,
  res: Response
): Promise<void> {
  try {
    // Use multer middleware to handle file upload
    upload.single("excelFile")(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              success: false,
              message: "File size too large. Maximum size is 10MB",
            });
          }
        }
        return res.status(400).json({
          success: false,
          message: err.message || "File upload error",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded. Please select an Excel file.",
        });
      }

      const filePath = req.file.path;

      try {
        // Read and analyze the Excel file
        const excelData = await readExcelFile(filePath);

        // Get all data from the first sheet (assuming single sheet)
        const sheetName = excelData.sheetNames[0];
        const allRows = excelData.data[sheetName] || [];

        console.log(`Processing ${allRows.length} rows from Excel file`);

        // Transform and save all valid rows to database
        let currentCategory = "Unknown";
        let processedCount = 0;
        let savedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const row of allRows) {
          try {
            processedCount++;

            // Check if this row is a category header
            const category = getCategoryFromRow(row);
            if (category) {
              currentCategory = category;
              console.log(`Found category: ${currentCategory}`);
              continue;
            }

            // Transform the row to realtor data
            const transformedRealtor = transformRowToRealtor(
              row,
              currentCategory
            );

            if (!transformedRealtor) {
              skippedCount++;
              continue;
            }

            // Check if realtor already exists (by name and phone)
            const existingRealtor = await Realtor.findOne({
              $or: [
                { fullName: transformedRealtor.fullName },
                { name: transformedRealtor.name },
                { phoneNumber: transformedRealtor.phoneNumber },
                {
                  probableCellForTexting:
                    transformedRealtor.probableCellForTexting,
                },
              ],
            });

            if (existingRealtor) {
              // Update existing realtor
              await Realtor.findByIdAndUpdate(
                existingRealtor._id,
                transformedRealtor,
                { new: true }
              );
              console.log(
                `Updated existing realtor: ${transformedRealtor.fullName || transformedRealtor.name
                }`
              );
            } else {
              // Create new realtor
              const newRealtor = new Realtor(transformedRealtor);
              await newRealtor.save();
              console.log(
                `Created new realtor: ${transformedRealtor.fullName || transformedRealtor.name
                }`
              );
            }

            savedCount++;
          } catch (rowError) {
            errorCount++;
            console.error(`Error processing row ${processedCount}:`, rowError);
            console.error("Row data:", row);
          }
        }

        // Clean up the uploaded file
        fs.unlinkSync(filePath);

        res.status(200).json({
          success: true,
          message: "Excel file processed and saved successfully",
          data: {
            fileName: req.file.originalname,
            fileSize: req.file.size,
            totalRows: allRows.length,
            processedRows: processedCount,
            savedRows: savedCount,
            skippedRows: skippedCount,
            errorRows: errorCount,
            sheetName: sheetName,
          },
        });
      } catch (analysisError) {
        // Clean up the uploaded file even if analysis fails
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        throw analysisError;
      }
    });
  } catch (error) {
    console.error("Error in uploadAndAnalyzeExcel:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

function getCategoryFromRow(row: ExcelRow): string | null {
  const mainColumnValue =
    row["Name"]?.toString() ||
    row["Realtor Database & Daily Work"]?.toString() ||
    "";

  // Define the mapping of section headers to categories
  if (mainColumnValue.includes("Maria's Help")) return "Maria's Help";
  if (mainColumnValue.includes("Philadelphia Area Realtors"))
    return "Philadelphia Area Realtors";
  if (mainColumnValue.includes("Opted out Do Not/TEXT LIST"))
    return "Opted out Do Not/TEXT LIST";
  if (mainColumnValue.includes("Call Only or No Text Capability"))
    return "Call Only or No Text Capability";
  if (mainColumnValue.includes("LinkedIn or Facebook Only"))
    return "LinkedIn or Facebook Only";
  if (mainColumnValue.includes("Found Email Only")) return "Found Email Only";
  if (mainColumnValue.includes("Realtor: Working with another Mover"))
    return "Realtor: Working with another Mover";
  if (mainColumnValue.includes('Realtors Responded "No Thank You"'))
    return 'Realtors Responded "No Thank You"';
  if (mainColumnValue.includes("Wants Info")) return "Wants Info";
  if (mainColumnValue.includes('Responded Favorably or "Locked In"'))
    return 'Responded Favorably or "Locked In"';
  if (mainColumnValue.includes("Joined Referral Program"))
    return "Joined Referral Program ✨✨✨✨";
  if (mainColumnValue.includes("No Numbers Found for Realtors or Can't Text"))
    return "No Numbers Found for Realtors or Can't Text";

  return null;
}

export const home = async (req: Request, res: Response): Promise<any> => {
  try {
    // --- Pagination ---
    const limit = req.query.limit
      ? parseInt(req.query.limit.toString(), 10)
      : 10;
    const page = req.query.page ? parseInt(req.query.page.toString(), 10) : 1;

    // --- Query flags ---
    const all = req.query.all === "true";
    const search = req.query.search?.toString() || "";
    const feedback = req.query.feedback
      ? Number(req.query.feedback)
      : undefined;

    // --- Build MongoDB query ---
    const qry: any = {};

    // Feedback filter
    if (!isNaN(feedback!)) {
      qry.feedback = feedback;
    }

    // Search filter
    if (search) {
      qry.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { brokerage: { $regex: search, $options: "i" } },
      ];
    }

    // Only apply today's date filter if `all` is NOT true
    if (!all && feedback === undefined) {
      const today = moment().startOf("day");
      qry.createdAt = {
        $gte: today.toDate(),
        $lt: moment(today).endOf("day").toDate(),
      };
    }

    console.log("Query being executed:", qry);

    // --- Fetch from DB ---
    const agents = await Agent.find(qry)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalAgents = await Agent.countDocuments(qry);

    res.status(200).json({
      success: true,
      message: "All agents fetched successfully",
      data: agents,
      total: totalAgents,
      page,
      pages: Math.ceil(totalAgents / limit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const newAgents = async (req: Request, res: Response): Promise<any> => {
  try {
    const today = moment().startOf("day");

    let qry = {};

    if (req.query.search) {
      const search = req.query.search.toString();
      qry = {
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
          { brokerage: { $regex: search, $options: "i" } },
        ],
      };
    }

    const newAgent = await Agent.find({
      ...qry,
      createdAt: {
        $gte: today.toDate(),
        $lt: moment(today).endOf("day").toDate(),
      },
    })
      .sort({ createdAt: -1 })
      .limit(15);

    res.status(200).json({
      success: true,
      message: "New Agent fetched successfully",
      data: newAgent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAgentDetails = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const id = req.params.id;
    const agent = await Agent.findById(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    const listings = await Listing.aggregate([
      { $match: { agentId: agent._id } },
      { $sample: { size: 10 } },
    ]);

    const contactedAgent = await ContactedAgent.findOne({ agentId: agent._id });
    let contactedAt = null;
    if (contactedAgent) {
      contactedAt = contactedAgent.contactedAt;
    }

    return res.status(200).json({
      success: true,
      agent: {
        ...agent.toObject(),
        contactedAt,
        listings,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAllProperty = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const limit = req.query.limit
      ? parseInt(req.query.limit.toString(), 10)
      : 10;
    const page = req.query.page ? parseInt(req.query.page.toString(), 10) : 1;

    let qry: any = {};

    if (req.query.search) {
      const search = req.query.search.toString();
      qry.$or = [
        { title: { $regex: search, $options: "i" } },
        { price: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { communityDescription: { $regex: search, $options: "i" } },
      ];
    }

    const listing = await Listing.find(qry)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const filteredListing = await Promise.all(
      listing.map(async (item) => {
        const agent = await Agent.findById(item.agentId).select(
          "_id fullName phoneNumber address brokerage image"
        );

        return {
          ...item.toObject(),
          agentId: agent?._id || null,
          fullName: agent?.fullName || null,
          phoneNumber: agent?.phoneNumber || null,
          brokerage: agent?.brokerage || null,
          image: agent?.image || null,
        };
      })
    );

    const totalListing = await Listing.countDocuments(qry);

    res.status(200).json({
      success: true,
      message: "Properties fetched successfully",
      listing: filteredListing,
      page,
      totalPage: Math.ceil(totalListing / limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const newProperty = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const today = moment().startOf("day");

    let qry: any = {};

    if (req.query.search) {
      const search = req.query.search.toString();
      qry.$or = [
        { title: { $regex: search, $options: "i" } },
        { price: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { communityDescription: { $regex: search, $options: "i" } },
      ];
    }

    const newListing = await Listing.find({
      ...qry,
      createdAt: {
        $gte: today.toDate(),
        $lt: moment(today).endOf("day").toDate(),
      },
    })
      .sort({ createdAt: -1 })
      .limit(15);

    const filteredNewProperty = await Promise.all(
      newListing.map(async (item) => {
        const agent = await Agent.findById(item.agentId).select(
          "_id fullName phoneNumber address brokerage image"
        );
        return {
          ...item.toObject(),
          agentId: agent?._id || null,
          fullName: agent?.fullName || null,
          phoneNumber: agent?.phoneNumber || null,
          brokerage: agent?.brokerage || null,
          image: agent?.image || null,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "New Properties fetched successfully",
      newListing: filteredNewProperty,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getPropertyDetail = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id).lean(); // lean for performance
    if (!listing) {
      res.status(404).json({
        success: false,
        message: "Listing not found",
      });
      return;
    }

    const agent = await Agent.findById(listing.agentId)
      .select("_id fullName phoneNumber address brokerage image")
      .lean();

    const responseData = {
      ...listing,
      fullName: agent?.fullName || null,
      phoneNumber: agent?.phoneNumber || null,
      brokerage: agent?.brokerage || null,
      image: agent?.image || null,
    };

    res.status(200).json({
      success: true,
      message: "Lisitng detail fetched successfully",
      listing: responseData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const sendSMS = async (req: Request, res: Response) => {
  try {
    const { agentId, body } = req.body;

    const agent = await Agent.findById(agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    let message = body;

    const countryCode = agent?.countryCode || "+1";
    const phoneNumber = agent?.phoneNumber?.replace(/\D/g, "") || "";

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_FROM,
      to: `${countryCode}${phoneNumber}`,
    });


    //Add in the contacted model
    await ContactedAgent.create({ agentId });

    res.status(200).json({ success: true, message: "SMS sent successfully" });
  } catch (error) {
    console.log(error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendBulkSMS = async (req: Request, res: Response) => {
  try {
    const {
      agentId,
      message,
      totalCount, // number of SMS to send
      randomDelay,
      minDelay, // in seconds
      maxDelay, // in seconds
    } = req.body;

    if (!message || !totalCount) {
      return res.status(400).json({
        success: false,
        message: "Recipient, message, and total count are required",
      });
    }

    const agent = await Agent.findById(agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    let sanitizedMinDelay = minDelay < 1 ? 1 : minDelay;
    let sanitizedMaxDelay =
      maxDelay < sanitizedMinDelay ? sanitizedMinDelay : maxDelay;
    sanitizedMaxDelay = sanitizedMaxDelay > 30 ? 30 : sanitizedMaxDelay;

    const countryCode = agent?.countryCode || "+1";
    const phoneNumber = agent?.phoneNumber?.replace(/\D/g, "") || "";

    for (let i = 0; i < totalCount; i++) {
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_FROM,
        to: `${countryCode}${phoneNumber}`,
      });

      if (i !== totalCount - 1) {
        let delayInSeconds: number;
        if (randomDelay) {
          delayInSeconds =
            Math.floor(Math.random() * (sanitizedMaxDelay - 1 + 1)) + 1;
        } else {
          delayInSeconds = sanitizedMinDelay;
        }
        await new Promise((r) => setTimeout(r, delayInSeconds * 1000));
      }
    }

    return res.json({ success: true, message: "Bulk SMS processing started" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to send messages" });
  }
};

export const getAllContactedAgent = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const [agents, total] = await Promise.all([
      ContactedAgent.find()
        .populate("agentId", "fullName email phoneNumber countryCode image")
        .sort({ contactedAt: -1 })
        .skip(skip)
        .limit(limit),
      ContactedAgent.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      data: agents,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
};

export const givefeedback = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { agentId, feedback } = req.body; // 1 = Positive Feedback, 2 = Neutral Feedback, 3 = Negative Feedback

    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }
    agent.feedback = feedback;
    await agent.save();
    return res.status(200).json({
      success: true,
      message: "Feedback given successfully",
      agent,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const addMeeting = async (req: Request, res: Response): Promise<any> => {
  try {
    const { agentId, meetingDate, meetingTime } = req.body;

    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }
    await Meeting.create({ agentId, meetingDate, meetingTime });
    return res.status(200).json({
      success: true,
      message: "Meeting added successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const markMeetingCompleted = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { meetingId } = req.body;
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }
    meeting.isCompleted = true;
    await meeting.save();
    return res.status(200).json({
      success: true,
      message: "Meeting marked as completed successfully",
      meeting,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAllMeetings = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const [meetings, total] = await Promise.all([
      Meeting.find()
        .populate("agentId", "fullName email phoneNumber countryCode")
        .sort({ meetingDate: -1, meetingTime: -1 })
        .skip(skip)
        .limit(limit)
        .sort({ meetingDate: -1, meetingTime: -1 }),
      Meeting.countDocuments(),
    ]);
    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      data: meetings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const agentUpdate = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const agentId = req.params.id;

    console.log(agentId);

    const {
      phoneNumber,
      email,
      link,
      comment,
      address,
      zillow,
      linkedIn,
      facebook,
      webLink,
      listingLink,
      other,
      raState,
      closestCity,
      discountCodeCoupon,
      raMailingAddress,
      referredBy,
      numberOfListings,
      countryCode
    } = req.body;

    console.log("req.body:::", req.body);

    const agent = await Agent.findById(agentId);

    if (!agent) {
      return res.status(404).json({
        success: true,
        message: "agent not exist",
      });
    }

    const files = getFiles(req, [
      "letter",
      "discountCard",
      "brochure",
      "otherFile",
      "profileImage"
    ]);
    console.log("files;:::::", files);

    if (phoneNumber) {
      agent.phoneNumber = phoneNumber;
    }
    if (email) {
      agent.email = email;
    }
    if (link) {
      agent.link = link;
    }
    if (numberOfListings) {
      agent.numberOfListings = numberOfListings;
    }
    if (comment) {
      agent.comment = comment;
    }
    if (address) {
      agent.address = address;
    }
    if (zillow) {
      agent.zillow = zillow;
    }
    if (linkedIn) {
      agent.linkedIn = linkedIn;
    }
    if (facebook) {
      agent.facebook = facebook;
    }
    if (webLink) {
      agent.webLink = webLink;
    }
    if (listingLink) {
      agent.listingLink = listingLink;
    }
    if (other) {
      agent.other = other;
    }
    if (raState) {
      agent.raState = raState;
    }
    if (closestCity) {
      agent.closestCity = closestCity;
    }
    if (discountCodeCoupon) {
      agent.discountCodeCoupon = discountCodeCoupon;
    }
    if (raMailingAddress) {
      agent.raMailingAddress = raMailingAddress;
    }
    if (referredBy) {
      agent.referredBy = referredBy;
    }

    if (files?.letter && files?.letter.length) {
      agent.letter = files?.letter[0];
    }
    if (files?.discountCard && files?.discountCard.length) {
      agent.discountCard = files?.discountCard[0];
    }
    if (files?.brochure && files?.brochure.length) {
      agent.brochure = files?.brochure[0];
    }
    if (files?.otherFile && files?.otherFile.length) {
      agent.otherFile = files?.otherFile[0];
    }
    if (files?.profileImage && files?.profileImage?.length) {
      agent.profileImage = files?.profileImage[0];
    }
    if (countryCode) {
      agent.countryCode = countryCode;
    }


    await agent.save();

    res.status(200).json({
      success: true,
      message: "agent updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const agentAdd = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      fullName,
      brokerage,
      feedback,
      timezone,
      phoneNumber,
      email,
      link,
      comment,
      address,
      zillow,
      linkedIn,
      facebook,
      webLink,
      listingLink,
      other,
      raState,
      closestCity,
      discountCodeCoupon,
      raMailingAddress,
      referredBy,
      numberOfListings,
    } = req.body;

    const agent: any = {};

    const files = getFiles(req, [
      "letter",
      "discountCard",
      "brochure",
      "otherFile",
      "profileImage"
    ]);

    if (fullName) {
      agent.fullName = fullName;
    }
    if (brokerage) {
      agent.brokerage = brokerage;
    }
    if (feedback) {
      agent.feedback = feedback;
    }
    if (timezone) {
      agent.timezone = timezone;
    }
    if (phoneNumber) {
      agent.phoneNumber = phoneNumber;
    }
    if (email) {
      agent.email = email;
    }
    if (numberOfListings) {
      agent.numberOfListings = numberOfListings;
    }
    if (link) {
      agent.link = link;
    }
    if (comment) {
      agent.comment = comment;
    }
    if (address) {
      agent.address = address;
    }
    if (zillow) {
      agent.zillow = zillow;
    }
    if (linkedIn) {
      agent.linkedIn = linkedIn;
    }
    if (facebook) {
      agent.facebook = facebook;
    }
    if (webLink) {
      agent.webLink = webLink;
    }
    if (listingLink) {
      agent.listingLink = listingLink;
    }
    if (other) {
      agent.other = other;
    }
    if (raState) {
      agent.raState = raState;
    }
    if (closestCity) {
      agent.closestCity = closestCity;
    }
    if (discountCodeCoupon) {
      agent.discountCodeCoupon = discountCodeCoupon;
    }
    if (raMailingAddress) {
      agent.raMailingAddress = raMailingAddress;
    }
    if (referredBy) {
      agent.referredBy = referredBy;
    }

    if (files?.letter && files?.letter.length) {
      agent.letter = files?.letter[0];
    }
    if (files?.discountCard && files?.discountCard.length) {
      agent.discountCard = files?.discountCard[0];
    }
    if (files?.brochure && files?.brochure.length) {
      agent.brochure = files?.brochure[0];
    }
    if (files?.otherFile && files?.otherFile.length) {
      agent.otherFile = files?.otherFile[0];
    }
    if (files?.profileImage && files?.profileImage.length) {
      agent.profileImage = files?.profileImage[0];
    }

    await Agent.create(agent);

    res.status(200).json({
      success: true,
      message: "Agenet created successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// export const emailAgents = async (req: Request, res: Response): Promise<any> => {
//     try {
//         const { agentId, message, email, fullName, phoneNumber } = req.body;

//         if (!agentId || !message) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Agent ID and message are required"
//             });
//         }

//         if (!process.env.BREVO_API_KEY) {
//             throw new Error('Missing BREVO_API_KEY environment variable.');
//         }

//         const agent = await Agent.findById(agentId);

//         if (!agent) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Agent not found"
//             });
//         }

//         if (!agent.email) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Agent email not found"
//             });
//         }

//         const staticSenderDetails = {
//             senderName: fullName || "Anthony Booker",
//             senderTitle: "Realtor Relations Manager",
//             senderCompany: "Nationwide USA Movers",
//             senderEmail: email || "abooker@nationwideusamovers.com",
//             senderPhone: phoneNumber || "(555) 123-4567",
//             serviceType: "Professional Moving Services",
//             headerColor: "#2c5aa0",
//             accentColor: "#1e3a8a"
//         };

//         const htmlContent = createStaticEmailTemplate({
//             recipientCompany: agent.brokerage || agent.fullName || "Valued Partner",
//             recipientName: agent.fullName,
//             recipientAddress: agent.address,
//             ...staticSenderDetails,
//             message: message
//         });

//         let apiInstance = new brevo.TransactionalEmailsApi() as any;
//         let apiKey = apiInstance.authentications['apiKey'];
//         apiKey.apiKey = process.env.BREVO_API_KEY;

//         let emailCampaigns = new brevo.SendSmtpEmail();
//         emailCampaigns.subject = `Partnership Opportunity - ${staticSenderDetails.senderCompany}`;
//         emailCampaigns.sender = {
//             name: `${staticSenderDetails.senderName} - ${staticSenderDetails.senderCompany}`,
//             email: staticSenderDetails.senderEmail
//         };
//         emailCampaigns.to = [{
//             email: agent.email,
//             name: agent.fullName || "Valued Partner"
//         }];
//         emailCampaigns.htmlContent = htmlContent;

//         const response = await apiInstance.sendTransacEmail(emailCampaigns) as any;

//         await Agent.findByIdAndUpdate(agentId, {
//             comment: `Email sent on ${new Date().toISOString()}: ${message.substring(0, 50)}...`
//         });

//         return res.status(200).json({
//             success: true,
//             message: "Email sent successfully",
//             messageId: response.messageId,
//             sentTo: {
//                 email: agent.email,
//                 name: agent.fullName,
//                 brokerage: agent.brokerage
//             }
//         });

//     } catch (error) {
//         console.error('Email sending error:', error);
//         return res.status(500).json({
//             success: false,
//             message: error instanceof Error ? error.message : "Unknown error",
//         });
//     }
// };

export const emailAgents = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { agentId, message, email, fullName, phoneNumber } = req.body;

    if (!agentId || !message) {
      return res.status(400).json({
        success: false,
        message: "Agent ID and message are required",
      });
    }

    if (!process.env.BREVO_API_KEY) {
      throw new Error("Missing BREVO_API_KEY environment variable.");
    }

    const agent = await Agent.findById(agentId);

    if (!agent) {
      return res
        .status(404)
        .json({ success: false, message: "Agent not found" });
    }

    if (!agent.email) {
      return res
        .status(400)
        .json({ success: false, message: "Agent email not found" });
    }

    const staticSenderDetails = {
      senderName: fullName || "Anthony Booker",
      senderTitle: "Manager",
      senderCompany: "Nationwide USA Movers",
      senderEmail: "movingbiz@aol.com",
      senderPhone: phoneNumber || "+19177741655",
      serviceType: "Professional Moving Services",
      headerColor: "#2c5aa0",
      accentColor: "#1e3a8a",
    };

    const htmlContent = createStaticEmailTemplate({
      recipientCompany: agent.brokerage || agent.fullName || "Valued Partner",
      recipientName: agent.fullName,
      recipientAddress: agent.address,
      ...staticSenderDetails,
      message: message,
    });

    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    let emailCampaigns = new brevo.SendSmtpEmail();

    emailCampaigns.subject = `Partnership Opportunity - ${staticSenderDetails.senderCompany}`;
    emailCampaigns.sender = {
      name: `${staticSenderDetails.senderName} - ${staticSenderDetails.senderCompany}`,
      email: staticSenderDetails.senderEmail,
    };
    emailCampaigns.replyTo = {
      name: "Anthony Booker",
      email: "movingbiz@aol.com", // replies go here
    };
    emailCampaigns.to = [
      {
        email: agent.email,
        name: agent.fullName || "Valued Partner",
      },
    ];
    emailCampaigns.htmlContent = htmlContent;

    const response = (await apiInstance.sendTransacEmail(
      emailCampaigns
    )) as any;

    await Agent.findByIdAndUpdate(agentId, {
      comment: `Email sent on ${new Date().toISOString()}: ${message.substring(
        0,
        50
      )}...`,
    });

    console.log("response", response.body.messageId);

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
      messageId: response.messageId,
      sentTo: {
        email: agent.email,
        name: agent.fullName,
        brokerage: agent.brokerage,
      },
    });
  } catch (error) {
    console.error("Email sending error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const agentController = {
  readExcelFile,
  readExcelSheet,
  getExcelInfo,
  uploadAndAnalyzeExcel,
};
