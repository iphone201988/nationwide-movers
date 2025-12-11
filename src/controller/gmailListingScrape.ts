import { Request, Response } from "express";
import fs from "fs";
import GmailListing from "../model/gmailListingUrl.model";
import { loadLocalHtmlWithPuppeteer, scrapWithScrapingBee } from "../service/details.scarpping";
import { GmailMessageService, oAuth2Client, TOKEN_PATH } from "../../listingUrlGmail";
import cron from "node-cron";

export const gmailAuth = (req: Request, res: Response) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
    prompt: "consent",
  });
  res.redirect(url);
};
export const oauth2callback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const { tokens } = await oAuth2Client.getToken(code);

    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

    res.send("Token saved!");
  } catch (err) {
    console.error("OAuth error:", err);
    res.status(500).send("OAuth failed.");
  }
};
  const formatDateForGmail = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};
const getInbox = async (afterDateFormatted:string,beforeDateFormatted: string) => {
  try {
    const loadTokens = () => JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));

    const persistTokens = (nextTokens: any) =>
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(nextTokens, null, 2));

    const ensureValidTokens = async () => {
      const tokens = loadTokens();
      const { access_token, refresh_token, expiry_date } = tokens;

      if (!refresh_token) throw new Error("Missing refresh token. Re-auth required.");

      // If we still have a valid access token, reuse it
      if (access_token && expiry_date && expiry_date > Date.now() + 60_000) {
        return tokens;
      }

      // Refresh using stored refresh token
      oAuth2Client.setCredentials({ refresh_token });
      try {
        const { credentials } = await oAuth2Client.refreshAccessToken();
        const merged = { ...tokens, ...credentials };
        persistTokens(merged);
        return merged;
      } catch (err: any) {
        if (err?.response?.data?.error === "invalid_grant") {
          throw new Error(
            "Refresh token expired or revoked. Please re-run OAuth consent (GET /api/gmailAuth)."
          );
        }
        throw err;
      }
    };

    const { access_token, refresh_token } = await ensureValidTokens();
 
    const messages = await GmailMessageService.listInboxMessages({
      userId: "me",
      accessToken: access_token,
      refreshToken: refresh_token,
      maxResults: 100,
      onlyUnread: true,
      fromEmail: "from:share-property@prop.trulia.com OR from:abooker@nationwideusamovers.com",
        after: afterDateFormatted,
        before: beforeDateFormatted,
    });
    for (const message of messages) {
      console.log(`Processing message ID: ${message.id}:`, message);
        const exist =await GmailListing.findOne({messageId: message.id,isScraped:true});
        if(exist) continue;
        if(message.seeMoreUrl){
            await GmailListing.updateOne({messageId: message.id},{url:message.seeMoreUrl},{upsert:true});
        const localFile = await scrapWithScrapingBee(message.seeMoreUrl);
        // console.log("Local File Path:", localFile);
            if (localFile !== null) {
                await loadLocalHtmlWithPuppeteer(localFile);
                await GmailListing.updateOne({messageId: message.id},{isScraped:true, url:message.seeMoreUrl},{upsert:true});

                console.log(`Scraped and updated successfully.`);
            } else {
                console.log(`Failed to scrape this listing.`);
            }
        }
    }

    // console.log(messages);
    return messages;
  } catch (err) {
    console.error(err);
  }
};

// Schedule to run every day at 2 AM
cron.schedule("0 8 * * *", async () => {
  console.log("Cron job started for Gmail inbox scraping...");
     const afterDate = new Date();
    afterDate.setDate(afterDate.getDate() - 1); 
    const beforeDate = new Date();
    beforeDate.setDate(beforeDate.getDate() + 2); 
    const afterDateFormatted = formatDateForGmail(afterDate);
    const beforeDateFormatted = formatDateForGmail(beforeDate);
  console.log("Running Gmail inbox scraper...");
  await getInbox(afterDateFormatted,beforeDateFormatted);
},);

// getInbox();




// (async () => {
//   console.log("One-time Gmail inbox scraping started...");

//   const afterDate = new Date();
//   afterDate.setDate(afterDate.getDate() - 10);

//   const beforeDate = new Date();
//   beforeDate.setDate(beforeDate.getDate() + 2);

//   const afterDateFormatted = formatDateForGmail(afterDate);
//   const beforeDateFormatted = formatDateForGmail(beforeDate);

//   await getInbox(afterDateFormatted, beforeDateFormatted);

//   console.log("One-time Gmail inbox scraping finished.");
// })();