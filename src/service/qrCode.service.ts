import QRCode from "qrcode";
import fs from "fs";
import path from "path";

const STATIC_QR_FILENAME = "static_discount_qr.png";

// Helper to get project root (works in both dev and production)
const getProjectRoot = () => {
  // Check if we're in dist folder (production mode)
  if (__dirname.includes(path.join("dist", "src"))) {
    return path.join(__dirname, "../../../");
  }
  // Development mode
  return path.join(__dirname, "../../");
};

/**
 * Returns the absolute path to the static QR code file.
 * If it does not exist, it will be generated.
 *
 * NOTE: The content encoded in the QR is currently a placeholder.
 * Replace `QR_CONTENT` with the final client-approved value.
 */
export const ensureStaticQrCode = async (): Promise<string> => {
  const uploadsDir = path.join(getProjectRoot(), "uploads/qr-codes");
  const filePath = path.join(uploadsDir, STATIC_QR_FILENAME);

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    const QR_CONTENT = "https://nationwideusamovers.com"; // TODO: confirm with client
    const pngBuffer = await QRCode.toBuffer(QR_CONTENT, {
      type: "png",
      errorCorrectionLevel: "H",
      margin: 1,
      scale: 8,
    });
    fs.writeFileSync(filePath, pngBuffer);
  }

  return filePath;
};


