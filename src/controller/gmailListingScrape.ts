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
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    const { access_token, refresh_token } = tokens; 
    if (!access_token || !refresh_token) {
      throw new Error("Access token or refresh token not found.");
    }
    // console.log("Access Token:", access_token);
 
    const messages = await GmailMessageService.listInboxMessages({
      userId: "me",
      accessToken: access_token,
      refreshToken: refresh_token,
      maxResults: 100,
      onlyUnread: true,
      fromEmail: "share-property@prop.trulia.com",
        after: afterDateFormatted,
        before: beforeDateFormatted,
    });
    for (const message of messages) {
        const exist =await GmailListing.findOne({messageId: message.id,isScraped:true});
        if(exist) continue;
        if(message.seeMoreUrl){
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
cron.schedule("*/1 * * * *", async () => {
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