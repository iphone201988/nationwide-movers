// index.ts
import fs from "fs";
import path from "path";
import { google, gmail_v1 } from "googleapis";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import * as cheerio from "cheerio";
import { fileURLToPath } from "url";

const __filename = path.resolve();
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ----------------------------------------------------
// Paths
// ----------------------------------------------------
const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");
export const TOKEN_PATH = path.join(__dirname, "token.json");

// ----------------------------------------------------
// Validate credentials.json
// ----------------------------------------------------
if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.error("ERROR: credentials.json not found in project root.");
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
const { client_id, client_secret, redirect_uris } = credentials.web;

// OAuth client
export const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  "http://nwmovers-scraping.com:8000/api/oauth2callback"
);

// ----------------------------------------------------
// Gmail Client
// ----------------------------------------------------
const getGmailClient = (accessToken: string, refreshToken: string) => {
  oAuth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.gmail({ version: "v1", auth: oAuth2Client });
};

// ----------------------------------------------------
// Helpers
// ----------------------------------------------------
const decodeBody = (body: gmail_v1.Schema$MessagePartBody | undefined): string => {
  if (!body?.data) return "";
  const data = body.data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(data, "base64").toString("utf-8");
};

const extractHtmlFromPayload = (payload?: gmail_v1.Schema$MessagePart): string => {
  if (!payload) return "";

  if (payload.mimeType === "text/html" && payload.body) {
    return decodeBody(payload.body);
  }

  if (payload.parts?.length) {
    for (const part of payload.parts) {
      const html = extractHtmlFromPayload(part);
      if (html) return html;
    }
  }

  return "";
};

const extractSeeMoreLink = (html: string | null): string | null => {
  if (!html) return null;

  const $ = cheerio.load(html);
  const anchor = $("a")
    .filter((_, el) => $(el).text().trim().toLowerCase().includes("see more"))
    .first();

  return anchor.attr("href") || null;
};

// ----------------------------------------------------
// Gmail Message Service Interface
// ----------------------------------------------------
interface ListInboxOptions {
  userId: string;
  accessToken: string;
  refreshToken: string;
  maxResults?: number;
  onlyUnread?: boolean;
  fromEmail?: string | null;
}

// ----------------------------------------------------
// Gmail Message Service
// ----------------------------------------------------
export class GmailMessageService {
  static async listInboxMessages(options: ListInboxOptions) {
    const {
      userId,
      accessToken,
      refreshToken,
      maxResults = 10,
      onlyUnread = false,
      fromEmail = null,
    } = options;

    try {
      const gmail = getGmailClient(accessToken, refreshToken);

      const labelIds = onlyUnread ? ["INBOX", "UNREAD"] : ["INBOX"];

      let query = "";
      if (onlyUnread && fromEmail) {
        query = `from:${fromEmail} is:unread after:2025/11/26 before:2025/11/28`;
      }

      const list = await gmail.users.messages.list({
        userId,
        labelIds,
        maxResults,
        q: query || undefined,
      });

      const messageIds = list.data.messages?.map((m) => m.id) || [];
      if (messageIds.length === 0) return [];

      const final = [];

      for (const id of messageIds) {
        const msgRes = await gmail.users.messages.get({
          userId,
          id,
          format: "full",
        });

        const msg = msgRes.data;
        if (!msg?.payload) continue;

        const headers = msg.payload.headers || [];
        const pick = (name: string) =>
          headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

        const html = extractHtmlFromPayload(msg.payload);
        const seeMoreUrl = extractSeeMoreLink(html);

        final.push({
          id: msg.id,
          threadId: msg.threadId,
          snippet: msg.snippet,
          subject: pick("Subject"),
          from: pick("From"),
          to: pick("To"),
          date: pick("Date"),
          seeMoreUrl,
        });
      }

      return final;
    } catch (err: any) {
      console.error("Error fetching inbox:", err.response?.data || err);
      throw new Error("Failed to fetch inbox messages");
    }
  }
}



