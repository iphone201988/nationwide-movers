import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import sharp from "sharp";
import { IAgent } from "../model/agent.model";
import { ensureStaticQrCode } from "./qrCode.service";

// Helper to get project root (works in both dev and production)
const getProjectRoot = () => {
  // Check if we're in dist folder (production mode)
  if (__dirname.includes(path.join("dist", "src"))) {
    return path.join(__dirname, "../../../");
  }
  // Development mode
  return path.join(__dirname, "../../");
};

const CARDS_BASE_DIR = path.join(getProjectRoot(), "uploads/discount-cards");

const ensureDirs = () => {
  const pdfDir = path.join(CARDS_BASE_DIR, "pdf");
  const jpegDir = path.join(CARDS_BASE_DIR, "jpeg");

  if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
  if (!fs.existsSync(jpegDir)) fs.mkdirSync(jpegDir, { recursive: true });

  return { pdfDir, jpegDir };
};

const buildCardHtml = (agent: IAgent, qrPublicUrl: string): string => {
  const discountCode = agent.discountCodeCoupon || "AA-1111";

  return `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Move Discount Card</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f3f3f3;
            margin: 0;
            padding: 20px 0;
        }

        .wrapper {
            width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 40px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
            overflow: hidden;
        }

        .section {
            padding: 26px 40px;
        }

        .top-border {
            border-bottom: 1px solid #e0e0e0;
        }

        .card-header {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .logo {
            width: 150px;
            height: auto;
        }

        .card-titles {
            flex: 1;
            text-align: center;
        }

        .card-titles h1 {
            margin: 0 0 6px;
            font-size: 30px;
            color: #181656;
            letter-spacing: 0.5px;
        }

        .subtitle-main {
            margin: 0;
            font-size: 20px;
            color: #181656;
            font-weight: 600;
            margin-top: 12px;
        }

        .subtitle-sub {
            margin: 12px 0 0;
            font-size: 16px;
            color: #181656;
            font-weight: 600;
        }

        .content-row {
            display: flex;
            justify-content: space-between;
            margin-top: 14px;
            gap: 40px;
        }

        .services {
            margin: 0;
            padding-left: 22px;
            font-size: 15px;
            color: #181656;
        }

        .code-block {
            text-align: center;
            flex: 1;
        }

        .code-title {
            font-size: 18px;
            color: #181656;
            margin: 4px 0 8px;
            font-weight: 600;
        }

        .discount-code {
            font-size: 36px;
            font-weight: 700;
            color: #ab1c10;
            margin: 0;
        }

        .contact {
            font-size: 13px;
            color: #181656;
            margin: 8px 0 0;
        }

        .contact span {
            text-decoration: underline;
        }

        /* Activation section */
        .activation-header {
            font-size: 22px;
            font-weight: 700;
            color: #181656;
            margin: 0 0 4px;
        }

        .activation-subtitle {
            font-size: 16px;
            font-weight: 700;
            color: #181656;
            margin: 0 0 14px;
        }

        .activation-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 40px;
        }

        .steps {
            font-size: 15px;
            color: #181656;
            flex: 1;
        }

        .steps ol {
            margin: 0;
            padding-left: 22px;
        }

        .qr-wrapper {
            flex-shrink: 0;
        }

        .qr-wrapper img {
            width: 240px;
            height: 240px;
        }

        .bottom-container {
            display: flex;
            gap: 12px;
        }
    </style>
</head>

<body>
    <div class="wrapper">
        <!-- Top section -->
        <div class="section top-border">
            <div class="card-header">
                <img src="https://www.nationwideusamovers.com/wp-content/uploads/2021/01/Logo-768x666.png"
                    alt="Nationwide USA Movers" class="logo" />
                <div class="card-titles">
                    <h1>MOVE DISCOUNT CARD</h1>
                    <p class="subtitle-main">FREE MOVING ESTIMATE</p>
                    <p class="subtitle-sub">UP TO 40% DISCOUNT ON MOVING</p>
                </div>
            </div>
            <div class="content-row">
                <ul class="services">
                    <li>Local Moves</li>
                    <li>Long Distance Moves</li>
                    <li>Storage</li>
                    <li>Moving Help</li>
                </ul>
                <div class="code-block">
                    <p class="code-title">MOVE DISCOUNT CODE</p>
                    <p class="discount-code">${discountCode}</p>
                </div>
            </div>
            <p class="contact">
                Click to CALL/TEXT: <span>1-800-976-6833</span>
            </p>
            <p class="contact">
                Click to CHAT or SET UP APPOINTMENT:
                <span>www.nationwideusamovers.com</span>
            </p>
        </div>

        <!-- Bottom activation section -->
        <div class="section bottom-container">
            <div class="activation-content-container">
                <p class="activation-header">Activate Client Discounts</p>
                <p class="activation-subtitle">In 4 easy steps</p>
                <div class="activation-row">
                    <div class="steps">
                        <ol>
                            <li>Take a snapshot picture,</li>
                            <li>
                                Go to your phone photo gallery, press and hold the QR code (for
                                few seconds)
                            </li>
                            <li>Click on messages</li>
                            <li>Fill the quick form and send</li>
                        </ol>
                    </div>
                </div>
            </div>

            <div class="qr-wrapper">
                <img src="${qrPublicUrl}" alt="Discount QR Code" />
            </div>
        </div>
    </div>
</body>

</html>
`;
};

/**
 * Generate or regenerate the discount card for an agent.
 * Checks if card already exists before generating.
 * Returns relative paths (from project root) to PDF and JPEG files.
 */
export const generateDiscountCardForAgent = async (
  agent: IAgent,
  forceRegenerate: boolean = false
): Promise<{ pdfRelativePath: string; jpegRelativePath: string }> => {
  // Check if card already exists and files are valid
  if (!forceRegenerate && agent.discountCardPdf && agent.discountCardJpeg) {
    const projectRoot = getProjectRoot();
    const existingPdfPath = path.join(projectRoot, agent.discountCardPdf);
    const existingJpegPath = path.join(projectRoot, agent.discountCardJpeg);

    // Verify both files actually exist on disk
    if (fs.existsSync(existingPdfPath) && fs.existsSync(existingJpegPath)) {
      console.log(`✅ Discount card already exists for agent ${agent._id}, skipping generation`);
      return {
        pdfRelativePath: agent.discountCardPdf,
        jpegRelativePath: agent.discountCardJpeg,
      };
    } else {
      console.log(`⚠️ Discount card paths exist in DB but files missing, regenerating...`);
    }
  }

  const { pdfDir, jpegDir } = ensureDirs();

  const timestamp = Date.now();
  const safeName = (agent.fullName || "Agent").replace(/[^a-z0-9]+/gi, "_");

  const pdfFilename = `DiscountCard_${safeName}_${timestamp}.pdf`;
  const jpegFilename = `DiscountCard_${safeName}_${timestamp}.jpg`;

  const pdfPath = path.join(pdfDir, pdfFilename);
  const jpegPath = path.join(jpegDir, jpegFilename);

  const qrFilePath = await ensureStaticQrCode();

  // Embed QR as a data URL so Puppeteer can render it without needing a server
  const qrBuffer = fs.readFileSync(qrFilePath);
  const qrBase64 = qrBuffer.toString("base64");
  const qrDataUrl = `data:image/png;base64,${qrBase64}`;

  const html = buildCardHtml(agent, qrDataUrl);

  const browser  = await puppeteer.launch({
    headless: true, // or 'new' depending on puppeteer version
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-features=VizDisplayCompositor",
    ],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  await page.pdf({
    path: pdfPath,
    format: "A5",
    printBackground: true,
  });

  const screenshotBuffer = await page.screenshot({
    type: "jpeg",
    quality: 80,
    fullPage: true,
  });

  await browser.close();

  await sharp(screenshotBuffer).jpeg({ quality: 80 }).toFile(jpegPath);

  const projectRoot = getProjectRoot();
  const pdfRelativePath = path.relative(projectRoot, pdfPath);
  const jpegRelativePath = path.relative(projectRoot, jpegPath);

  console.log(`✅ Generated discount card for agent ${agent._id}: ${pdfRelativePath}`);

  return { pdfRelativePath, jpegRelativePath };
};


