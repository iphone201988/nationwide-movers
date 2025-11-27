import { Request, Response } from "express";
import { GmailMessageService, oAuth2Client, TOKEN_PATH } from "../../listingUrlGmail";
import fs from "fs";
import GmailListing from "../model/gmailListingUrl.model";
import { loadLocalHtmlWithPuppeteer, scrapWithScrapingBee } from "../service/details.scarpping";

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
const getInbox = async () => {
  try {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    const { access_token, refresh_token } = tokens; 
    if (!access_token || !refresh_token) {
      throw new Error("Access token or refresh token not found.");
    }

    const messages = await GmailMessageService.listInboxMessages({
      userId: "me",
      accessToken: access_token,
      refreshToken: refresh_token,
      maxResults: 10,
      onlyUnread: true,
      fromEmail: "share-property@prop.trulia.com",
    });
    for (const message of messages) {
        const exist =await GmailListing.findById(message.id);
        if(exist) continue;
        if(message.seeMoreUrl){
        const localFile = await scrapWithScrapingBee(message.seeMoreUrl);
            if (localFile !== null) {
                await loadLocalHtmlWithPuppeteer(localFile);

                console.log(`Scraped and updated successfully.`);
            } else {
                console.log(`Failed to scrape this listing.`);
            }
        }
    }

    console.log(messages);
    return messages;
  } catch (err) {
    console.error(err);
  }
};